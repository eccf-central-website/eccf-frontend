/**
 * ActivityList — card shell for an overview recent-activity list: heading,
 * "View all" link to the full feed, and a body that streams in separately.
 *
 * The heading and link don't depend on data, so the page renders this
 * shell immediately and puts only the body behind <Suspense>.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/dashboard/ui/skeleton'

interface ActivityListProps {
  id: string
  title: string
  viewAllHref: string
  /** Completes "View all" for screen readers, e.g. "first-timers". */
  viewAllNoun: string
  children: React.ReactNode
}

export default function ActivityList({ id, title, viewAllHref, viewAllNoun, children }: ActivityListProps) {
  return (
    <section
      aria-labelledby={id}
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-card text-card-foreground shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <h2 id={id} className="font-sans text-lg font-semibold text-foreground [text-wrap:balance]">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] px-2.5 text-sm font-medium text-primary underline-offset-4 transition-colors [touch-action:manipulation] hover:bg-surface-raised hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:min-h-10"
        >
          View all<span className="sr-only"> {viewAllNoun}</span>
          <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
        </Link>
      </div>
      <div className="flex-1">{children}</div>
    </section>
  )
}

/** One row: primary text + meta on the left, a date (or status) on the right. */
export function ActivityItem({ children, aside }: { children: React.ReactNode; aside: React.ReactNode }) {
  return (
    <li className="flex items-start justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-right text-[13px] text-muted-foreground">
        {aside}
      </div>
    </li>
  )
}

/** <time> with a relative label and the absolute date as a tooltip. */
export function RelativeTime({ value, label, title }: { value: string; label: string; title: string }) {
  return (
    <time dateTime={value} title={title}>
      {label}
    </time>
  )
}

const TITLE_WIDTHS = ['w-36', 'w-44', 'w-32', 'w-40']
const META_WIDTHS = ['w-48', 'w-36', 'w-44', 'w-40']

/** Hairline-divided body placeholder matching ActivityItem geometry. */
export function ActivityListSkeleton({
  rows = 4,
  announce = false,
  label = 'Loading recent activity…',
}: {
  rows?: number
  announce?: boolean
  label?: string
}) {
  return (
    <div
      role={announce ? 'status' : undefined}
      aria-live={announce ? 'polite' : undefined}
      aria-busy={announce ? true : undefined}
      aria-label={announce ? label : undefined}
    >
      {announce && <span className="sr-only">{label}</span>}
      <ul aria-hidden="true" className="divide-y divide-border/50">
        {Array.from({ length: rows }, (_, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton
                className={cn('h-4 max-w-[75%] rounded-md', TITLE_WIDTHS[i % TITLE_WIDTHS.length])}
              />
              <Skeleton
                className={cn('h-3.5 max-w-[85%] rounded-md', META_WIDTHS[i % META_WIDTHS.length])}
              />
            </div>
            <Skeleton className="h-3.5 w-16 shrink-0 rounded-md" />
          </li>
        ))}
      </ul>
    </div>
  )
}
