/**
 * Exco Dashboard RBAC matrix — the single source of truth for who can see
 * which dashboard section and perform which action.
 *
 * Consumed by: the sidebar nav (visibility), each page (`requireSection`),
 * each Server Action (`requirePermission`), and — once auth lands —
 * middleware.ts (route-level guard). Pure data, safe to import anywhere.
 *
 * Matrix approved 2026-10-05 (pending administrator's confirmation):
 *   admin    — everything
 *   hall_rep — overview (people cards), workers (own hall only), attendance,
 *              first-timers, welfare, prayer requests
 *   finance  — overview (finance cards), finance ledger
 */

import type { WorkerRole } from '@/types'

export type DashboardSection =
  | 'overview'
  | 'workers'
  | 'attendance'
  | 'finance'
  | 'firstTimers'
  | 'welfare'
  | 'prayerRequests'
  | 'announcements'
  | 'sermons'

export type DashboardPermission =
  | 'attendance:create'
  | 'finance:create'
  | 'welfare:resolve'
  | 'sermons:sync'
  | 'sermons:manage'
  | 'announcements:manage'
  /** Overview cards that show money totals */
  | 'stats:finance'
  /** Overview cards about people (first-timers, welfare, workers) */
  | 'stats:people'

export const ROLES: readonly WorkerRole[] = ['admin', 'team_lead', 'finance', 'hall_rep']

export const ROLE_LABELS: Record<WorkerRole, string> = {
  admin: 'CSGB Admin',
  team_lead: 'Team Leader',
  finance: 'Finance',
  hall_rep: 'Hall Rep',
}

/** URL path for each section. Intake paths match revalidatePath() calls in app/actions/intake-actions.ts. */
export const SECTION_PATHS: Record<DashboardSection, string> = {
  overview: '/dashboard',
  workers: '/dashboard/workers',
  attendance: '/dashboard/attendance',
  finance: '/dashboard/finance',
  firstTimers: '/dashboard/first-timers',
  welfare: '/dashboard/welfare',
  prayerRequests: '/dashboard/prayer-requests',
  announcements: '/dashboard/announcements',
  sermons: '/dashboard/sermons',
}

const SECTION_ACCESS: Record<DashboardSection, readonly WorkerRole[]> = {
  overview: ['admin', 'team_lead', 'finance', 'hall_rep'],
  workers: ['admin', 'team_lead', 'hall_rep'],
  attendance: ['admin', 'team_lead', 'hall_rep'],
  finance: ['admin', 'finance'],
  firstTimers: ['admin', 'hall_rep'],
  welfare: ['admin', 'team_lead', 'hall_rep'],
  prayerRequests: ['admin', 'team_lead', 'hall_rep'],
  announcements: ['admin', 'team_lead'],
  sermons: ['admin', 'team_lead'],
}

const PERMISSIONS: Record<DashboardPermission, readonly WorkerRole[]> = {
  'attendance:create': ['admin', 'team_lead', 'hall_rep'],
  'finance:create': ['admin', 'finance'],
  'welfare:resolve': ['admin', 'team_lead', 'hall_rep'],
  // ADR-002: manual sync & management is strictly for media team leaders
  'sermons:sync': ['admin', 'team_lead'],
  'sermons:manage': ['admin', 'team_lead'],
  'announcements:manage': ['admin', 'team_lead'],
  'stats:finance': ['admin', 'finance'],
  'stats:people': ['admin', 'team_lead', 'hall_rep'],
}

export function isCSGBMember(
  session?: {
    role?: string
    team?: string
    teams?: string[]
    leadingTeam?: string
    excoPosition?: string
  } | null
): boolean {
  if (!session) return false
  if (session.role === 'admin') return true
  const position = (session.excoPosition || '').toLowerCase()
  const team = (session.team || '').toLowerCase()
  const leadingTeam = (session.leadingTeam || '').toLowerCase()
  const hasPrayerInTeams = session.teams?.some((t) => t.toLowerCase().includes('prayer')) ?? false

  return (
    position.includes('president') ||
    position.includes('vice president') ||
    (position.includes('general secretary') && !position.includes('financial')) ||
    position.includes('prayer') ||
    team.includes('prayer') ||
    leadingTeam.includes('prayer') ||
    hasPrayerInTeams
  )
}

export function isMediaLeader(
  session?: {
    role?: string
    team?: string
    teams?: string[]
    leadingTeam?: string
    excoPosition?: string
  } | null
): boolean {
  if (!session) return false
  const role = session.role
  const isLeaderOrAdmin = role === 'team_lead' || role === 'admin'
  if (!isLeaderOrAdmin) return false

  const team = (session.team || '').toLowerCase()
  const leadingTeam = (session.leadingTeam || '').toLowerCase()
  const position = (session.excoPosition || '').toLowerCase()
  const hasMediaInTeams = session.teams?.some((t) => t.toLowerCase().includes('media')) ?? false

  return (
    team.includes('media') ||
    team.includes('publicity') ||
    leadingTeam.includes('media') ||
    position.includes('media') ||
    position.includes('publicity') ||
    hasMediaInTeams
  )
}

export function isUsheringTeam(
  session?: {
    team?: string
    teams?: string[]
    leadingTeam?: string
    excoPosition?: string
  } | null
): boolean {
  if (!session) return false
  const team = (session.team || '').toLowerCase()
  const leadingTeam = (session.leadingTeam || '').toLowerCase()
  const position = (session.excoPosition || '').toLowerCase()
  const hasUsherInTeams = session.teams?.some((t) => t.toLowerCase().includes('usher')) ?? false

  return (
    team.includes('usher') ||
    leadingTeam.includes('usher') ||
    position.includes('usher') ||
    hasUsherInTeams
  )
}

export function isOutreachLeader(
  session?: {
    team?: string
    teams?: string[]
    excoPosition?: string
    leadingTeam?: string
  } | null
): boolean {
  if (!session) return false
  const team = (session.team || '').toLowerCase()
  const position = (session.excoPosition || '').toLowerCase()
  const leadingTeam = (session.leadingTeam || '').toLowerCase()
  const hasOutreachInTeams =
    session.teams?.some((t) => {
      const s = t.toLowerCase()
      return s.includes('outreach') || s.includes('evangelism') || s.includes('follow')
    }) ?? false
  return (
    team.includes('outreach') ||
    team.includes('evangelism') ||
    team.includes('follow') ||
    position.includes('outreach') ||
    position.includes('evangelism') ||
    position.includes('follow') ||
    leadingTeam.includes('outreach') ||
    leadingTeam.includes('evangelism') ||
    leadingTeam.includes('follow') ||
    hasOutreachInTeams
  )
}

export function canAccessSection(
  role: WorkerRole,
  section: DashboardSection,
  session?: {
    role?: WorkerRole
    team?: string
    teams?: string[]
    excoPosition?: string
    leadingTeam?: string
  } | null
): boolean {
  const currentSession = session ? { ...session, role: session.role || role } : { role }

  if (section === 'announcements') {
    return isCSGBMember(currentSession)
  }
  if (section === 'sermons') {
    return isMediaLeader(currentSession)
  }
  if (section === 'attendance') {
    return role === 'admin' || role === 'team_lead' || role === 'hall_rep'
  }
  if (section === 'firstTimers') {
    if (role === 'admin' || role === 'hall_rep') return true
    if (role === 'team_lead') {
      return isOutreachLeader(currentSession)
    }
    return false
  }
  return SECTION_ACCESS[section].includes(role)
}

export function hasPermission(role: WorkerRole, permission: DashboardPermission): boolean {
  return PERMISSIONS[permission].includes(role)
}

export function requirePermission(role: string, permission: DashboardPermission): void {
  if (!isWorkerRole(role) || !hasPermission(role, permission)) {
    throw new Error(`Permission denied for role ${role} on ${permission}`)
  }
}

/** hall_rep sees only workers from their own hall; other roles see all. */
export function isHallScoped(role: WorkerRole): boolean {
  return role === 'hall_rep'
}

export function isMediaTeam(
  session?: {
    team?: string
    teams?: string[]
    excoPosition?: string
    leadingTeam?: string
  } | null
): boolean {
  if (!session) return false
  const team = (session.team || '').toLowerCase()
  const position = (session.excoPosition || '').toLowerCase()
  const leadingTeam = (session.leadingTeam || '').toLowerCase()
  const hasMediaInTeams = session.teams?.some((t) => t.toLowerCase().includes('media')) ?? false
  return (
    team.includes('media') ||
    team.includes('publicity') ||
    position.includes('media') ||
    position.includes('publicity') ||
    leadingTeam.includes('media') ||
    hasMediaInTeams
  )
}

/**
 * team_lead sees workers scoped to their operational team, UNLESS they are
 * the Media Team (which requires fellowship-wide worker visibility to design birthday flyers).
 */
export function isTeamScoped(
  role: WorkerRole,
  session?: {
    team?: string
    teams?: string[]
    excoPosition?: string
    leadingTeam?: string
  } | null
): boolean {
  if (role !== 'team_lead') return false
  if (session && isMediaTeam(session)) return false
  return true
}

/**
 * Resolve which section a /dashboard pathname belongs to (longest prefix
 * wins), for the route-level guard. Returns null for non-dashboard paths.
 */
export function sectionForPath(pathname: string): DashboardSection | null {
  let match: DashboardSection | null = null
  let matchLength = -1
  for (const [section, path] of Object.entries(SECTION_PATHS) as [DashboardSection, string][]) {
    if ((pathname === path || pathname.startsWith(`${path}/`)) && path.length > matchLength) {
      match = section
      matchLength = path.length
    }
  }
  return match
}

export function isWorkerRole(value: unknown): value is WorkerRole {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}
