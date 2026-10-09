/**
 * RecentWelfare — the latest five welfare requests on the overview.
 *
 * Async Server Component; the page wraps it in its own <Suspense> and
 * BlockErrorBoundary so it streams independently of the stats. Renders
 * name, status and a relative date only; request details stay on the
 * welfare page. Status is a word in a badge, not just a colour.
 */

import { HeartHandshake } from 'lucide-react'
import type { ECCFSession } from '@/types'
import { getRecentWelfare } from '@/lib/dashboard/data/overview'
import { formatDate, formatRelativeDay, toDateTimeAttr } from '@/lib/dashboard/format'
import { cn } from '@/lib/utils'
import EmptyState from '@/components/dashboard/states/EmptyState'
import { Badge } from '@/components/dashboard/ui/badge'
import { ActivityItem, RelativeTime } from './ActivityList'

export default async function RecentWelfare({ session }: { session: ECCFSession }) {
  const rows = await getRecentWelfare(session)
  if (rows === null) return null

  if (rows.length === 0) {
    return (
      <EmptyState
        headingLevel="h4"
        icon={<HeartHandshake />}
        title="No welfare requests yet"
        description="Requests submitted through the Connect form will show up here."
        className="rounded-none border-0 bg-transparent py-10 sm:py-10"
      />
    )
  }

  return (
    <ul className="divide-y">
      {rows.map((w) => (
        <ActivityItem
          key={w._id}
          aside={
            <RelativeTime
              value={toDateTimeAttr(w.dateSubmitted)}
              title={formatDate(w.dateSubmitted)}
              label={formatRelativeDay(w.dateSubmitted)}
            />
          }
        >
          <p className="truncate text-sm font-medium text-foreground">{w.name}</p>
          <Badge
            variant={w.status === 'Pending' ? 'default' : 'secondary'}
            className={cn(
              'mt-1 shadow-none',
              w.status === 'Pending' && 'bg-warning text-warning-foreground hover:bg-warning'
            )}
          >
            {w.status}
          </Badge>
        </ActivityItem>
      ))}
    </ul>
  )
}
