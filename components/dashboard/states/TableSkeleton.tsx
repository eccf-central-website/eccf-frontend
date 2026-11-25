/**
 * TableSkeleton — placeholder for data tables.
 *
 * Implements the calm, borderless tonal loading state:
 * - Uses shadow and tonal background steps instead of conspicuous dark borders.
 * - Responsive layout mirrors desktop table vs stacked mobile cards.
 */

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import LoadingRegion from './LoadingRegion'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  /** Search box + filter selects above the table. */
  toolbar?: boolean
  pagination?: boolean
  label?: string
  announce?: boolean
  className?: string
}

// Varied widths so the placeholder reads as data, not stripes.
const CELL_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-1/3', 'w-3/5']

export default function TableSkeleton({
  rows = 6,
  columns = 5,
  toolbar = true,
  pagination = true,
  label = 'Loading table…',
  announce = true,
  className,
}: TableSkeletonProps) {
  const rowKeys = Array.from({ length: rows }, (_, i) => i)
  const colKeys = Array.from({ length: columns }, (_, i) => i)

  return (
    <LoadingRegion label={label} announce={announce} className={cn('space-y-4', className)}>
      {toolbar && (
        <div aria-hidden="true" className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-11 w-full sm:max-w-xs md:h-10" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-28 shrink-0 md:h-10" />
            <Skeleton className="h-11 w-28 shrink-0 md:h-10" />
          </div>
        </div>
      )}

      {/* md+: table — borderless tonal surface */}
      <div
        aria-hidden="true"
        className="hidden overflow-hidden rounded-2xl border-0 bg-card shadow-sm md:block"
      >
        <div className="flex items-center gap-4 bg-muted/40 px-4 py-3.5">
          {colKeys.map((c) => (
            <Skeleton key={c} className="h-3.5 flex-1" />
          ))}
        </div>
        {rowKeys.map((r) => (
          <div key={r} className="flex h-12 items-center gap-4 border-0 px-4">
            {colKeys.map((c) => (
              <div key={c} className="flex-1">
                <Skeleton className={cn('h-4', CELL_WIDTHS[(r + c) % CELL_WIDTHS.length])} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* below md: stacked cards — borderless tonal cards */}
      <div aria-hidden="true" className="space-y-3 md:hidden">
        {rowKeys.map((r) => (
          <div key={r} className="rounded-2xl border-0 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className={cn('h-4', CELL_WIDTHS[r % CELL_WIDTHS.length])} />
                <Skeleton className="h-3.5 w-1/3" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
          </div>
        ))}
      </div>

      {pagination && (
        <div aria-hidden="true" className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-28 shrink-0" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-11 shrink-0 md:h-10 md:w-10" />
            <Skeleton className="h-11 w-11 shrink-0 md:h-10 md:w-10" />
          </div>
        </div>
      )}
    </LoadingRegion>
  )
}
