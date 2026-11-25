/**
 * Settings & Privileged Admin Tools — app/(dashboard)/dashboard/settings/page.tsx
 *
 * Implements privileged administration:
 * - Worker CSV roster upload and ingestion.
 * - Approved worker offboarding and deletion with safety verifications.
 * - Member directory sync pipeline.
 * - Gated to the President, VP Admin, or an explicitly authorised executive
 *   approver via `canAccessSection(role, 'settings', session)`.
 */

import { redirect } from 'next/navigation'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import SettingsClient from '@/components/dashboard/settings/SettingsClient'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { requireSession } from '@/lib/dashboard/auth'
import { listWorkers } from '@/lib/dashboard/data'
import { lagosDate } from '@/lib/dashboard/dates'
import { formatDate } from '@/lib/dashboard/format'
import { canAccessSection, hasPermission } from '@/lib/dashboard/rbac'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await requireSession()

  // Privileged authorization gate: President, VP Admin, or an explicitly
  // authorised executive approver. General CSGB membership is not enough.
  if (!canAccessSection(session.role, 'settings', session)) {
    redirect('/dashboard?denied=settings')
  }

  const workers = await listWorkers(session)
  const workerOptions = workers
    .filter((w) => w.isExcoApproved)
    .map((w) => ({
      _id: w._id,
      fullName: w.fullName,
      team: w.team,
      status: w.isExcoApproved ? 'approved' : w.verifiedAt ? 'verified' : 'pending',
    }))

  const canImport = hasPermission(session.role, 'workers:import', session)
  const canDelete = hasPermission(session.role, 'workers:delete', session)
  const today = formatDate(lagosDate())

  return (
    <PageContainer>
      <PageHeader
        eyebrow={today}
        title="Settings & Admin Tools"
        description="Privileged operational tools for fellowship workforce rosters and member databases."
      />

      <SettingsClient
        workers={workerOptions}
        canDelete={canDelete}
        canImport={canImport}
      />
    </PageContainer>
  )
}
