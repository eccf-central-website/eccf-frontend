/**
 * Dashboard data shapes returned by lib/dashboard/data. Browser-safe — safe
 * to import from Client Components as types.
 */

import type { AttendanceLedger } from '@/types'

export interface PeopleStats {
  firstTimersThisMonth: number
  pendingWelfare: number
  prayerRequestsThisWeek: number
  /** Hall-scoped for hall_rep */
  workers: number
  lastService: Pick<AttendanceLedger, 'date' | 'serviceType' | 'totalCount'> | null
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
