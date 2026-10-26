/**
 * Announcements loading skeleton — /dashboard/announcements/loading.tsx
 * Mirrors the announcements list view with borderless tonal surfaces and theme-aware shimmer.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'

export default function AnnouncementsLoading() {
  return (
    <PageContainer>
      <LoadingRegion label="Loading announcements…" announce={true}>
        <div className="space-y-6">
          <PageHeaderSkeleton announce={false} action={true} />

          {/* Filter / Search Skeleton */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="h-11 w-36 shrink-0 rounded-xl" />
            <Skeleton className="h-11 w-44 shrink-0 rounded-xl" />
          </div>

          {/* Cards List Skeleton — borderless tonal cards */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-card shadow-sm border-0 p-5 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-4 w-28 rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-10 w-28 shrink-0 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </LoadingRegion>
    </PageContainer>
  )
}
