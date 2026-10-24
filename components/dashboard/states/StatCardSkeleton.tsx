/**
 * StatCardSkeleton / StatGridSkeleton — placeholders for the overview stat
 * cards (feature/dashboard-overview). The grid + spans mirror the real one
 * (`OverviewStats` StatGroup: 2 columns from the base breakpoint, wider
 * card groups at `xl`), so nothing jumps when the cards stream in. Each
 * card mirrors the borderless StatCard: label + chip row, large figure,
 * short caption.
 */

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import LoadingRegion from './LoadingRegion'

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-card p-5 shadow-sm sm:p-6', className)}>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-32 shrink-0" />
        <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-8 w-20 shrink-0" />
      <Skeleton className="mt-3 h-3 w-40 shrink-0 max-w-full" />
    </div>
  )
}

interface StatGridSkeletonProps {
  /** Number of cards. */
  count?: number
  /** Tailwind grid-template classes matching the live group. */
  gridClassName?: string
  label?: string
  announce?: boolean
  className?: string
}

export function StatGridSkeleton({
  count = 4,
  gridClassName = 'grid grid-cols-2 gap-3 sm:gap-4',
  label = 'Loading statistics…',
  announce = true,
  className,
}: StatGridSkeletonProps) {
  return (
    <LoadingRegion label={label} announce={announce} className={className}>
      <div className={gridClassName}>
        {Array.from({ length: count }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </LoadingRegion>
  )
}
