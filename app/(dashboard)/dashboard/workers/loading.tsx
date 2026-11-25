/**
 * Workers loading state — /dashboard/workers/loading.tsx
 * Mirrors the unified layout: PageHeader, 3-tile KpiStrip, segmented tabs,
 * DataToolbar, and responsive TableSkeleton (border-0, h-11 md:h-10).
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'
import { Skeleton } from '@/components/dashboard/ui/skeleton'

export default function WorkersLoading() {
  return (
    <PageContainer>
      <LoadingRegion label="Loading workers…" announce={true} className="space-y-6">
        {/* PageHeader skeleton */}
        <div
          aria-hidden="true"
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4"
        >
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32 rounded-md border-0" />
            <Skeleton className="h-9 w-40 rounded-xl border-0 sm:h-10" />
            <Skeleton className="h-4 w-72 max-w-full rounded-md border-0" />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <Skeleton className="h-11 w-full rounded-[var(--radius-control)] border-0 sm:w-44 md:h-10" />
            <Skeleton className="h-11 w-full rounded-[var(--radius-control)] border-0 sm:w-36 md:h-10" />
          </div>
        </div>

        {/* KpiStrip skeleton */}
        <div
          aria-hidden="true"
          className="rounded-[var(--radius-card)] border-0 bg-card p-1.5 shadow-sm sm:p-2"
        >
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-1.5">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between gap-2 rounded-[calc(var(--radius-card)-4px)] border-0 p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-4 w-20 rounded-md border-0" />
                  <Skeleton className="h-8 w-8 rounded-[var(--radius-control)] border-0" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-7 w-14 rounded-md border-0" />
                  <Skeleton className="h-3.5 w-28 rounded-md border-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Segmented tabs skeleton */}
        <div
          aria-hidden="true"
          className="flex w-full gap-1 rounded-[var(--radius-card)] border-0 bg-card p-1.5 shadow-sm sm:inline-flex sm:w-auto"
        >
          <Skeleton className="h-11 flex-1 rounded-[calc(var(--radius-card)-4px)] border-0 sm:w-32 sm:flex-none" />
          <Skeleton className="h-11 flex-1 rounded-[calc(var(--radius-card)-4px)] border-0 sm:w-32 sm:flex-none" />
          <Skeleton className="h-11 flex-1 rounded-[calc(var(--radius-card)-4px)] border-0 sm:w-24 sm:flex-none" />
        </div>

        {/* DataToolbar + TableSkeleton */}
        <TableSkeleton
          label="Loading workers directory…"
          columns={5}
          rows={6}
          announce={false}
        />
      </LoadingRegion>
    </PageContainer>
  )
}
