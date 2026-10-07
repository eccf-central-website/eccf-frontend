/**
 * Overview loading state — page header + the stat-card grid. Also the
 * fallback for any /dashboard/* segment without its own loading.tsx.
 * Renders inside the shell, so the sidebar and top bar stay in place.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'

export default function DashboardLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton announce={false} />
      <StatGridSkeleton label="Loading dashboard…" />
    </PageContainer>
  )
}
