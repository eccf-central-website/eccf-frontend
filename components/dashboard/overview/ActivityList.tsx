/**
 * ActivityList — card shell for an overview recent-activity list: heading,
 * "View all" link to the full feed, and a body that streams in separately.
 *
 * The heading and link don't depend on data, so the page renders this
 * shell immediately and puts only the body behind <Suspense>.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

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
    <section aria-labelledby={id} className="flex min-w-0 flex-col rounded-xl border bg-card text-card-foreground shadow">
      <div className="flex items-center justify-between gap-4 border-b px-4 py-2 sm:px-5">
        <h3 id={id} className="font-serif text-lg text-foreground">
          {title}
        </h3>
        <Link
          href={viewAllHref}
          className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all<span className="sr-only"> {viewAllNoun}</span>
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex-1">{children}</div>
    </section>
  )
}

/** One row: primary text + meta on the left, a date (or status) on the right. */
export function ActivityItem({ children, aside }: { children: React.ReactNode; aside: React.ReactNode }) {
  return (
    <li className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5">
      <div className="min-w-0">{children}</div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-right text-xs text-muted-foreground">{aside}</div>
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
