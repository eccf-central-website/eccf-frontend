/**
 * Announcements loading skeleton state — mirrors the cards and header layout.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'

export default function AnnouncementsLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton announce={false} action />

      {/* Filter / Search Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <div className="h-10 bg-muted/60 rounded-md flex-1 animate-pulse" />
        <div className="h-10 w-36 bg-muted/60 rounded-md animate-pulse" />
        <div className="h-10 w-44 bg-muted/60 rounded-md animate-pulse" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card p-5 space-y-4 animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="h-5 w-24 bg-muted rounded-full" />
              <div className="h-5 w-14 bg-muted rounded-md" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted/60 rounded" />
            </div>
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="h-3 w-40 bg-muted/50 rounded" />
              <div className="h-3 w-48 bg-muted/50 rounded" />
            </div>
            <div className="pt-2 border-t border-border/40 flex justify-between items-center">
              <div className="h-4 w-28 bg-muted/40 rounded" />
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-muted rounded" />
                <div className="h-8 w-8 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
