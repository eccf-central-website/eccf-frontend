/**
 * FeedSkeleton — placeholder for intake and pastoral feeds (first-timers,
 * welfare, prayer requests): an optional status-tab row (welfare's
 * Pending/Resolved), a search box, then one card per item with a title,
 * meta chips, summary lines, and a date.
 */

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import LoadingRegion from './LoadingRegion'

interface FeedSkeletonProps {
  items?: number
  /** Status tabs above the feed (welfare). */
  tabs?: boolean
  /** Search box above the feed; off for compact lists (overview activity). */
  search?: boolean
  label?: string
  announce?: boolean
  className?: string
}

const TITLE_WIDTHS = ['w-40', 'w-32', 'w-48', 'w-36']

export default function FeedSkeleton({
  items = 4,
  tabs = false,
  search = true,
  label = 'Loading feed…',
  announce = true,
  className,
}: FeedSkeletonProps) {
  return (
    <LoadingRegion label={label} announce={announce} className={cn('space-y-4', className)}>
      {tabs && (
        <div aria-hidden="true" className="flex gap-2">
          <Skeleton className="h-11 w-24 shrink-0 md:h-10" />
          <Skeleton className="h-11 w-24 shrink-0 md:h-10" />
        </div>
      )}
      {search && (
        <div aria-hidden="true">
          <Skeleton className="h-11 w-full sm:max-w-xs md:h-10" />
        </div>
      )}

      <ul aria-hidden="true" className="space-y-3">
        {Array.from({ length: items }, (_, i) => (
          <li key={i} className="rounded-2xl border-0 bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className={cn('h-5 max-w-[60%]', TITLE_WIDTHS[i % TITLE_WIDTHS.length])} />
              <Skeleton className="h-3.5 w-16 shrink-0" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
              <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/5" />
            </div>
          </li>
        ))}
      </ul>
    </LoadingRegion>
  )
}
