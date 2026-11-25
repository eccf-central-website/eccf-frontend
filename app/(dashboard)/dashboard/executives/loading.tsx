import PageContainer from '@/components/dashboard/shell/PageContainer'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'
import { Skeleton } from '@/components/dashboard/ui/skeleton'

export default function ExecutivesLoading() {
  return (
    <PageContainer>
      <LoadingRegion label="Loading executives…" announce={true}>
        <div className="space-y-6">
          <PageHeaderSkeleton announce={false} action={true} />
          <StatGridSkeleton count={4} announce={false} />

          {/* Filter tabs + search */}
          <div aria-hidden="true" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-12 w-full rounded-[var(--radius-control)] sm:w-[440px]" />
            <Skeleton className="h-11 w-full rounded-[var(--radius-control)] sm:w-72" />
          </div>

          {/* Leader cards */}
          <div aria-hidden="true" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4 rounded-[var(--radius-card)] bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-3.5 w-44 rounded-md" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-3.5 w-32 rounded-md" />
                  <Skeleton className="h-14 w-full rounded-[var(--radius-control)]" />
                  <Skeleton className="h-14 w-full rounded-[var(--radius-control)]" />
                </div>
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </LoadingRegion>
    </PageContainer>
  )
}
