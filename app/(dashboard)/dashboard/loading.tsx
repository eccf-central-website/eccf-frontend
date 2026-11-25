/**
 * Dashboard Overview loading state — /dashboard/loading.tsx
 *
 * Implements the executive cockpit loading state:
 * - Theme-aware shimmer and borderless tonal surfaces.
 * - Mirrors the finished page geometry: Date eyebrow + greeting + action,
 *   "Do this now" attention queue, unified 4-metric pulse strip, and
 *   2-column 4-row hairline-divided activity lists.
 * - Single polite screen-reader announcement.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import { ActivityListSkeleton } from '@/components/dashboard/overview/ActivityList'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'
import { Skeleton } from '@/components/dashboard/ui/skeleton'

export default function DashboardLoading() {
  return (
    <PageContainer>
      <LoadingRegion label="Loading dashboard…" announce={true}>
        <div className="space-y-4 sm:space-y-6">
          {/* Page Header Skeleton */}
          <div
            aria-hidden="true"
            className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-32 rounded-md" />
              <Skeleton className="h-9 w-64 rounded-xl sm:h-10 sm:w-80" />
            </div>
            <Skeleton className="h-11 w-full shrink-0 rounded-[var(--radius-control)] sm:w-44" />
          </div>

          {/* Attention Queue Skeleton ("Do this now") */}
          <div aria-hidden="true" className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-5 w-6 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-28 rounded-md" />
            </div>

            <div className="divide-y divide-border/50 overflow-hidden rounded-2xl bg-card shadow-sm">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="flex flex-col justify-between gap-3.5 p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="flex items-start gap-3.5">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-40 rounded-md" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-3.5 w-64 max-w-full rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-11 w-full shrink-0 rounded-[var(--radius-control)] sm:w-40" />
                </div>
              ))}
            </div>
          </div>

          {/* Unified KPI Pulse Strip Skeleton (single row of <= 4 cards) */}
          <div aria-hidden="true" className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <Skeleton className="h-3.5 w-28 rounded-md" />
              <Skeleton className="h-3.5 w-24 rounded-md" />
            </div>
            <StatGridSkeleton
              count={4}
              gridClassName="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 lg:grid-cols-4"
              announce={false}
            />
          </div>

          {/* Side-by-side Activity Lists Skeleton (max 4 hairline-divided rows) */}
          <div aria-hidden="true" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border/50 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
                  <Skeleton className="h-5 w-40 rounded-md" />
                  <Skeleton className="h-4 w-16 rounded-md" />
                </div>
                <ActivityListSkeleton rows={4} announce={false} />
              </div>
            ))}
          </div>
        </div>
      </LoadingRegion>
    </PageContainer>
  )
}
