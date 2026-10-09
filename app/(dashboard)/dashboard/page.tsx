/**
 * Dashboard Overview — /dashboard
 *
 * The header renders straight away. Each data block then streams on its
 * own: it has its own <Suspense> skeleton and its own BlockErrorBoundary,
 * so one slow or failing source never holds up or takes down the rest.
 * Errors outside those blocks still fall through to dashboard/error.tsx.
 *
 * RBAC is decided here on the server: the stat groups come pre-filtered
 * from getOverviewStats(), and the skeleton is sized to the role's cards.
 *
 * Also the landing spot for requireSection() denials (`?denied=<section>`),
 * which DeniedToast turns into a one-off toast.
 */

import { Suspense } from 'react'
import { requireSession } from '@/lib/dashboard/auth'
import { hasPermission, ROLE_LABELS } from '@/lib/dashboard/rbac'
import DeniedToast from '@/components/dashboard/shell/DeniedToast'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import OverviewStats, { FINANCE_CARD_COUNT, PEOPLE_CARD_COUNT } from '@/components/dashboard/overview/OverviewStats'
import BlockErrorBoundary from '@/components/dashboard/states/BlockErrorBoundary'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'
import { Badge } from '@/components/dashboard/ui/badge'

export const dynamic = 'force-dynamic'

export default async function DashboardOverviewPage() {
  const session = await requireSession()
  const statCount =
    (hasPermission(session.role, 'stats:people') ? PEOPLE_CARD_COUNT : 0) +
    (hasPermission(session.role, 'stats:finance') ? FINANCE_CARD_COUNT : 0)

  return (
    <PageContainer>
      <Suspense fallback={null}>
        <DeniedToast />
      </Suspense>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-2xl text-foreground">Welcome back</h2>
          <Badge>{ROLE_LABELS[session.role]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across the fellowship.</p>
      </div>
      <BlockErrorBoundary title="Statistics couldn't load">
        <Suspense fallback={<StatGridSkeleton count={statCount} label="Loading statistics…" />}>
          <OverviewStats session={session} />
        </Suspense>
      </BlockErrorBoundary>
    </PageContainer>
  )
}
