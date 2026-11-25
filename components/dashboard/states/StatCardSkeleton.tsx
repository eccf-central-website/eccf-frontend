/**
 * StatCardSkeleton / StatGridSkeleton — placeholders for the aligned KPI pulse cards.
 * Mirrors the exact label/figure/caption row geometry of StatCard.tsx.
 */

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import LoadingRegion from './LoadingRegion'

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-[136px] flex-col justify-between rounded-2xl border-0 bg-card p-4 shadow-sm sm:min-h-[148px] sm:p-5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-24 shrink-0 rounded-md" />
        <Skeleton className="h-8 w-8 shrink-0 rounded-xl sm:h-9 sm:w-9" />
      </div>
      <div className="my-1">
        <Skeleton className="h-7 w-24 shrink-0 rounded-md sm:h-8" />
      </div>
      <div className="flex flex-col gap-1">
        <Skeleton className="h-3.5 w-32 shrink-0 rounded-md" />
      </div>
    </div>
  )
}

interface StatGridSkeletonProps {
  count?: number
  gridClassName?: string
  label?: string
  announce?: boolean
  className?: string
}

export function StatGridSkeleton({
  count = 4,
  gridClassName = 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4',
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
