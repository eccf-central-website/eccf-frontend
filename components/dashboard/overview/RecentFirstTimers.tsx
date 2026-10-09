/**
 * RecentFirstTimers — the latest five first-timers on the overview.
 *
 * Async Server Component; the page wraps it in its own <Suspense> and
 * BlockErrorBoundary so it streams independently of the stats. Renders
 * name, department/level/hall and a relative visit date only.
 */

import { UserPlus } from 'lucide-react'
import type { ECCFSession } from '@/types'
import { getRecentFirstTimers } from '@/lib/dashboard/data/overview'
import { formatDate, formatRelativeDay, toDateTimeAttr } from '@/lib/dashboard/format'
import EmptyState from '@/components/dashboard/states/EmptyState'
import { ActivityItem, RelativeTime } from './ActivityList'

export default async function RecentFirstTimers({ session }: { session: ECCFSession }) {
  const rows = await getRecentFirstTimers(session)
  if (rows === null) return null

  if (rows.length === 0) {
    return (
      <EmptyState
        headingLevel="h4"
        icon={<UserPlus />}
        title="No first-timers yet"
        description="People who fill in the Connect form will show up here."
        className="rounded-none border-0 bg-transparent py-10 sm:py-10"
      />
    )
  }

  return (
    <ul className="divide-y">
      {rows.map((ft) => {
        const meta = [ft.department, ft.level && `${ft.level} level`, ft.hall].filter(Boolean).join(' · ')
        return (
          <ActivityItem
            key={ft._id}
            aside={
              <RelativeTime
                value={toDateTimeAttr(ft.dateVisited)}
                title={formatDate(ft.dateVisited)}
                label={formatRelativeDay(ft.dateVisited)}
              />
            }
          >
            <p className="truncate text-sm font-medium text-foreground">{ft.fullName}</p>
            {meta && <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>}
          </ActivityItem>
        )
      })}
    </ul>
  )
}
