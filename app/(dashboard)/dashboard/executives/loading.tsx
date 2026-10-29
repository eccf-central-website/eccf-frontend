import PageContainer from '@/components/dashboard/shell/PageContainer'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'

export default function ExecutivesLoading() {
  return (
    <PageContainer>
      <LoadingRegion label="Loading executives…" announce={true}>
        <div className="space-y-6">
          {/* Date-only eyebrow + title + action, matching the finished header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32 rounded-md" />
              <Skeleton className="h-8 w-80 max-w-full rounded-xl sm:h-9" />
              <Skeleton className="h-4 w-full max-w-xl rounded-md" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl sm:w-52" />
          </div>

          {/* Fixed-row KPI cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex min-h-[136px] flex-col justify-between rounded-2xl bg-card p-4 sm:min-h-[148px] sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3.5 w-20 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-12 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            ))}
          </div>

          {/* Filter tabs + search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-[52px] w-full rounded-xl sm:w-96" />
            <Skeleton className="h-11 w-full rounded-xl sm:w-72" />
          </div>

          {/* Leader cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4 rounded-2xl bg-card p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-3 w-40 rounded-md" />
                  </div>
                </div>
                <div className="space-y-1.5 pt-2">
                  <Skeleton className="h-3 w-28 rounded-md" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </LoadingRegion>
    </PageContainer>
  )
}
