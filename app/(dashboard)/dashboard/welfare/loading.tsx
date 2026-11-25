/**
 * Welfare loading state — mirrors the page header, hub tabs, KPI strip,
 * toolbar, and care requests / ledger feed.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import FeedSkeleton from '@/components/dashboard/states/FeedSkeleton'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import { Skeleton } from '@/components/dashboard/ui/skeleton'

export default function WelfareLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton action={false} announce={false} />

      <LoadingRegion announce={false} className="space-y-6">
        <div className="inline-flex gap-1 rounded-[var(--radius-control)] bg-card p-1 shadow-sm">
          <Skeleton className="h-11 w-40 rounded-[calc(var(--radius-control)-2px)]" />
          <Skeleton className="h-11 w-44 rounded-[calc(var(--radius-control)-2px)]" />
        </div>

        <div className="rounded-[var(--radius-card)] bg-card p-1.5 shadow-sm sm:p-2">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-1.5">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-2 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-8 w-8 shrink-0 rounded-[var(--radius-control)]" />
                </div>
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-3.5 w-32 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </LoadingRegion>

      <FeedSkeleton label="Loading welfare workspace…" tabs items={4} />
    </PageContainer>
  )
}
