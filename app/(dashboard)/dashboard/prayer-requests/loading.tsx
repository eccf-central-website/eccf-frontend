/**
 * Prayer Requests loading state — mirrors the page header, 2-signal KPI strip,
 * toolbar, and intercession feed cards.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import FeedSkeleton from '@/components/dashboard/states/FeedSkeleton'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import { Skeleton } from '@/components/dashboard/ui/skeleton'

export default function PrayerRequestsLoading() {
  return (
    <PageContainer>
      <LoadingRegion label="Loading prayer requests…" announce={true}>
        <div className="space-y-6">
          <PageHeaderSkeleton announce={false} action={false} />

          {/* 2-signal KpiStrip skeleton */}
          <div
            aria-hidden="true"
            className="rounded-[var(--radius-card)] bg-card p-1.5 shadow-sm sm:p-2"
          >
            <div className="grid grid-cols-1 gap-1 min-[420px]:grid-cols-2 sm:gap-1.5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2.5 p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3.5 w-28 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-[var(--radius-control)]" />
                  </div>
                  <Skeleton className="h-7 w-20 rounded-md" />
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          <FeedSkeleton announce={false} label="Loading prayer requests…" />
        </div>
      </LoadingRegion>
    </PageContainer>
  )
}
