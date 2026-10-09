/**
 * Overview loading state — page header, the stat-card grid and the two
 * recent-activity cards. Also the fallback for any /dashboard/* segment
 * without its own loading.tsx. Renders inside the shell, so the sidebar
 * and top bar stay in place.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import FeedSkeleton from '@/components/dashboard/states/FeedSkeleton'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'

export default function DashboardLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton announce={false} />
      <StatGridSkeleton label="Loading dashboard…" />
      <div aria-hidden="true" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border bg-card shadow">
            <div className="h-14 border-b" />
            <FeedSkeleton items={3} search={false} announce={false} className="p-4 sm:p-5" />
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
