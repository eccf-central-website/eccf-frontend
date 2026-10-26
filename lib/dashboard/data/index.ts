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
 * returns browser-safe shapes: most projections never select phoneNumber or
 * roomNumber, and stripPII() runs as a second safeguard. The one deliberate
 * exception is welfare contact details, which are decrypted only for CSGB and
 * Welfare & Medical coordinators (see canViewWelfareContact).
 */

import 'server-only'

import { cookies } from 'next/headers'
import { sanityPrivateClient } from '@/lib/sanity'
import { decrypt } from '@/lib/encryption'
import type {
  Announcement,
  AttendanceRow,
  ECCFSession,
  FinanceRow,
  FirstTimerRow,
  PrayerRequest,
  WelfareLedger,
  WelfareLedgerRow,
  WelfareRequestRow,
  WorkerRow,
} from '@/types'
import {
  canAccessSection,
  canViewWelfareContact,
  hasPermission,
  isHallScoped,
  isTeamScoped,
  isCSGBMember,
  isRegularTeamLeader,
} from '../rbac'
import { isDevMockState, type DevMockState } from '../shell'
import type { FinanceStats, OverviewStats, PeopleStats } from '../types'
import {
  DASHBOARD_ANNOUNCEMENTS_QUERY,
  DASHBOARD_ATTENDANCE_QUERY,
  DASHBOARD_FINANCE_QUERY,
  DASHBOARD_FIRST_TIMERS_QUERY,
  DASHBOARD_PRAYER_REQUESTS_QUERY,
  DASHBOARD_WELFARE_LEDGER_QUERY,
  DASHBOARD_WELFARE_QUERY,
  DASHBOARD_WORKERS_QUERY,
  FINANCE_STATS_QUERY,
  PEOPLE_STATS_QUERY,
  WORKER_HALL_BY_ID_QUERY,
} from '../queries'
import {
  MOCK_ANNOUNCEMENTS,
  MOCK_ATTENDANCE,
  MOCK_FINANCE,
  MOCK_FIRST_TIMERS,
  MOCK_PRAYER_REQUESTS,
  MOCK_WELFARE_LEDGER,
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
  if (session.hall) return session.hall
  const hall =
    dataSource() === 'mock'
      ? mockHallForWorker(session.id)
      : await sanityPrivateClient.fetch<string | null>(WORKER_HALL_BY_ID_QUERY, { id: session.id })
  // A hall_rep without a hall on record must not fall through to "all halls".
  return hall ?? '__no-hall__'
}

/** Team used to scope team_lead reads; null means all teams. */
export function teamScope(session: ECCFSession): string | null {
  if (!isTeamScoped(session.role, session)) return null
  return session.leadingTeam || session.team || '__no-team__'
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
  const cleanTeam = team ? team.toLowerCase().trim().replace(/(?:\s+team)+$/i, '').trim() : null
  const params = { monthStart: monthStart(), weekStart: weekStart(), hall, team, cleanTeam }

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
    const isTeamLead = isRegularTeamLeader(session)
    const scopedAttendance = attendance.filter((a) => {
      if (team === null) return true
      return a.teamName === team || (isTeamLead && a.serviceType === 'Team Meeting')
    })
    const lastService = scopedAttendance[0] ?? (isTeamLead ? null : attendance[0])
    return {
      people: showPeople
        ? {
            firstTimersThisMonth: firstTimers.filter(
              (f) =>
                (params.hall === null || f.hall?.toLowerCase() === params.hall.toLowerCase()) &&
                f.dateVisited >= params.monthStart
            ).length,
            pendingWelfare: welfare.filter((w) => w.status === 'Pending').length,
            prayerRequestsThisWeek: prayer.filter((p) => p.dateSubmitted >= params.weekStart).length,
            workers: workers.filter(
              (w) =>
                (params.hall === null || w.hall === params.hall) &&
                (params.team === null || matchesTeam(w.team, w.teams, params.team))
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
    showPeople ? sanityPrivateClient.fetch<PeopleStats>(PEOPLE_STATS_QUERY, params) : undefined,
    showFinance ? sanityPrivateClient.fetch<FinanceStats>(FINANCE_STATS_QUERY, params) : undefined,
  ])
  return { people, finance }
}

// ---------------------------------------------------------------------------
function matchesHall(workerHall: string | undefined, targetHall: string | null): boolean {
  if (targetHall === null) return true
  if (!workerHall) return false
  return workerHall.toLowerCase().trim() === targetHall.toLowerCase().trim()
}

export function matchesTeam(
  workerTeam: string | undefined,
  workerTeams: string[] | undefined,
  targetTeam: string | string[] | null
): boolean {
  if (targetTeam === null) return true
  const targets = (Array.isArray(targetTeam) ? targetTeam : [targetTeam])
    .flatMap((t) => (t ? t.split(',') : []))
    .map((t) => t.trim())
    .filter((t) => Boolean(t) && t !== '__no-team__')

  if (targets.length === 0) return false

  const allWorkerTeams = [workerTeam, ...(workerTeams || [])]
    .flatMap((t) => (t ? t.split(',') : []))
    .map((t) => t.trim())
    .filter(Boolean)

  return allWorkerTeams.some((wt) => {
    const normWt = wt.toLowerCase()
    const cleanWt = normWt.replace(/(?:\s+team)+$/i, '').trim()
    return targets.some((target) => {
      const normTarget = target.toLowerCase()
      const cleanTarget = normTarget.replace(/(?:\s+team)+$/i, '').trim()
      return (
        normWt === normTarget ||
        cleanWt === cleanTarget ||
        normWt.includes(cleanTarget) ||
        cleanTarget.includes(cleanWt)
      )
    })
  })
}

export async function listWorkers(session: ECCFSession): Promise<WorkerRow[]> {
  const hall = await hallScope(session)
  const team = teamScope(session)
  const cleanTeam = team ? team.toLowerCase().trim().replace(/(?:\s+team)+$/i, '').trim() : null
  const rawRows =
    dataSource() === 'mock'
      ? (await fromMock(MOCK_WORKERS, [])).filter(
          (w) => matchesHall(w.hall, hall) && matchesTeam(w.team, w.teams, team)
        )
      : await sanityPrivateClient.fetch<WorkerRow[]>(DASHBOARD_WORKERS_QUERY, {
          hall,
          team,
          cleanTeam,
        })

  // Apply in-memory scoping filter defensively on Sanity results as well
  const scopedRows = rawRows.filter(
    (w) => matchesHall(w.hall, hall) && matchesTeam(w.team, w.teams, team)
  )

  const rows = scopedRows.map((w) => {
    const decryptedBirthDate = decrypt(w.birthDate)
    let birthMonth = w.birthMonth
    let birthDay = w.birthDay
    if ((!birthMonth || !birthDay) && decryptedBirthDate && decryptedBirthDate.includes('-')) {
      const parts = decryptedBirthDate.split('-')
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10)
        const d = parseInt(parts[2], 10)
        if (!isNaN(m) && !isNaN(d)) {
          birthMonth = m
          birthDay = d
        }
      } else if (parts.length === 2) {
        const m = parseInt(parts[0], 10)
        const d = parseInt(parts[1], 10)
        if (!isNaN(m) && !isNaN(d)) {
          birthMonth = m
          birthDay = d
        }
      }
    }
    return {
      ...w,
      birthDate: decryptedBirthDate,
      birthMonth,
      birthDay,
    }
  })

  return stripPII(rows)
}

export async function fetchWorkersForAttendance(
  session: ECCFSession,
  targetTeam?: string
): Promise<Pick<WorkerRow, '_id' | 'fullName' | 'team' | 'teams' | 'hall'>[]> {
  const team = session.role === 'team_lead' ? (session.leadingTeam || session.team) : (targetTeam || null)
  const cleanTeam = team ? team.toLowerCase().trim().replace(/(?:\s+team)+$/i, '').trim() : null
  if (dataSource() === 'mock') {
    const all = await fromMock(MOCK_WORKERS, [])
    return all
      .filter((w) => (team === null || matchesTeam(w.team, w.teams, team)) && w.verificationStatus !== 'rejected')
      .map(({ _id, fullName, team, teams, hall }) => ({ _id, fullName, team, teams, hall }))
  }

  const query = `*[_type == "worker" && (
    $team == null ||
    team->name == $team ||
    team == $team ||
    lower(team->name) == lower($team) ||
    lower(team) == lower($team) ||
    team->name match $team ||
    team match $team ||
    $team in teams[]->name ||
    $team in teams ||
    ($cleanTeam != null && (
      team->name match $cleanTeam ||
      team match $cleanTeam ||
      lower(team->name) == lower($cleanTeam) ||
      lower(team) == lower($cleanTeam) ||
      $cleanTeam in teams[]->name ||
      $cleanTeam in teams
    ))
  ) && coalesce(verificationStatus, 'verified') != 'rejected'] | order(fullName asc) {
    _id,
    fullName,
    "team": coalesce(team->name, team),
    "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)]),
    hall
  }`
  const rawRows = await sanityPrivateClient.fetch<Pick<WorkerRow, '_id' | 'fullName' | 'team' | 'teams' | 'hall'>[]>(query, { team, cleanTeam })
  const filtered = rawRows.filter((w) => team === null || matchesTeam(w.team, w.teams, team))
  return stripPII(filtered)
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
      : await sanityPrivateClient.fetch<AttendanceRow[]>(DASHBOARD_ATTENDANCE_QUERY, { team })
  return stripPII(rows)
}

export async function listFinance(): Promise<FinanceRow[]> {
  const rows =
    dataSource() === 'mock'
      ? await fromMock(MOCK_FINANCE, [])
      : await sanityPrivateClient.fetch<FinanceRow[]>(DASHBOARD_FINANCE_QUERY)
  return stripPII(rows)
}

// ---------------------------------------------------------------------------
// Intake feeds
// ---------------------------------------------------------------------------

export async function listFirstTimers(session?: ECCFSession): Promise<FirstTimerRow[]> {
  const hall = session ? await hallScope(session) : null
  if (dataSource() === 'mock') {
    const raw = await fromMock(MOCK_FIRST_TIMERS, [])
    if (hall && hall !== '__no-hall__') {
      return raw.filter((r) => r.hall?.toLowerCase() === hall.toLowerCase())
    }
    return raw
  }

  const rows = await sanityPrivateClient.fetch<FirstTimerRow[]>(DASHBOARD_FIRST_TIMERS_QUERY, {
    hall: hall && hall !== '__no-hall__' ? hall : null,
  })

  return rows.map((row) => ({
    ...row,
    phoneNumber: row.phoneNumber ? decrypt(row.phoneNumber) : undefined,
    roomNumber: row.roomNumber ? (decrypt(row.roomNumber) || row.roomNumber) : undefined,
  }))
}

export async function listWelfareLedger(session?: ECCFSession): Promise<WelfareLedgerRow[]> {
  if (session && !canAccessSection(session.role, 'welfare', session)) {
    return []
  }

  const raw =
    dataSource() === 'mock'
      ? await fromMock<WelfareLedgerRow[]>(MOCK_WELFARE_LEDGER, [])
      : await sanityPrivateClient.fetch<WelfareLedger[]>(DASHBOARD_WELFARE_LEDGER_QUERY)

  // Compute progressive running balance chronologically
  let running = 0
  const computed: WelfareLedgerRow[] = (raw || []).map((entry) => {
    const amount = Number(entry.amount) || 0
    const charge = Number(entry.bankCharge) || 0
    if (entry.type === 'Credit') {
      running += (amount - charge)
    } else {
      running -= (amount + charge)
    }
    return {
      ...entry,
      runningBalance: typeof entry.balance === 'number' && entry.balance !== 0 ? entry.balance : running,
    }
  })

  // Return newest first for ledger presentation
  return stripPII(computed.reverse())
}

export async function listWelfare(
  session?: ECCFSession & { access?: { isWelfare?: boolean; isCSGB?: boolean } }
): Promise<WelfareRequestRow[]> {
  if (session && !canAccessSection(session.role, 'welfare', session)) {
    return []
  }
  const rows: WelfareRequestRow[] =
    dataSource() === 'mock'
      ? await fromMock<WelfareRequestRow[]>(MOCK_WELFARE, [])
      : await sanityPrivateClient.fetch<WelfareRequestRow[]>(DASHBOARD_WELFARE_QUERY)

  const canViewContact = canViewWelfareContact(session)

  return rows.map((row) => {
    // Run the standard PII stripping guard first, then add the plain-text
    // phone back only for viewers who are allowed to contact the requester.
    const safe = stripPII([row])[0]
    return {
      ...safe,
      requestDetails: decrypt(row.requestDetails),
      canViewContact,
      ...(canViewContact ? { phoneNumber: row.phoneNumber ? decrypt(row.phoneNumber) : '' } : {}),
    }
  })
}

export async function listPrayerRequests(session?: ECCFSession): Promise<PrayerRequest[]> {
  if (session && !canAccessSection(session.role, 'prayerRequests', session)) {
    return []
  }
  const rows =
    dataSource() === 'mock'
      ? await fromMock(MOCK_PRAYER_REQUESTS, [])
      : await sanityPrivateClient.fetch<PrayerRequest[]>(DASHBOARD_PRAYER_REQUESTS_QUERY)
  return stripPII(rows).map((row) => ({
    ...row,
    request: decrypt(row.request),
  }))
}

export async function listAnnouncements(session: ECCFSession): Promise<Announcement[]> {
  if (!isCSGBMember(session)) {
    throw new Error('Access denied: CSGB membership required')
  }

  if (dataSource() === 'mock') {
    return await fromMock(MOCK_ANNOUNCEMENTS, [])
  }

  try {
    return await sanityPrivateClient.fetch<Announcement[]>(DASHBOARD_ANNOUNCEMENTS_QUERY)
  } catch (err) {
    console.error('[listAnnouncements] Sanity fetch error, falling back to mock fixtures:', err)
    return MOCK_ANNOUNCEMENTS
  }
}
