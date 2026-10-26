/**
 * AttentionQueue — "Do this now" executive action queue.
 *
 * Implements the role-prioritised urgency queue:
 * - Items sorted strictly by urgency.
 * - Touch-safe 44px action pills.
 * - Clear role-based operational tasks.
 */

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Shield, Users, HeartHandshake, RefreshCw } from 'lucide-react'
import type { DashboardSession } from '@/lib/dashboard/auth'
import type { ECCFSession } from '@/types'

interface QueueItem {
  id: string
  title: string
  detail: string
  age: string
  urgency: 'high' | 'normal'
  href: string
  actionLabel: string
  icon: React.ComponentType<{ className?: string }>
}

export default function AttentionQueue({ session }: { session: DashboardSession | ECCFSession }) {
  const sessionAccess = 'access' in session ? session.access : undefined
  const isPresident = Boolean(sessionAccess?.isPresident)
  const isCSGB = session.role === 'admin' || Boolean(sessionAccess?.isCSGB)

  const items: QueueItem[] = []

  if (isPresident) {
    items.push({
      id: 'exco-onboarding',
      title: 'Onboard 4 executive appointees',
      detail: 'CSGB officers and hall pastors awaiting presidential appointment confirmation.',
      age: '2d ago',
      urgency: 'high',
      href: '/dashboard/executives',
      actionLabel: 'Review appointments',
      icon: Shield,
    })
    items.push({
      id: 'member-sync',
      title: 'Sync registered members',
      detail: '18 new student registrations pending sync to operational databases.',
      age: 'Today',
      urgency: 'high',
      href: '/dashboard/settings',
      actionLabel: 'Run sync',
      icon: RefreshCw,
    })
    items.push({
      id: 'welfare-care',
      title: 'Welfare emergency care',
      detail: 'Confidential student assistance cases escalated for pastoral oversight.',
      age: '1d ago',
      urgency: 'normal',
      href: '/dashboard/welfare',
      actionLabel: 'Open welfare',
      icon: HeartHandshake,
    })
  } else if (isCSGB) {
    items.push({
      id: 'worker-verification',
      title: 'Verify pending worker applications',
      detail: 'New workforce applicants submitted credentials across ministry departments.',
      age: '3d ago',
      urgency: 'high',
      href: '/dashboard/workers',
      actionLabel: 'Review approvals',
      icon: Users,
    })
    items.push({
      id: 'attendance-check',
      title: 'Record Sunday service headcounts',
      detail: 'Verify Sunday first service and second service general attendance tallies.',
      age: 'Sunday',
      urgency: 'normal',
      href: '/dashboard/attendance',
      actionLabel: 'Record attendance',
      icon: CheckCircle2,
    })
  } else {
    // Team lead / hall rep default
    items.push({
      id: 'team-approvals',
      title: 'Review team worker registrations',
      detail: `Workers who requested to join ${session.team || 'your ministry team'}.`,
      age: 'This week',
      urgency: 'high',
      href: '/dashboard/workers',
      actionLabel: 'Review team',
      icon: Users,
    })
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-5 sm:p-6 shadow-sm border border-border/40 dark:border-white/[0.06] flex items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">You’re all caught up</p>
          <p className="text-xs text-muted-foreground">No urgent items require your attention right now.</p>
        </div>
      </div>
    )
  }

  return (
    <section aria-labelledby="attention-queue-title" className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="attention-queue-title" className="text-base font-semibold tracking-tight text-foreground">
            Do this now
          </h2>
          <p className="text-xs text-muted-foreground font-medium">Sorted by urgency</p>
        </div>
      </div>

      <div className="divide-y divide-border/30 rounded-2xl bg-card shadow-sm border border-border/60 dark:border-white/[0.06] overflow-hidden">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    item.urgency === 'high'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-primary/10 text-primary dark:text-[#70a3ff]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{item.title}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground shrink-0">
                      {item.age}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{item.detail}</p>
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-auto pt-1 sm:pt-0">
                <Link
                  href={item.href}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
