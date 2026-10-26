/**
 * StatCardSkeleton / StatGridSkeleton — placeholders for the aligned KPI pulse cards.
 * Mirrors the exact label/figure/caption row geometry of StatCard.tsx.
 */

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import LoadingRegion from './LoadingRegion'

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-card p-4 sm:p-5 shadow-sm border-0 flex flex-col justify-between min-h-[134px]', className)}>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3.5 w-24 shrink-0 rounded-md" />
        <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
      </div>
      <div className="my-2">
        <Skeleton className="h-8 w-20 shrink-0 rounded-md" />
      </div>
      <div className="flex flex-col gap-1">
        <Skeleton className="h-3 w-32 shrink-0 rounded-md" />
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
