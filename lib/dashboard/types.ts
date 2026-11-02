/**
 * Dashboard data shapes returned by lib/dashboard/data. Browser-safe — safe
 * to import from Client Components as types.
 */

import type { AttendanceLedger } from '@/types'
import type { DashboardSection } from './rbac'

/**
 * Outstanding-work counts for the navigation badges, keyed by section.
 * Only sections with at least one item awaiting attention are present.
 * `overview` carries the aggregate across every visible section.
 */
export type NavigationAttention = Partial<Record<DashboardSection, number>>

export interface PeopleStats {
  firstTimersThisMonth: number
  pendingWelfare: number
  prayerRequestsThisWeek: number
  /** Scoped to hall for hall_rep, or team for team_lead */
  workers: number
  lastService: Pick<AttendanceLedger, 'date' | 'serviceType' | 'totalCount'> & { meetingTitle?: string } | null
}

export interface FinanceStats {
  incomeThisMonth: number
  expenseThisMonth: number
}

/** Each group is present only when the session's role may see it. */
export interface OverviewStats {
  people?: PeopleStats
  finance?: FinanceStats
}
