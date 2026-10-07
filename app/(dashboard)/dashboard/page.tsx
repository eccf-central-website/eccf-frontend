/**
 * Dashboard Overview — /dashboard
 *
 * The header renders straight away; the stats stream in behind <Suspense>
 * with a StatGridSkeleton, show an EmptyState when everything is zero, and
 * fall through to dashboard/error.tsx on failure. The real stat cards and
 * recent activity arrive in feature/dashboard-overview.
 *
 * Also the landing spot for requireSection() denials (`?denied=<section>`),
 * which DeniedToast turns into a one-off toast.
 */

import { Suspense } from 'react'
import { requireSession } from '@/lib/dashboard/auth'
import { ROLE_LABELS } from '@/lib/dashboard/rbac'
import DeniedToast from '@/components/dashboard/shell/DeniedToast'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import OverviewStats from '@/components/dashboard/overview/OverviewStats'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'
import { Badge } from '@/components/dashboard/ui/badge'

export const dynamic = 'force-dynamic'

export default async function DashboardOverviewPage() {
  const session = await requireSession()

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
      <Suspense fallback={<StatGridSkeleton label="Loading statistics…" />}>
        <OverviewStats session={session} />
      </Suspense>
    </PageContainer>
  )
}
