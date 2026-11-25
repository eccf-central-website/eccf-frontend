/**
 * AttentionQueue — "Do this now" executive action queue.
 *
 * Implements the role-prioritised urgency queue driven 100% by live Sanity data:
 * - Queries actual pending items: executive onboarding, worker verifications,
 *   member directory anomalies, welfare follow-ups, and first-timers contact.
 * - Zero mock data.
 * - Touch-safe 44px action pills.
 * - Role-aware "You’re all caught up" empty state with a useful next destination.
 * - Failed data sources are surfaced instead of masquerading as "all clear".
 */

import Link from 'next/link'
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Users,
  HeartHandshake,
  UserPlus,
  CalendarCheck,
} from 'lucide-react'
import type { ECCFSession } from '@/types'
import { getLiveAttentionItems } from '@/lib/dashboard/data/overview'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import { cn } from '@/lib/utils'

const ICON_MAP = {
  Shield,
  Users,
  HeartHandshake,
  UserPlus,
  CalendarCheck,
}

export function AttentionQueueSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-28 rounded-md" />
      </div>

      <div className="divide-y divide-border/50 overflow-hidden rounded-2xl bg-card shadow-sm">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between gap-3.5 p-4 sm:flex-row sm:items-center sm:p-5"
          >
            <div className="flex items-start gap-3.5">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-40 rounded-md" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-64 max-w-full rounded-md" />
              </div>
            </div>
            <Skeleton className="h-11 w-full shrink-0 rounded-[var(--radius-control)] sm:w-40" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function AttentionQueue({
  session,
}: {
  session: ECCFSession & {
    access?: { isPresident?: boolean; isCSGB?: boolean; canApproveExecutives?: boolean }
  }
}) {
  const { items, failedSources, emptyAction } = await getLiveAttentionItems(session)

  if (items.length === 0) {
    return (
      <section aria-labelledby="attention-empty-heading" className="rounded-2xl bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            </div>
            <div className="min-w-0">
              <h2
                id="attention-empty-heading"
                className="font-sans text-base font-semibold text-foreground [text-wrap:balance]"
              >
                {failedSources.length > 0 ? 'Nothing else needs you right now' : 'You’re all caught up'}
              </h2>
              <p className="mt-1 max-w-[75ch] text-sm leading-relaxed text-muted-foreground [text-wrap:pretty]">
                {failedSources.length > 0
                  ? 'Some data sources could not be checked, so this queue may be incomplete.'
                  : 'No pending approvals, appointments, or urgent operational tasks require your attention right now.'}
              </p>
              {failedSources.length > 0 && (
                <p className="mt-2 inline-flex items-start gap-1.5 rounded-[var(--radius-control)] bg-warning/20 px-2.5 py-1.5 text-[13px] font-medium text-warning-foreground dark:bg-warning/15 dark:text-warning">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Could not load: {failedSources.join(', ')}.</span>
                </p>
              )}
            </div>
          </div>

          {emptyAction && (
            <Link
              href={emptyAction.href}
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors [touch-action:manipulation] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:w-auto"
            >
              <span>{emptyAction.label}</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </Link>
          )}
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="attention-queue-heading" className="space-y-2">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div className="flex items-center gap-2">
          <h2
            id="attention-queue-heading"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Do this now
          </h2>
          <span
            aria-label={`${items.length} items awaiting action`}
            className="inline-flex items-center justify-center rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold tabular-nums text-warning-foreground dark:bg-warning/15 dark:text-warning"
          >
            {items.length}
          </span>
        </div>
        <span className="text-[13px] font-medium text-muted-foreground">Sorted by urgency</span>
      </div>

      <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl bg-card shadow-sm">
        {items.map((item) => {
          const Icon = ICON_MAP[item.iconName] || Users
          const isHigh = item.urgency === 'high'

          return (
            <li
              key={item.id}
              className="flex flex-col justify-between gap-3.5 p-4 transition-colors hover:bg-surface-raised/60 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="flex min-w-0 items-start gap-3.5">
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    isHigh
                      ? 'bg-warning/20 text-warning-foreground dark:bg-warning/15 dark:text-warning'
                      : 'bg-primary/10 text-accent-foreground dark:text-primary'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-sans text-sm font-semibold leading-snug text-foreground sm:text-base">
                      {item.title}
                    </h3>
                    {isHigh && <StatusBadge variant="warning">Urgent</StatusBadge>}
                  </div>
                  <p className="mt-1 line-clamp-2 max-w-[75ch] text-sm leading-relaxed text-muted-foreground [text-wrap:pretty]">
                    {item.detail}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end pt-0.5 sm:pt-0">
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors [touch-action:manipulation] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:w-auto"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                </Link>
              </div>
            </li>
          )
        })}
      </ul>

      {failedSources.length > 0 && (
        <p className="inline-flex items-start gap-1.5 rounded-[var(--radius-control)] bg-warning/20 px-3 py-2 text-[13px] font-medium text-warning-foreground dark:bg-warning/15 dark:text-warning">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Some data could not load: {failedSources.join(', ')}. The queue may be incomplete.</span>
        </p>
      )}
    </section>
  )
}
