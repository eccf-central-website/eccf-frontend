/**
 * FeedSkeleton — placeholder for the F3 intake feeds (first-timers,
 * welfare, prayer requests): an optional status-tab row (welfare's
 * Pending/Resolved), a search box, then one card per item with a title,
 * meta chips, a couple of text lines and a date.
 */

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import LoadingRegion from './LoadingRegion'

interface FeedSkeletonProps {
  items?: number
  /** Status tabs above the feed (welfare). */
  tabs?: boolean
  label?: string
  announce?: boolean
  className?: string
}

const TITLE_WIDTHS = ['w-40', 'w-32', 'w-48', 'w-36']

export default function FeedSkeleton({
  items = 4,
  tabs = false,
  label = 'Loading feed…',
  announce = true,
  className,
}: FeedSkeletonProps) {
  return (
    <LoadingRegion label={label} announce={announce} className={cn('space-y-4', className)}>
      {tabs && (
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
      <Skeleton className="h-10 w-full sm:max-w-xs" />

      <ul className="space-y-3">
        {Array.from({ length: items }, (_, i) => (
          <li key={i} className="rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className={cn('h-5 max-w-[60%]', TITLE_WIDTHS[i % TITLE_WIDTHS.length])} />
              <Skeleton className="h-3 w-16 shrink-0" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </li>
        ))}
      </ul>
    </LoadingRegion>
  )
}
