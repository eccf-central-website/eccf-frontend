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
  | 'executives'
  | 'workers'
  | 'attendance'
  | 'finance'
  | 'firstTimers'
  | 'welfare'
  | 'prayerRequests'
  | 'announcements'
  | 'sermons'
  | 'settings'

export type DashboardPermission =
  | 'attendance:create'
  | 'finance:create'
  | 'welfare:resolve'
  | 'sermons:sync'
  | 'sermons:manage'
  | 'announcements:manage'
  | 'workers:import'
  | 'workers:delete'
  | 'executives:view'
  | 'executives:approve'
  | 'settings:view'
  /** Overview cards that show money totals */
  | 'stats:finance'
  /** Overview cards about people (first-timers, welfare, workers) */
  | 'stats:people'

export const ROLES: readonly WorkerRole[] = ['admin', 'team_lead', 'finance', 'hall_rep']

export const ROLE_LABELS: Record<WorkerRole, string> = {
  admin: 'CSGB Executive',
  team_lead: 'Team Leader',
  finance: 'Finance',
  hall_rep: 'Hall Pastor',
}

export interface LeaderPostContext {
  role: WorkerRole
  excoPosition?: string | null
  leadingTeam?: string | null
  team?: string | null
  teams?: string[] | null
  hall?: string | null
  access?: {
    isPresident?: boolean
    isVP?: boolean
    isChaplain?: boolean
    isPrayerCoordinator?: boolean
    isFinance?: boolean
    isCSGB?: boolean
    titles?: string[]
    repsHalls?: string[]
  } | null
}

/**
 * Returns a prominent, human-readable ministerial post/office for a dashboard leader
 * (e.g. "Vice President", "President", "General Secretary", "Media Coordinator", "Hall Pastor (Hall 1)").
 * Avoids generic fallbacks like "CSGB Admin" or raw team membership strings.
 */
export function getLeaderPostTitle(context: LeaderPostContext): string {
  // 1. Explicit excoPosition (e.g., "Vice President", "President", "General Secretary", "Media Coordinator")
  const rawPosition = context.excoPosition?.trim()
  if (rawPosition) {
    const leadMatch = rawPosition.match(/^Lead\s*\((.+)\)$/i)
    if (leadMatch) return `${leadMatch[1]} Lead`
    const asstMatch = rawPosition.match(/^Assistant\s+Lead\s*\((.+)\)$/i)
    if (asstMatch) return `Assistant ${asstMatch[1]} Lead`
    return rawPosition
  }

  // 2. First title from approved positions in access
  if (context.access?.titles && context.access.titles.length > 0) {
    const raw = context.access.titles[0].trim()
    const leadMatch = raw.match(/^Lead\s*\((.+)\)$/i)
    if (leadMatch) return `${leadMatch[1]} Lead`
    const asstMatch = raw.match(/^Assistant\s+Lead\s*\((.+)\)$/i)
    if (asstMatch) return `Assistant ${asstMatch[1]} Lead`
    return raw
  }

  // 3. Specific leadership flags
  if (context.access?.isPresident) return 'President'
  if (context.access?.isVP) return 'Vice President'
  if (context.access?.isPrayerCoordinator) return 'Prayer Coordinator'
  if (context.access?.isChaplain) return 'Fellowship Chaplain'
  if (context.access?.isFinance) return 'Financial Secretary'

  // 4. Role-based fallback with contextual team/hall assignment
  if (context.role === 'admin') {
    return 'CSGB Executive'
  }
  if (context.role === 'team_lead') {
    const teamName = context.leadingTeam || context.team
    return teamName && teamName.toLowerCase() !== 'exco' ? `${teamName} Lead` : 'Team Leader'
  }
  if (context.role === 'hall_rep') {
    const hallName = context.hall || context.access?.repsHalls?.[0]
    return hallName ? `Hall Pastor (${hallName})` : 'Hall Pastor'
  }
  if (context.role === 'finance') {
    return 'Financial Secretary'
  }

  return ROLE_LABELS[context.role] || 'Fellowship Executive'
}

/** URL path for each section. Intake paths match revalidatePath() calls in app/actions/intake-actions.ts. */
export const SECTION_PATHS: Record<DashboardSection, string> = {
  overview: '/dashboard',
  executives: '/dashboard/executives',
  workers: '/dashboard/workers',
  attendance: '/dashboard/attendance',
  finance: '/dashboard/finance',
  firstTimers: '/dashboard/first-timers',
  welfare: '/dashboard/welfare',
  prayerRequests: '/dashboard/prayer-requests',
  announcements: '/dashboard/announcements',
  sermons: '/dashboard/sermons',
  settings: '/dashboard/settings',
}

const SECTION_ACCESS: Record<DashboardSection, readonly WorkerRole[]> = {
  overview: ['admin', 'team_lead', 'finance', 'hall_rep'],
  executives: ['admin'],
  workers: ['admin', 'team_lead', 'hall_rep'],
  attendance: ['admin', 'team_lead', 'hall_rep'],
  finance: ['admin', 'finance'],
  firstTimers: ['admin', 'hall_rep'],
  welfare: ['admin', 'team_lead', 'hall_rep'],
  prayerRequests: ['admin', 'team_lead', 'hall_rep'],
  announcements: ['admin', 'team_lead'],
  sermons: ['admin', 'team_lead'],
  settings: ['admin'],
}

const PERMISSIONS: Record<DashboardPermission, readonly WorkerRole[]> = {
  'attendance:create': ['admin', 'team_lead', 'hall_rep'],
  'finance:create': ['admin', 'finance'],
  'welfare:resolve': ['admin', 'team_lead', 'hall_rep'],
  // ADR-002: manual sync & management is strictly for media team leaders
  'sermons:sync': ['admin', 'team_lead'],
  'sermons:manage': ['admin', 'team_lead'],
  'announcements:manage': ['admin', 'team_lead'],
  'workers:import': ['admin'],
  'workers:delete': ['admin'],
  'executives:view': ['admin'],
  'executives:approve': ['admin'],
  'settings:view': ['admin'],
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
    access?: { isPrayerCoordinator?: boolean; isCSGB?: boolean; [key: string]: unknown }
  } | null
): boolean {
  if (!session) return false
  if (session.access?.isPrayerCoordinator) return true
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

/**
 * Welfare requests contain a requester's phone number. Only the groups who
 * actually coordinate care may see it: CSGB officers and the Welfare & Medical
 * team. Other roles with welfare section access (e.g. hall reps) still see the
 * request text and status, but not the contact number.
 */
export function canViewWelfareContact(
  session?: {
    role?: string
    team?: string
    teams?: string[]
    leadingTeam?: string
    excoPosition?: string
    access?: { isWelfare?: boolean; isCSGB?: boolean }
  } | null
): boolean {
  if (!session) return false
  if (session.access) {
    return Boolean(session.access.isWelfare || session.access.isCSGB)
  }
  return isCSGBMember(session)
}

export function isMediaLeader(
  session?: {
    access?: { isMedia?: boolean; [key: string]: unknown }
    role?: string
    team?: string
    teams?: string[]
    leadingTeam?: string
    excoPosition?: string
  } | null
): boolean {
  if (!session) return false
  if (session.access && typeof session.access.isMedia === 'boolean') {
    return session.access.isMedia
  }

  const team = (session.team || '').toLowerCase()
  const leadingTeam = (session.leadingTeam || '').toLowerCase()
  const position = (session.excoPosition || '').toLowerCase()

  return (
    leadingTeam.includes('media') ||
    position.includes('media') ||
    team.includes('media')
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
    access?: { isPresident?: boolean; isPrayerCoordinator?: boolean; isCSGB?: boolean; [key: string]: unknown }
  } | null
): boolean {
  const currentSession = session ? { ...session, role: session.role || role } : { role }

  if (section === 'executives') {
    if (currentSession?.access && typeof currentSession.access.isPresident === 'boolean' && currentSession.access.isPresident) {
      return true
    }
    if (role === 'admin' || Boolean(currentSession?.access?.isCSGB)) {
      return true
    }
    const pos = (currentSession.excoPosition || '').toLowerCase()
    return Boolean(pos.includes('president') || pos.includes('vice president') || pos.includes('general secretary'))
  }
  if (section === 'settings') {
    return role === 'admin' || Boolean(currentSession?.access?.isPresident) || Boolean(currentSession?.access?.isCSGB)
  }
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
