/**
 * PageHeaderSkeleton — placeholder for a section's page heading: title,
 * optional one-line description and an optional primary action (e.g. the
 * ledgers' "Add entry" button), stacked on mobile and in a row from `sm`.
 *
 * Usually paired with a body skeleton in a route's loading.tsx, so pass
 * `announce={false}` there and let the body announce.
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
  action = false,
  label = 'Loading page…',
  announce = true,
  className,
}: PageHeaderSkeletonProps) {
  return (
    <LoadingRegion label={label} announce={announce} className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          {description && <Skeleton className="h-4 w-72 max-w-full" />}
        </div>
        {action && <Skeleton className="h-10 w-full sm:w-32" />}
      </div>
    </LoadingRegion>
  )
}
