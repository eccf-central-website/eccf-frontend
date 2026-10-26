/**
 * Overview data — SERVER-SIDE ONLY. Composes the list functions in ./index
 * into the small, browser-safe shapes the overview's recent-activity lists
 * and the live "Do this now" queue render.
 *
 * Each function re-checks the role's section access and returns true live data.
 * Zero mock data is used.
 */

import 'server-only'

import type { ECCFSession, SafeFirstTimer, SafeWelfareRequest } from '@/types'
import { canAccessSection } from '../rbac'
import {
  listFirstTimers,
  listWelfare,
  listWorkers,
  listPendingExecutiveApplications,
} from './index'

export const RECENT_LIMIT = 5

export type RecentFirstTimer = Pick<
  SafeFirstTimer,
  '_id' | 'fullName' | 'hall' | 'department' | 'level' | 'dateVisited'
>

export type RecentWelfareRequest = Pick<
  SafeWelfareRequest,
  '_id' | 'name' | 'status' | 'dateSubmitted'
>

export interface AttentionQueueItem {
  id: string
  title: string
  detail: string
  age?: string
  urgency: 'high' | 'normal'
  href: string
  actionLabel: string
  iconName: 'Shield' | 'Users' | 'HeartHandshake' | 'UserPlus' | 'CalendarCheck'
}

/** Latest first-timers, newest first; null when the role can't open the feed. */
export async function getRecentFirstTimers(session: ECCFSession): Promise<RecentFirstTimer[] | null> {
  if (!canAccessSection(session.role, 'firstTimers', session)) return null
  const rows = await listFirstTimers(session)
  return rows
    .slice(0, RECENT_LIMIT)
    .map(({ _id, fullName, hall, department, level, dateVisited }) => ({
      _id,
      fullName,
      hall,
      department,
      level,
      dateVisited,
    }))
}

/** Latest welfare requests, newest first; null when the role can't open the feed. */
export async function getRecentWelfare(session: ECCFSession): Promise<RecentWelfareRequest[] | null> {
  if (!canAccessSection(session.role, 'welfare')) return null
  const rows = await listWelfare(session)
  return rows
    .slice(0, RECENT_LIMIT)
    .map(({ _id, name, status, dateSubmitted }) => ({
      _id,
      name,
      status,
      dateSubmitted,
    }))
}

/**
 * Live, true operational items for "Do this now" Attention Queue.
 * Zero mock data: queries live Sanity documents scoped by permissions.
 */
export async function getLiveAttentionItems(
  session: ECCFSession & { access?: { isPresident?: boolean; isCSGB?: boolean } }
): Promise<AttentionQueueItem[]> {
  const items: AttentionQueueItem[] = []
  const isPresident = Boolean(session.access?.isPresident)

  // 1. Executive Appointments (President or CSGB Admin)
  if (canAccessSection(session.role, 'executives', session)) {
    try {
      const apps = await listPendingExecutiveApplications()
      if (apps.length > 0) {
        const names = apps.map((a) => a.fullName).filter(Boolean)
        const summary =
          names.length > 2
            ? `${names.slice(0, 2).join(', ')} and ${names.length - 2} others`
            : names.join(' and ')

        items.push({
          id: 'executive-appointments',
          title: `Onboard ${apps.length} executive appointee${apps.length > 1 ? 's' : ''}`,
          detail: `${summary || 'Candidates'} awaiting appointment review and confirmation.`,
          age: 'Pending',
          urgency: 'high',
          href: '/dashboard/executives',
          actionLabel: isPresident ? 'Review appointments' : 'View candidates',
          iconName: 'Shield',
        })
      }
    } catch {
      // Gracefully continue
    }
  }

  // 2. Worker approvals (scoped to role's authority)
  if (canAccessSection(session.role, 'workers', session)) {
    try {
      const workers = await listWorkers(session)
      const pendingWorkers = workers.filter(
        (w) => w.verificationStatus === 'pending'
      )
      if (pendingWorkers.length > 0) {
        const names = pendingWorkers.map((w) => w.fullName).filter(Boolean)
        const summary =
          names.length > 2
            ? `${names.slice(0, 2).join(', ')} and ${names.length - 2} others`
            : names.join(' and ')

        items.push({
          id: 'worker-approvals',
          title: `Verify ${pendingWorkers.length} pending worker${pendingWorkers.length > 1 ? 's' : ''}`,
          detail: `${summary || 'Workers'} awaiting departmental verification on your roster.`,
          age: 'Pending',
          urgency: isPresident ? 'normal' : 'high',
          href: '/dashboard/workers',
          actionLabel: 'Review approvals',
          iconName: 'Users',
        })
      }
    } catch {
      // Gracefully continue
    }
  }

  // 3. Welfare cases (Pastoral & welfare desk)
  if (canAccessSection(session.role, 'welfare', session)) {
    try {
      const welfare = await listWelfare(session)
      const pendingWelfare = welfare.filter((w) => w.status === 'Pending')
      if (pendingWelfare.length > 0) {
        items.push({
          id: 'welfare-cases',
          title: `${pendingWelfare.length} active welfare case${pendingWelfare.length > 1 ? 's' : ''}`,
          detail: 'Confidential student assistance cases awaiting pastoral follow-up and care.',
          age: 'Pending',
          urgency: 'normal',
          href: '/dashboard/welfare',
          actionLabel: 'Open welfare',
          iconName: 'HeartHandshake',
        })
      }
    } catch {
      // Gracefully continue
    }
  }

  // 4. First-timers needing contact (First-timers team & hall reps)
  if (canAccessSection(session.role, 'firstTimers', session)) {
    try {
      const firstTimers = await listFirstTimers(session)
      const now = new Date()
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const recentVisitors = firstTimers.filter(
        (f) => f.dateVisited && f.dateVisited >= fourteenDaysAgo
      )
      if (recentVisitors.length > 0) {
        items.push({
          id: 'first-timers-contact',
          title: `${recentVisitors.length} new visitor${recentVisitors.length > 1 ? 's' : ''} awaiting follow-up`,
          detail: 'Reach out to first-time fellowship guests within 48 hours of service.',
          age: 'Recent',
          urgency: 'normal',
          href: '/dashboard/first-timers',
          actionLabel: 'View first-timers',
          iconName: 'UserPlus',
        })
      }
    } catch {
      // Gracefully continue
    }
  }

  return items
}
