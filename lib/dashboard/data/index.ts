/**
 * Dashboard data-access boundary — SERVER-SIDE ONLY.
 *
 * Pages and Server Actions call these functions and never touch Sanity or
 * the mocks directly, so swapping mock → live data is an env change:
 *
 *   DASHBOARD_DATA_SOURCE=mock | sanity
 *   (default: mock outside production, sanity in production)
 *
 * Mock source extras, for exercising loading/empty/error states without
 * editing code: set the `eccf-dev-mock-state` cookie (or the
 * DASHBOARD_MOCK_STATE env var) to `empty`, `error` or `slow`.
 *
 * Every function takes the session (or is RBAC-checked by its caller) and
 * returns browser-safe shapes: projections never select phoneNumber or
 * roomNumber, and stripPII() runs on every result as a second safeguard.
 */

import 'server-only'

import { cookies } from 'next/headers'
import { sanityWriteClient } from '@/lib/sanity'
import type {
  AttendanceRow,
  ECCFSession,
  FinanceRow,
  PrayerRequest,
  SafeFirstTimer,
  SafeWelfareRequest,
  WorkerRow,
} from '@/types'
import { hasPermission, isHallScoped, isTeamScoped } from '../rbac'
import { isDevMockState, type DevMockState } from '../shell'
import type { FinanceStats, OverviewStats, PeopleStats } from '../types'
import {
  DASHBOARD_ATTENDANCE_QUERY,
  DASHBOARD_FINANCE_QUERY,
  DASHBOARD_FIRST_TIMERS_QUERY,
  DASHBOARD_PRAYER_REQUESTS_QUERY,
  DASHBOARD_WELFARE_QUERY,
  DASHBOARD_WORKERS_QUERY,
  FINANCE_STATS_QUERY,
  PEOPLE_STATS_QUERY,
  WORKER_HALL_BY_ID_QUERY,
} from '../queries'
import {
  MOCK_ATTENDANCE,
  MOCK_FINANCE,
  MOCK_FIRST_TIMERS,
  MOCK_PRAYER_REQUESTS,
  MOCK_WELFARE,
  MOCK_WORKERS,
  mockHallForWorker,
} from '../mock/data'
import { stripPII } from './pii'
import { lagosDaysAgo, lagosMonthStart } from '../dates'

export const DEV_MOCK_STATE_COOKIE = 'eccf-dev-mock-state'

type DataSource = 'mock' | 'sanity'
type MockState = DevMockState

function dataSource(): DataSource {
  const configured = process.env.DASHBOARD_DATA_SOURCE
  if (configured === 'mock' || configured === 'sanity') return configured
  return process.env.NODE_ENV === 'production' ? 'sanity' : 'mock'
}

function mockState(): MockState {
  const value = cookies().get(DEV_MOCK_STATE_COOKIE)?.value ?? process.env.DASHBOARD_MOCK_STATE
  return isDevMockState(value) ? value : 'normal'
}

/** Resolve a mock fixture, honouring the dev mock-state switch. */
async function fromMock<T>(rows: T, empty: T): Promise<T> {
  const state = mockState()
  if (state === 'slow') await new Promise((resolve) => setTimeout(resolve, 1500))
  if (state === 'error') throw new Error('Mock data source error (eccf-dev-mock-state=error)')
  return state === 'empty' ? empty : structuredClone(rows)
}

/** Hall used to scope hall_rep reads; null means all halls. */
async function hallScope(session: ECCFSession): Promise<string | null> {
  if (!isHallScoped(session.role)) return null
  const hall =
    dataSource() === 'mock'
      ? mockHallForWorker(session.id)
      : await sanityWriteClient.fetch<string | null>(WORKER_HALL_BY_ID_QUERY, { id: session.id })
  // A hall_rep without a hall on record must not fall through to "all halls".
  return hall ?? '__no-hall__'
}

/** Team used to scope team_lead reads; null means all teams. */
function teamScope(session: ECCFSession): string | null {
  if (!isTeamScoped(session.role)) return null
  return session.team || '__no-team__'
}

/** Boundaries follow the fellowship's calendar (Africa/Lagos), not UTC; see ../dates. */
function monthStart(now = new Date()): string {
  return lagosMonthStart(now)
}

/** Start of the rolling 7-day window (today and the 6 days before), Lagos calendar. */
function weekStart(now = new Date()): string {
  return lagosDaysAgo(6, now)
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export async function getOverviewStats(session: ECCFSession): Promise<OverviewStats> {
  const showPeople = hasPermission(session.role, 'stats:people')
  const showFinance = hasPermission(session.role, 'stats:finance')
  const hall = await hallScope(session)
  const team = teamScope(session)
  const params = { monthStart: monthStart(), weekStart: weekStart(), hall, team }

  if (dataSource() === 'mock') {
    const [firstTimers, welfare, prayer, workers, attendance, finance] = await Promise.all([
      fromMock(MOCK_FIRST_TIMERS, []),
      fromMock(MOCK_WELFARE, []),
      fromMock(MOCK_PRAYER_REQUESTS, []),
      fromMock(MOCK_WORKERS, []),
      fromMock(MOCK_ATTENDANCE, []),
      fromMock(MOCK_FINANCE, []),
    ])
    const sumThisMonth = (type: FinanceRow['type']) =>
      finance
        .filter((f) => f.type === type && f.transactionDate >= params.monthStart)
        .reduce((total, f) => total + f.amount, 0)
    const scopedAttendance = attendance.filter(
      (a) => team === null || a.teamName === team || a.serviceType === 'Sunday Service'
    )
    const lastService = scopedAttendance[0] ?? attendance[0]
    return {
      people: showPeople
        ? {
            firstTimersThisMonth: firstTimers.filter((f) => f.dateVisited >= params.monthStart).length,
            pendingWelfare: welfare.filter((w) => w.status === 'Pending').length,
            prayerRequestsThisWeek: prayer.filter((p) => p.dateSubmitted >= params.weekStart).length,
            workers: workers.filter(
              (w) =>
                (params.hall === null || w.hall === params.hall) &&
                (params.team === null || w.team === params.team)
            ).length,
            lastService: lastService
              ? { date: lastService.date, serviceType: lastService.serviceType, totalCount: lastService.totalCount }
              : null,
          }
        : undefined,
      finance: showFinance
        ? { incomeThisMonth: sumThisMonth('Income'), expenseThisMonth: sumThisMonth('Expense') }
        : undefined,
    }
  }

  const [people, finance] = await Promise.all([
    showPeople ? sanityWriteClient.fetch<PeopleStats>(PEOPLE_STATS_QUERY, params) : undefined,
    showFinance ? sanityWriteClient.fetch<FinanceStats>(FINANCE_STATS_QUERY, params) : undefined,
  ])
  return { people, finance }
}

// ---------------------------------------------------------------------------
// Worker CRM
// ---------------------------------------------------------------------------

export async function listWorkers(session: ECCFSession): Promise<WorkerRow[]> {
  const hall = await hallScope(session)
  const team = teamScope(session)
  const rows =
    dataSource() === 'mock'
      ? (await fromMock(MOCK_WORKERS, [])).filter(
          (w) =>
            (hall === null || w.hall === hall) &&
            (team === null || w.team === team || (w.teams && w.teams.includes(team)))
        )
      : await sanityWriteClient.fetch<WorkerRow[]>(DASHBOARD_WORKERS_QUERY, { hall, team })
  return stripPII(rows)
}

export async function fetchWorkersForAttendance(
  session: ECCFSession,
  targetTeam?: string
): Promise<Pick<WorkerRow, '_id' | 'fullName' | 'team' | 'teams' | 'hall'>[]> {
  const team = session.role === 'team_lead' ? session.team : (targetTeam || null)
  if (dataSource() === 'mock') {
    const all = await fromMock(MOCK_WORKERS, [])
    return all
      .filter((w) => team === null || w.team === team || (w.teams && w.teams.includes(team)))
      .map(({ _id, fullName, team, teams, hall }) => ({ _id, fullName, team, teams, hall }))
  }

  const query = `*[_type == "worker" && ($team == null || team->name == $team || team == $team || $team in teams[]->name || $team in teams)] | order(fullName asc) {
    _id,
    fullName,
    "team": coalesce(team->name, team),
    "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)]),
    hall
  }`
  const rows = await sanityWriteClient.fetch<Pick<WorkerRow, '_id' | 'fullName' | 'team' | 'teams' | 'hall'>[]>(query, { team })
  return stripPII(rows)
}

// ---------------------------------------------------------------------------
// Ledgers
// ---------------------------------------------------------------------------

export async function listAttendance(session?: ECCFSession): Promise<AttendanceRow[]> {
  const team = session ? teamScope(session) : null
  const rows =
    dataSource() === 'mock'
      ? (await fromMock(MOCK_ATTENDANCE, [])).filter(
          (a) => team === null || a.teamName === team || a.serviceType !== 'Team Meeting'
        )
      : await sanityWriteClient.fetch<AttendanceRow[]>(DASHBOARD_ATTENDANCE_QUERY, { team })
  return stripPII(rows)
}

export async function listFinance(): Promise<FinanceRow[]> {
  const rows =
    dataSource() === 'mock'
      ? await fromMock(MOCK_FINANCE, [])
      : await sanityWriteClient.fetch<FinanceRow[]>(DASHBOARD_FINANCE_QUERY)
  return stripPII(rows)
}

// ---------------------------------------------------------------------------
// Intake feeds
// ---------------------------------------------------------------------------

export async function listFirstTimers(): Promise<SafeFirstTimer[]> {
  const rows =
    dataSource() === 'mock'
      ? await fromMock(MOCK_FIRST_TIMERS, [])
      : await sanityWriteClient.fetch<SafeFirstTimer[]>(DASHBOARD_FIRST_TIMERS_QUERY)
  return stripPII(rows)
}

export async function listWelfare(): Promise<SafeWelfareRequest[]> {
  const rows =
    dataSource() === 'mock'
      ? await fromMock(MOCK_WELFARE, [])
      : await sanityWriteClient.fetch<SafeWelfareRequest[]>(DASHBOARD_WELFARE_QUERY)
  return stripPII(rows)
}

export async function listPrayerRequests(): Promise<PrayerRequest[]> {
  const rows =
    dataSource() === 'mock'
      ? await fromMock(MOCK_PRAYER_REQUESTS, [])
      : await sanityWriteClient.fetch<PrayerRequest[]>(DASHBOARD_PRAYER_REQUESTS_QUERY)
  return stripPII(rows)
}
