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
  ExecutiveRow,
  PendingExecutiveApplication,

} from '@/types'
import {
  canAccessSection,
  canApproveExecutiveAppointments,
  canViewWelfareContact,
  hasPermission,
  isHallScoped,
  isTeamScoped,
  isCSGBMember,
  isRegularTeamLeader,
} from '../rbac'
import type { DashboardSection } from '../rbac'
import { isDevMockState, type DevMockState } from '../shell'
import type { FinanceStats, NavigationAttention, OverviewStats, PeopleStats } from '../types'
import {
  DASHBOARD_ANNOUNCEMENTS_QUERY,
  DASHBOARD_ATTENDANCE_QUERY,
  DASHBOARD_FINANCE_QUERY,
  DASHBOARD_FIRST_TIMERS_QUERY,
  DASHBOARD_NAV_ATTENTION_QUERY,
  DASHBOARD_PRAYER_REQUESTS_QUERY,
  DASHBOARD_WELFARE_LEDGER_QUERY,
  DASHBOARD_WELFARE_QUERY,
  DASHBOARD_WORKERS_QUERY,
  DASHBOARD_EXECUTIVES_QUERY,
  DASHBOARD_PENDING_EXECUTIVE_POSITIONS_QUERY,
  DASHBOARD_UNREGISTERED_EXECUTIVES_QUERY,
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
import { extractNameTokens, normalizeTokensKey } from '@/lib/executive-matching'

export const DEV_MOCK_STATE_COOKIE = 'eccf-dev-mock-state'

interface ReservedExecutiveAppointment {
  _id: string
  fullName: string
  normalizedName?: string
  email?: string
  kind: 'csgb' | 'hall' | 'team'
  rank?: 'lead' | 'assistant'
  office?: string
  hall?: string
  teamName?: string
  importedAt?: string
  decidedBy?: string
  decidedById?: string
  decidedByRole?: string
  csgbRoleTitle?: string
  csgbRoleRef?: string
  hallName?: string
  teamTitle?: string
}

function executiveNameKey(fullName?: string, normalizedName?: string): string | undefined {
  if (normalizedName?.trim()) return normalizedName.trim()
  if (!fullName?.trim()) return undefined
  const tokens = extractNameTokens(fullName)
  return tokens.length > 0 ? normalizeTokensKey(tokens) : undefined
}

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
      return normWt === normTarget || cleanWt === cleanTarget
    })
  })
}

// ---------------------------------------------------------------------------
// Navigation attention
// ---------------------------------------------------------------------------

interface NavAttentionCounts {
  executives: number
  workers: number
  firstTimers: number
  welfare: number
  prayerRequests: number
  announcements: number
}

/**
 * Outstanding-work counts for the nav badges. Permission-gated per section and
 * scoped like the page each badge points to. The layout depends on this, so a
 * failed read degrades to no badges rather than breaking navigation.
 */
export async function getNavigationAttention(
  session: ECCFSession
): Promise<NavigationAttention> {
  const canExecutives =
    canAccessSection(session.role, 'executives', session) &&
    canApproveExecutiveAppointments(session)
  const canWorkers = canAccessSection(session.role, 'workers', session)
  const canFirstTimers = canAccessSection(session.role, 'firstTimers', session)
  const canWelfare = canAccessSection(session.role, 'welfare', session)
  const canPrayerRequests = canAccessSection(session.role, 'prayerRequests', session)
  const canAnnouncements = canAccessSection(session.role, 'announcements', session)

  try {
    const hall = await hallScope(session)
    const team = teamScope(session)
    let counts: NavAttentionCounts

    if (dataSource() === 'mock') {
      // The nav is chrome: honour empty/error states without delaying the shell
      // the way the page-level slow state does.
      const state = mockState()
      if (state === 'empty' || state === 'error') return {}

      const week = weekStart()
      counts = {
        executives: canExecutives
          ? (MOCK_WORKERS || []).reduce(
              (total, worker) =>
                worker.status === 'archived' || worker.verificationStatus === 'rejected'
                  ? total
                  : (worker.positions || []).some(
                      (position) => position.status === 'pending' && Boolean(position._key)
                    )
                  ? total + 1
                  : total,
              0
            )
          : 0,
        workers: canWorkers
          ? (MOCK_WORKERS || []).filter(
              (worker) =>
                worker.status !== 'archived' &&
                (worker.verificationStatus || 'verified') !== 'rejected' &&
                matchesHall(worker.hall, hall) &&
                matchesTeam(worker.team, worker.teams, team) &&
                (worker.verificationStatus === 'pending' ||
                  (worker.memberships || []).some(
                    (membership) => membership.status === 'pending'
                  ))
            ).length
          : 0,
        firstTimers: canFirstTimers
          ? (MOCK_FIRST_TIMERS || []).filter(
              (firstTimer) =>
                firstTimer.followedUp !== true && matchesHall(firstTimer.hall, hall)
            ).length
          : 0,
        welfare: canWelfare
          ? (MOCK_WELFARE || []).filter((request) => request.status === 'Pending').length
          : 0,
        prayerRequests: canPrayerRequests
          ? (MOCK_PRAYER_REQUESTS || []).filter(
              (request) => request.dateSubmitted >= week
            ).length
          : 0,
        announcements: canAnnouncements
          ? (MOCK_ANNOUNCEMENTS || []).filter(
              (announcement) => announcement.isPublished !== true
            ).length
          : 0,
      }
    } else {
      const cleanTeam = team
        ? team.toLowerCase().trim().replace(/(?:\s+team)+$/i, '').trim()
        : null
      counts = await sanityPrivateClient.fetch<NavAttentionCounts>(
        DASHBOARD_NAV_ATTENTION_QUERY,
        {
          hall,
          team,
          cleanTeam,
          weekStart: weekStart(),
          canExec: canExecutives,
          canWorkers,
          canFirstTimers,
          canWelfare,
          canPrayer: canPrayerRequests,
          canAnnouncements,
        }
      )
    }

    const bySection: Array<[DashboardSection, number]> = [
      ['executives', counts.executives],
      ['workers', counts.workers],
      ['firstTimers', counts.firstTimers],
      ['welfare', counts.welfare],
      ['prayerRequests', counts.prayerRequests],
      ['announcements', counts.announcements],
    ]

    const attention: NavigationAttention = {}
    let total = 0
    for (const [section, value] of bySection) {
      const count = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
      if (count > 0) {
        attention[section] = count
        total += count
      }
    }
    if (total > 0) attention.overview = total
    return attention
  } catch (err) {
    console.error('[getNavigationAttention] Could not load attention counts:', err)
    return {}
  }
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

/** Attendance roster worker with role/position data for leader indicators. */
import type { AttendanceWorker } from '@/lib/dashboard/attendance-worker'

export async function fetchWorkersForAttendance(
  session: ECCFSession,
  targetTeam?: string
): Promise<AttendanceWorker[]> {
  const team = session.role === 'team_lead' ? (session.leadingTeam || session.team) : (targetTeam || null)
  const cleanTeam = team ? team.toLowerCase().trim().replace(/(?:\s+team)+$/i, '').trim() : null
  if (dataSource() === 'mock') {
    const all = await fromMock(MOCK_WORKERS, [])
    return all
      .filter((w) => (team === null || matchesTeam(w.team, w.teams, team)) && w.verificationStatus !== 'rejected')
      .map((w): AttendanceWorker => ({
        _id: w._id,
        fullName: w.fullName,
        team: w.team,
        teams: w.teams,
        hall: w.hall,
        role: w.role,
        positions: w.positions,
        leadingTeam: w.leadingTeam,
        verificationStatus: w.verificationStatus,
        status: w.status,
      }))
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
    hall,
    role,
    "positions": positions[]{
      _key,
      kind,
      rank,
      status,
      teamName,
    },
    "leadingTeam": coalesce(leadingTeam->name, leadingTeam),
    verificationStatus,
    status
  }`
  const rawRows = await sanityPrivateClient.fetch<AttendanceWorker[]>(query, { team, cleanTeam })
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

export interface MemberDirectoryAudit {
  scanned: number
  pendingAnomalies: number
  details: string[]
}

function workerTeamName(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'name' in value) {
    const name = (value as { name?: unknown }).name
    return typeof name === 'string' ? name : undefined
  }
  return undefined
}

/**
 * Live member-directory audit. Reports missing contact details, missing team
 * assignments, and memberships still awaiting verification. Used by both the
 * Settings sync action and the overview attention queue.
 */
export async function auditMemberDirectory(
  session: ECCFSession
): Promise<MemberDirectoryAudit> {
  if (!canAccessSection(session.role, 'settings', session)) {
    throw new Error('Access denied: privileged Settings access required')
  }

  let rows: Array<{
    _id: string
    fullName?: string
    email?: string
    team?: string
    teams?: string[]
    memberships?: Array<{ status?: string }>
  }>

  if (dataSource() === 'mock') {
    rows = (await fromMock(MOCK_WORKERS, [])).map((worker) => ({
      _id: worker._id,
      fullName: worker.fullName,
      email: worker.email,
      team: workerTeamName(worker.team),
      teams: (worker.teams || [])
        .map(workerTeamName)
        .filter((team): team is string => Boolean(team)),
      memberships: worker.memberships,
    }))
  } else {
    try {
      rows = await sanityPrivateClient.fetch(
        `*[_type == "worker" && !(_id in path("drafts.**")) && coalesce(status, "active") != "archived"]{
          _id,
          fullName,
          email,
          "team": coalesce(team->name, team),
          "teams": coalesce(teams[]->name, teams, [])[@ != null],
          "memberships": memberships[]{ status }
        }`
      )
    } catch (err) {
      console.error('[auditMemberDirectory] Sanity fetch error:', err)
      throw new Error('Could not read the member directory.')
    }
  }

  let pendingAnomalies = 0
  const details: string[] = []
  const addAnomaly = (name: string, message: string) => {
    pendingAnomalies++
    if (details.length < 20) details.push(`${name}: ${message}`)
  }

  for (const row of rows) {
    const name = row.fullName?.trim() || 'Unnamed worker'
    if (!row.email?.trim()) addAnomaly(name, 'missing email address')

    const teams = [row.team, ...(row.teams || [])].filter(
      (team): team is string => Boolean(team && team.trim())
    )
    const memberships = row.memberships || []
    if (teams.length === 0 && memberships.length === 0) {
      addAnomaly(name, 'no team assignment')
    }

    const pendingMemberships = memberships.filter((membership) => membership.status === 'pending')
    if (pendingMemberships.length > 0) {
      addAnomaly(
        name,
        `${pendingMemberships.length} membership${pendingMemberships.length > 1 ? 's' : ''} awaiting verification`
      )
    }
  }

  return { scanned: rows.length, pendingAnomalies, details }
}

/** Count reserved executive appointments still waiting for the leader to register. */
export async function countUnregisteredExecutiveAppointments(
  session: ECCFSession
): Promise<number> {
  if (!canAccessSection(session.role, 'executives', session)) {
    throw new Error('Access denied: executives section required')
  }

  if (dataSource() === 'mock') return 0

  const count = await sanityPrivateClient.fetch<number>(
    `count(*[_type == "executiveAppointment" && status == "pending_claim" && !(_id in path("drafts.**"))])`
  )
  return typeof count === 'number' ? count : 0
}

export async function listExecutives(session?: ECCFSession): Promise<ExecutiveRow[]> {
  if (session && !canAccessSection(session.role, 'executives', session)) {
    return []
  }

  if (dataSource() === 'mock') {
    const excos: ExecutiveRow[] = (MOCK_WORKERS || [])
      .filter(
        (w) =>
          w.status !== 'archived' &&
          w.verificationStatus !== 'rejected' &&
          w.positions?.some((position) => position.status === 'approved')
      )
      .map((w) => ({
        _id: w._id,
        fullName: w.fullName,
        email: w.email,
        hall: w.hall,
        profileImageUrl: w.profileImageUrl,
        registrationStatus: 'registered',
        isRegistered: true,
        positions: (w.positions || [])
          .filter((p) => p.status === 'approved')
          .map((p) => ({
            key: p._key || `pos_${Math.random()}`,
            kind: p.kind,
            office: p.office,
            csgbRoleTitle: p.office,
            hallName: p.hall,
            teamTitle: p.teamName || (typeof p.team === 'string' ? p.team : undefined),
            rank: p.rank,
            status: p.status,
            submittedAt: p.submittedAt,
            decidedAt: p.decidedAt,
          })),
      }))
    return stripPII(excos)
  }

  const [rows, reservedAppointments] = await Promise.all([
    sanityPrivateClient.fetch<ExecutiveRow[]>(DASHBOARD_EXECUTIVES_QUERY),
    sanityPrivateClient
      .fetch<ReservedExecutiveAppointment[]>(DASHBOARD_UNREGISTERED_EXECUTIVES_QUERY)
      .catch((err) => {
        console.error('[listExecutives] Unregistered appointment fetch error:', err)
        return []
      }),
  ])

  const registered: ExecutiveRow[] = (rows || [])
    .map((row) => ({
      ...row,
      positions: (row.positions || []).filter((position) => position.status === 'approved'),
      registrationStatus: 'registered' as const,
      isRegistered: true,
    }))
    .filter((row) => row.positions.length > 0)

  const registeredEmails = new Set(
    registered
      .map((row) => row.email?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email))
  )
  const registeredNameKeys = new Set(
    registered
      .map((row) => executiveNameKey(row.fullName))
      .filter((key): key is string => Boolean(key))
  )

  // One leader can hold several roles (CSGB + ministry team). Group their
  // reserved appointments so the roster shows a single card per person.
  const reservedGroups = new Map<string, ReservedExecutiveAppointment[]>()
  for (const appointment of reservedAppointments || []) {
    const email = appointment.email?.trim().toLowerCase()
    const nameKey = executiveNameKey(appointment.fullName, appointment.normalizedName)
    const groupKey = nameKey || (email ? `email:${email}` : undefined)
    if (!groupKey) continue

    const group = reservedGroups.get(groupKey) || []
    group.push(appointment)
    reservedGroups.set(groupKey, group)
  }

  const unregistered: ExecutiveRow[] = []
  for (const group of Array.from(reservedGroups.values())) {
    const first = group[0]
    const groupKey = first.normalizedName?.trim() || executiveNameKey(first.fullName) || `email:${first.email?.trim().toLowerCase()}`
    const hasRegisteredMatch =
      registeredNameKeys.has(groupKey) ||
      group.some((appointment) => {
        const email = appointment.email?.trim().toLowerCase()
        return Boolean(email && registeredEmails.has(email))
      })
    if (hasRegisteredMatch) continue

    unregistered.push({
      _id: first._id,
      fullName: first.fullName,
      email: first.email,
      hall: first.hall,
      importedAt: first.importedAt,
      registrationStatus: 'unregistered',
      isRegistered: false,
      positions: group.map((appointment) => ({
        key: appointment._id,
        kind: appointment.kind,
        office: appointment.office,
        csgbRoleTitle: appointment.csgbRoleTitle || appointment.office,
        csgbRoleRef: appointment.csgbRoleRef,
        hall: appointment.hall,
        hallName: appointment.hallName || appointment.hall,
        teamName: appointment.teamName,
        teamTitle: appointment.teamTitle || appointment.teamName,
        rank: appointment.rank,
        status: 'approved' as const,
        submittedAt: appointment.importedAt,
        decidedBy: appointment.decidedBy,
        decidedById: appointment.decidedById,
        decidedByRole: appointment.decidedByRole,
        decidedAt: appointment.importedAt,
        fromAppointment: true,
      })),
    })
  }

  return stripPII([...registered, ...unregistered])
}

/**
 * Pending executive applications submitted through registration/profile flows.
 * Only approvers see these; everyone else gets an empty list.
 */
export async function listPendingExecutiveApplications(
  session?: ECCFSession
): Promise<PendingExecutiveApplication[]> {
  if (session && !canAccessSection(session.role, 'executives', session)) {
    return []
  }

  if (dataSource() === 'mock') {
    return (MOCK_WORKERS || []).flatMap((w) =>
      (w.positions || [])
        .filter((p) => p.status === 'pending')
        .map((p) => ({
          workerId: w._id,
          fullName: w.fullName,
          email: w.email || '',
          hall: w.hall || '',
          profileImageUrl: w.profileImageUrl,
          createdAt: p.submittedAt,
          position: {
            key: p._key || `pos_${w._id}`,
            kind: p.kind,
            office: p.office,
            csgbRoleTitle: p.office,
            hall: p.hall,
            hallName: p.hall,
            teamName: p.teamName,
            teamTitle: p.teamName,
            rank: p.rank,
            status: 'pending' as const,
            submittedAt: p.submittedAt,
          },
        }))
    )
  }

  try {
    const rows = await sanityPrivateClient.fetch<
      Array<{
        _id: string
        fullName?: string
        email?: string
        hall?: string
        profileImageUrl?: string
        createdAt?: string
        positions?: Array<Record<string, unknown>>
      }>
    >(DASHBOARD_PENDING_EXECUTIVE_POSITIONS_QUERY)

    return stripPII(
      (rows || []).flatMap((row) =>
        // Without a stable _key the decision action cannot address a single
        // position, so legacy entries are left out rather than risking the
        // wrong appointment being approved.
        (row.positions || [])
          .filter((position) => Boolean(position._key))
          .map((position) => ({
            workerId: row._id,
            fullName: row.fullName || 'Unnamed worker',
            email: row.email || '',
            hall: row.hall || '',
            profileImageUrl: row.profileImageUrl,
            createdAt: row.createdAt,
            position: {
              key: String(position._key),
              kind: position.kind as 'csgb' | 'hall' | 'team',
              office: position.office as string | undefined,
              csgbRoleTitle:
                (position.csgbRoleTitle as string | undefined) ||
                (position.office as string | undefined),
              hall: position.hall as string | undefined,
              hallName:
                (position.hallName as string | undefined) ||
                (position.hall as string | undefined),
              teamName: position.teamName as string | undefined,
              teamTitle:
                (position.teamTitle as string | undefined) ||
                (position.teamName as string | undefined),
              rank: position.rank as 'lead' | 'assistant' | undefined,
              status: 'pending' as const,
              submittedAt: position.submittedAt as string | undefined,
            },
          }))
      )
    )
  } catch (err) {
    console.error('[listPendingExecutiveApplications] Sanity fetch error:', err)
    return []
  }
}
