/**
 * First-Timers loading state — mirrors the page header, KPI strip,
 * toolbar, and follow-up table/cards layout.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'
import { Skeleton } from '@/components/dashboard/ui/skeleton'

export default function FirstTimersLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton action={false} announce={false} />

      <LoadingRegion announce={false}>
        <div className="rounded-[var(--radius-card)] bg-card p-1.5 shadow-sm sm:p-2">
          <div className="grid grid-cols-2 gap-1 sm:gap-1.5 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-8 w-8 shrink-0 rounded-[var(--radius-control)]" />
                </div>
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-3.5 w-28 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </LoadingRegion>

      <TableSkeleton rows={6} columns={5} pagination={false} label="Loading first-timers…" />
    </PageContainer>
  )
}
