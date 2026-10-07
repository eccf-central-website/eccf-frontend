/**
 * TableSkeleton — placeholder for the F3 DataTable (Worker CRM and the
 * attendance/finance ledgers).
 *
 * Mirrors the DataTable's responsive switch: from `md` it renders a toolbar
 * (search + filters), a header row, body rows and pagination; below `md`
 * the same rows become stacked cards, as the real table does on mobile.
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full sm:max-w-xs" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      )}

      {/* md+: table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <div className="flex items-center gap-4 border-b bg-muted/50 px-4 py-3">
          {colKeys.map((c) => (
            <Skeleton key={c} className="h-3 flex-1 bg-primary/15" />
          ))}
        </div>
        {rowKeys.map((r) => (
          <div key={r} className="flex h-14 items-center gap-4 border-b px-4 last:border-0">
            {colKeys.map((c) => (
              <div key={c} className="flex-1">
                <Skeleton className={cn('h-4', CELL_WIDTHS[(r + c) % CELL_WIDTHS.length])} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* below md: stacked cards */}
      <div className="space-y-3 md:hidden">
        {rowKeys.map((r) => (
          <div key={r} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className={cn('h-4', CELL_WIDTHS[r % CELL_WIDTHS.length])} />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>

      {pagination && (
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      )}
    </LoadingRegion>
  )
}
