/**
 * Dashboard Overview loading state — /dashboard/loading.tsx
 *
 * Implements the executive cockpit loading state:
 * - Theme-aware shimmer and borderless tonal surfaces.
 * - Mirrors the finished page geometry: Date eyebrow + greeting + action,
 *   "Do this now" attention queue, 4-metric pulse strip, and 2-column activity lists.
 * - Single polite screen-reader announcement.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'
import FeedSkeleton from '@/components/dashboard/states/FeedSkeleton'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'

export default function DashboardLoading() {
  return (
    <PageContainer>
      <LoadingRegion label="Loading dashboard…" announce={true}>
        <div className="space-y-6">
          {/* Page Header Skeleton */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-40 rounded-md" />
              <Skeleton className="h-9 w-64 rounded-xl sm:h-10 sm:w-80" />
            </div>
            <Skeleton className="h-11 w-full sm:w-44 shrink-0 rounded-xl" />
          </div>

          {/* Attention Queue Skeleton ("Do this now") */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-5 w-6 rounded-full" />
              </div>
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>

            <div className="rounded-2xl bg-card shadow-sm border-0 divide-y divide-border/20 overflow-hidden">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3">
                  <div className="flex items-start gap-3.5">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-56 max-w-full rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-11 w-full sm:w-36 shrink-0 rounded-xl" />
                </div>
              ))}
            </div>
          </div>

          {/* KPI Pulse Strip Skeleton */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
            <StatGridSkeleton count={4} announce={false} />
          </div>

          {/* Side-by-side Activity Lists Skeleton */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl bg-card shadow-sm border-0 overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/20 px-4 py-3.5 sm:px-5">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
                <FeedSkeleton items={3} search={false} announce={false} className="p-4 sm:p-5" />
              </div>
            ))}
          </div>
        </div>
      </LoadingRegion>
    </PageContainer>
  )
}
