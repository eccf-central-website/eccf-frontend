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
import { requireSession } from '@/lib/dashboard/auth'
import { canAccessSection, hasPermission } from '@/lib/dashboard/rbac'
import { listWorkers } from '@/lib/dashboard/data'
import SettingsClient from '@/components/dashboard/settings/SettingsClient'

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

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <PageContainer>
      {/* Universal Page Header */}
      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {todayStr}
        </p>
        <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Settings & Admin Tools
        </h1>
        <p className="text-sm text-muted-foreground">
          Privileged operational tools for fellowship workforce rosters and member databases.
        </p>
      </div>

      <SettingsClient
        workers={workerOptions}
        canDelete={canDelete}
        canImport={canImport}
      />
    </PageContainer>
  )
}
