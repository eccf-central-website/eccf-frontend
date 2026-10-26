/**
 * Settings & Privileged Admin Tools — app/(dashboard)/dashboard/settings/page.tsx
 *
 * Implements privileged administration:
 * - Worker CSV roster upload and ingestion.
 * - Approved worker offboarding and deletion with safety verifications.
 * - Member directory sync pipeline.
 * - Gated to President and CSGB Admin via `canAccessSection(role, 'settings', session)`.
 */

import { redirect } from 'next/navigation'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import { requireSession } from '@/lib/dashboard/auth'
import { canAccessSection, canDeleteWorkers } from '@/lib/dashboard/rbac'
import { listWorkers } from '@/lib/dashboard/data'
import SettingsClient from '@/components/dashboard/settings/SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await requireSession()

  // Privileged authorization gate
  if (!canAccessSection(session.role, 'settings', session)) {
    redirect('/dashboard?denied=settings')
  }

  const workers = await listWorkers(session)
  const workerOptions = workers.map((w) => ({
    _id: w._id,
    fullName: w.fullName,
    team: w.team,
    status: w.isExcoApproved ? 'approved' : w.verifiedAt ? 'verified' : 'pending',
  }))

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <PageContainer>
      {/* Universal Page Header */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
        canDelete={canDeleteWorkers(session)}
        canImport={Boolean(session.access?.isPresident || session.role === 'admin' || session.access?.isCSGB)}
      />
    </PageContainer>
  )
}
