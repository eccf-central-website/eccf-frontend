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
import { canAccessSection, SECTION_PATHS } from '../rbac'
import {
  auditMemberDirectory,
  countUnregisteredExecutiveAppointments,
  listFirstTimers,
  listWelfare,
  listWorkers,
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

export interface AttentionQueueResult {
  items: AttentionQueueItem[]
  /** Human-readable names of data sources that failed to load. */
  failedSources: string[]
  /** Role-appropriate next step shown when the queue is empty. */
  emptyAction: { href: string; label: string } | null
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
  if (!canAccessSection(session.role, 'welfare', session)) return null
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

/** Pick the most useful empty-state destination for this role. */
function getEmptyAction(
  session: ECCFSession & { access?: { isPresident?: boolean; isCSGB?: boolean; canApproveExecutives?: boolean } }
): { href: string; label: string } | null {
  if (canAccessSection(session.role, 'workers', session)) {
    return { href: SECTION_PATHS.workers, label: 'Review workers' }
  }
  if (canAccessSection(session.role, 'executives', session)) {
    return { href: SECTION_PATHS.executives, label: 'Review executives' }
  }
  if (canAccessSection(session.role, 'firstTimers', session)) {
    return { href: SECTION_PATHS.firstTimers, label: 'View first-timers' }
  }
  if (canAccessSection(session.role, 'welfare', session)) {
    return { href: SECTION_PATHS.welfare, label: 'Open welfare' }
  }
  if (canAccessSection(session.role, 'attendance', session)) {
    return { href: SECTION_PATHS.attendance, label: 'Record attendance' }
  }
  if (canAccessSection(session.role, 'finance', session)) {
    return { href: SECTION_PATHS.finance, label: 'Open finance' }
  }
  return null
}

/**
 * Live, true operational items for "Do this now" Attention Queue.
 * Zero mock data: queries live Sanity documents scoped by permissions.
 * Failed sources are surfaced to the UI instead of silently pretending the
 * queue is empty.
 */
export async function getLiveAttentionItems(
  session: ECCFSession & {
    access?: { isPresident?: boolean; isCSGB?: boolean; canApproveExecutives?: boolean }
  }
): Promise<AttentionQueueResult> {
  const items: AttentionQueueItem[] = []
  const failedSources: string[] = []
  const isPresident = Boolean(session.access?.isPresident)

  // 1. Executive onboarding — reserved appointments still awaiting registration.
  if (canAccessSection(session.role, 'executives', session)) {
    try {
      const unregistered = await countUnregisteredExecutiveAppointments(session)
      if (unregistered > 0) {
        items.push({
          id: 'executive-onboarding',
          title: `${unregistered} appointed leader${unregistered === 1 ? '' : 's'} still unregistered`,
          detail:
            'Reserved executive appointments activate automatically once each leader registers for the fellowship.',
          age: 'Onboarding',
          urgency: isPresident || session.access?.canApproveExecutives ? 'high' : 'normal',
          href: SECTION_PATHS.executives,
          actionLabel: 'Review appointments',
          iconName: 'Shield',
        })
      }
    } catch (err) {
      console.error('[getLiveAttentionItems] Executive appointments failed:', err)
      failedSources.push('executive appointments')
    }
  }

  // 2. Worker approvals (scoped to role's authority)
  if (canAccessSection(session.role, 'workers', session)) {
    try {
      const workers = await listWorkers(session)
      const pendingWorkers = workers.filter(
        (w) => w.verificationStatus === 'pending' && w.status !== 'archived'
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
          href: SECTION_PATHS.workers,
          actionLabel: 'Review approvals',
          iconName: 'Users',
        })
      }
    } catch (err) {
      console.error('[getLiveAttentionItems] Worker approvals failed:', err)
      failedSources.push('worker approvals')
    }
  }

  // 3. Member directory anomalies (privileged Settings surfaces only).
  if (canAccessSection(session.role, 'settings', session)) {
    try {
      const audit = await auditMemberDirectory(session)
      if (audit.pendingAnomalies > 0) {
        items.push({
          id: 'member-directory',
          title: `${audit.pendingAnomalies} member record${audit.pendingAnomalies === 1 ? '' : 's'} need attention`,
          detail:
            'Missing contact details, unassigned members, or memberships awaiting verification in the directory.',
          age: 'Sync',
          urgency: 'normal',
          href: SECTION_PATHS.settings,
          actionLabel: 'Open settings',
          iconName: 'Users',
        })
      }
    } catch (err) {
      console.error('[getLiveAttentionItems] Member directory audit failed:', err)
      failedSources.push('member directory')
    }
  }

  // 4. Welfare cases (Pastoral & welfare desk)
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
          href: SECTION_PATHS.welfare,
          actionLabel: 'Open welfare',
          iconName: 'HeartHandshake',
        })
      }
    } catch (err) {
      console.error('[getLiveAttentionItems] Welfare cases failed:', err)
      failedSources.push('welfare cases')
    }
  }

  // 5. First-timers needing contact (First-timers team & hall reps)
  if (canAccessSection(session.role, 'firstTimers', session)) {
    try {
      const firstTimers = await listFirstTimers(session)
      const now = new Date()
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      const recentVisitors = firstTimers.filter(
        (f) => f.dateVisited && f.dateVisited >= fourteenDaysAgo && !f.followedUp
      )
      if (recentVisitors.length > 0) {
        items.push({
          id: 'first-timers-contact',
          title: `${recentVisitors.length} new visitor${recentVisitors.length > 1 ? 's' : ''} awaiting follow-up`,
          detail: 'Reach out to first-time fellowship guests within 48 hours of service.',
          age: 'Recent',
          urgency: 'normal',
          href: SECTION_PATHS.firstTimers,
          actionLabel: 'View first-timers',
          iconName: 'UserPlus',
        })
      }
    } catch (err) {
      console.error('[getLiveAttentionItems] First-timers failed:', err)
      failedSources.push('first-timers')
    }
  }

  // "Sorted by urgency" is literal: high-urgency work first, preserving the
  // signal order within each band.
  const sortedItems = [...items].sort((a, b) => {
    if (a.urgency === b.urgency) return 0
    return a.urgency === 'high' ? -1 : 1
  })

  return {
    items: sortedItems,
    failedSources,
    emptyAction: getEmptyAction(session),
  }
}
