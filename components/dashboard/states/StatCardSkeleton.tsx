/**
 * StatCardSkeleton / StatGridSkeleton — placeholders for the overview stat
 * cards (feature/dashboard-overview). The grid matches the real one:
 * 1 column, 2 from `sm`, 4 from `xl`. Each card mirrors a Card with a
 * label + icon row, a large figure and a short caption.
 */

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import LoadingRegion from './LoadingRegion'

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border bg-card p-6 shadow', className)}>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-3 h-3 w-40 max-w-full" />
    </div>
  )
}

interface StatGridSkeletonProps {
  /** Number of cards; the overview shows up to 4 per role. */
  count?: number
  label?: string
  announce?: boolean
  className?: string
}

export function StatGridSkeleton({
  count = 4,
  label = 'Loading statistics…',
  announce = true,
  className,
}: StatGridSkeletonProps) {
  return (
    <LoadingRegion label={label} announce={announce} className={className}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </LoadingRegion>
  )
}
