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

export type DashboardPermission =
  | 'attendance:create'
  | 'finance:create'
  | 'welfare:resolve'
  | 'announcements:create'
  | 'sermons:sync'
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
}

const PERMISSIONS: Record<DashboardPermission, readonly WorkerRole[]> = {
  'attendance:create': ['admin', 'team_lead', 'hall_rep'],
  'finance:create': ['admin', 'finance'],
  'welfare:resolve': ['admin', 'team_lead', 'hall_rep'],
  'announcements:create': ['admin', 'team_lead'],
  // ADR-002 §5.2.1: manual sync is admin, media team_lead, or hall_rep
  'sermons:sync': ['admin', 'team_lead', 'hall_rep'],
  'stats:finance': ['admin', 'finance'],
  'stats:people': ['admin', 'team_lead', 'hall_rep'],
}

export function isOutreachLeader(session?: { team?: string; excoPosition?: string } | null): boolean {
  if (!session) return false
  const team = (session.team || '').toLowerCase()
  const position = (session.excoPosition || '').toLowerCase()
  return (
    team.includes('outreach') ||
    team.includes('evangelism') ||
    team.includes('follow') ||
    position.includes('outreach') ||
    position.includes('evangelism') ||
    position.includes('follow')
  )
}

export function canAccessSection(
  role: WorkerRole,
  section: DashboardSection,
  session?: { team?: string; excoPosition?: string } | null
): boolean {
  if (section === 'firstTimers') {
    if (role === 'admin' || role === 'hall_rep') return true
    if (role === 'team_lead') {
      return session ? isOutreachLeader(session) : false
    }
    return false
  }
  return SECTION_ACCESS[section].includes(role)
}

export function hasPermission(role: WorkerRole, permission: DashboardPermission): boolean {
  return PERMISSIONS[permission].includes(role)
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

export function requirePermission(role: string, permission: string) {
  if (permission === 'finance' || permission === 'finance:create') {
    if (!['admin', 'finance'].includes(role)) {
      throw new Error(`Permission denied for role ${role} on finance`)
    }
    return
  }
  if (permission === 'welfare' || permission === 'welfare:resolve') {
    if (!['admin', 'team_lead', 'hall_rep'].includes(role)) {
      throw new Error(`Permission denied for role ${role} on welfare`)
    }
    return
  }
  if (permission === 'announcements' || permission === 'announcements:create') {
    if (!['admin', 'team_lead'].includes(role)) {
      throw new Error(`Permission denied for role ${role} on announcements`)
    }
    return
  }
  if (permission === 'prayer' || permission === 'prayerRequests') {
    if (!['admin', 'team_lead', 'hall_rep'].includes(role)) {
      throw new Error(`Permission denied for role ${role} on prayer`)
    }
    return
  }
  if (permission === 'sermons' || permission === 'sermons:sync') {
    if (!['admin', 'team_lead', 'hall_rep'].includes(role)) {
      throw new Error(`Permission denied for role ${role} on sermons`)
    }
    return
  }
  if (!hasPermission(role as WorkerRole, permission as DashboardPermission)) {
    throw new Error(`Permission denied for role ${role} on ${permission}`)
  }
}

export function isWorkerRole(value: unknown): value is WorkerRole {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}
