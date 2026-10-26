/**
 * PageHeaderSkeleton — placeholder for a section's page heading:
 * date-only eyebrow, title, optional subtitle, and optional 44px primary action button.
 */

import { Skeleton } from '@/components/dashboard/ui/skeleton'
import LoadingRegion from './LoadingRegion'

interface PageHeaderSkeletonProps {
  description?: boolean
  action?: boolean
  label?: string
  announce?: boolean
  className?: string
}

export default function PageHeaderSkeleton({
  description = true,
  action = true,
  label = 'Loading page…',
  announce = true,
  className,
}: PageHeaderSkeletonProps) {
  return (
    <LoadingRegion label={label} announce={announce} className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          {/* Date eyebrow */}
          <Skeleton className="h-3.5 w-40 rounded-md" />
          {/* Main title */}
          <Skeleton className="h-9 w-64 rounded-xl sm:h-10 sm:w-80" />
          {/* Description */}
          {description && <Skeleton className="h-4 w-80 max-w-full rounded-md" />}
        </div>
        {action && <Skeleton className="h-11 w-full sm:w-44 shrink-0 rounded-xl" />}
      </div>
    </LoadingRegion>
  )
}
