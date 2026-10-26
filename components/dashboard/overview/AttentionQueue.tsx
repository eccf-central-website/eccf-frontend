/**
 * AttentionQueue — "Do this now" executive action queue.
 *
 * Implements the role-prioritised urgency queue driven 100% by live Sanity data:
 * - Queries actual pending items: executive onboarding, worker verifications,
 *   welfare follow-ups, and first-timers needing contact.
 * - Zero mock data.
 * - Touch-safe 44px action pills.
 * - Clean "All caught up" empty state when no urgent tasks are pending.
 */

import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Users,
  HeartHandshake,
  UserPlus,
  CalendarCheck,
} from 'lucide-react'
import type { ECCFSession } from '@/types'
import { getLiveAttentionItems, type AttentionQueueItem } from '@/lib/dashboard/data/overview'
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

      <div className="rounded-2xl bg-card shadow-sm border-0 divide-y divide-border/10 overflow-hidden">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3">
            <div className="flex items-start gap-3.5">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-64 max-w-full rounded-md" />
              </div>
            </div>
            <Skeleton className="h-11 w-full sm:w-36 shrink-0 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function AttentionQueue({
  session,
}: {
  session: ECCFSession & { access?: { isPresident?: boolean; isCSGB?: boolean } }
}) {
  const items: AttentionQueueItem[] = await getLiveAttentionItems(session)

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-card/60 p-5 sm:p-6 shadow-sm border-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-foreground">You’re all caught up</h2>
              <p className="text-xs sm:text-sm md:text-[15px] text-muted-foreground mt-0.5 leading-relaxed">
                No pending approvals, appointments, or urgent operational tasks require your attention right now.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/attendance"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 px-4 rounded-xl border border-border/50 bg-background hover:bg-muted/60 text-foreground text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
            <span>Record attendance</span>
          </Link>
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
          <span className="inline-flex items-center justify-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
            {items.length}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Sorted by urgency
        </span>
      </div>

      <div className="rounded-2xl bg-card shadow-sm border-0 divide-y divide-border/10 overflow-hidden">
        {items.map((item) => {
          const Icon = ICON_MAP[item.iconName] || Users

          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3.5 transition-colors hover:bg-muted/20"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    item.urgency === 'high'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
                      {item.title}
                    </h3>
                    {item.urgency === 'high' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm md:text-[15px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end shrink-0 pt-1 sm:pt-0">
                <Link
                  href={item.href}
                  className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
