/**
 * AttentionQueue — "Do this now" executive action queue.
 *
 * Implements the role-prioritised urgency queue driven 100% by live Sanity data:
 * - Queries actual pending items: executive onboarding, worker verifications,
 *   member directory anomalies, welfare follow-ups, and first-timers contact.
 * - Zero mock data.
 * - Touch-safe 44px action pills.
 * - Role-aware "All caught up" empty state with a useful next destination.
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

const ICON_MAP = {
  Shield,
  Users,
  HeartHandshake,
  UserPlus,
  CalendarCheck,
}

export function AttentionQueueSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
        <Skeleton className="h-3 w-28 rounded-md" />
      </div>

      <div className="overflow-hidden divide-y divide-border/10 rounded-2xl bg-card">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex items-start gap-3.5">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-64 max-w-full rounded-md" />
              </div>
            </div>
            <Skeleton className="h-11 w-full shrink-0 rounded-xl sm:w-36" />
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
      <div className="rounded-2xl bg-card p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground sm:text-base">
                {failedSources.length > 0 ? 'Nothing else needs you right now' : 'You’re all caught up'}
              </h2>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-[15px]">
                {failedSources.length > 0
                  ? 'Some data sources could not be checked, so this queue may be incomplete.'
                  : 'No pending approvals, appointments, or urgent operational tasks require your attention right now.'}
              </p>
              {failedSources.length > 0 && (
                <p className="mt-1 flex items-start gap-1.5 text-xs font-medium text-[var(--brand-gold)]">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>Could not load: {failedSources.join(', ')}.</span>
                </p>
              )}
            </div>
          </div>

          {emptyAction && (
            <Link
              href={emptyAction.href}
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto sm:text-sm"
            >
              <span>{emptyAction.label}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <section aria-labelledby="attention-queue-heading" className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <h2
            id="attention-queue-heading"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Do this now
          </h2>
          <span className="inline-flex items-center justify-center rounded-full bg-[var(--brand-gold)]/15 px-2 py-0.5 text-[11px] font-bold text-[var(--brand-gold)]">
            {items.length}
          </span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">Sorted by urgency</span>
      </div>

      <div className="overflow-hidden divide-y divide-border/10 rounded-2xl bg-card">
        {items.map((item) => {
          const Icon = ICON_MAP[item.iconName] || Users

          return (
            <div
              key={item.id}
              className="flex flex-col justify-between gap-3.5 p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="flex min-w-0 items-start gap-3.5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    item.urgency === 'high'
                      ? 'bg-[var(--brand-gold)]/15 text-[var(--brand-gold)]'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
                      {item.title}
                    </h3>
                    {item.urgency === 'high' && (
                      <span className="inline-flex items-center rounded-md bg-[var(--brand-gold)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--brand-gold)]">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-[15px]">
                    {item.detail}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end pt-1 sm:pt-0">
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {failedSources.length > 0 && (
        <p className="flex items-start gap-1.5 px-0.5 text-xs font-medium text-[var(--brand-gold)]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Some data could not load: {failedSources.join(', ')}. The queue may be incomplete.</span>
        </p>
      )}
    </section>
  )
}
