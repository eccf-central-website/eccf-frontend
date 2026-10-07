/**
 * Exco Dashboard RBAC matrix — the single source of truth for who can see
 * which dashboard section and perform which action.
 *
 * Consumed by: the sidebar nav (visibility), each page (`requireSection`),
 * each Server Action (`requirePermission`), and — once auth lands —
 * middleware.ts (route-level guard). Pure data, safe to import anywhere.
 *
 * Matrix approved 2026-10-05 (pending Ransom's confirmation):
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

export type DashboardPermission =
  | 'attendance:create'
  | 'finance:create'
  | 'welfare:resolve'
  | 'sermons:sync'
  /** Overview cards that show money totals */
  | 'stats:finance'
  /** Overview cards about people (first-timers, welfare, workers) */
  | 'stats:people'

export const ROLES: readonly WorkerRole[] = ['admin', 'hall_rep', 'finance']

export const ROLE_LABELS: Record<WorkerRole, string> = {
  admin: 'Admin',
  hall_rep: 'Hall Rep',
  finance: 'Finance',
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
}

const SECTION_ACCESS: Record<DashboardSection, readonly WorkerRole[]> = {
  overview: ['admin', 'hall_rep', 'finance'],
  workers: ['admin', 'hall_rep'],
  attendance: ['admin', 'hall_rep'],
  finance: ['admin', 'finance'],
  firstTimers: ['admin', 'hall_rep'],
  welfare: ['admin', 'hall_rep'],
  prayerRequests: ['admin', 'hall_rep'],
}

const PERMISSIONS: Record<DashboardPermission, readonly WorkerRole[]> = {
  'attendance:create': ['admin', 'hall_rep'],
  'finance:create': ['admin', 'finance'],
  'welfare:resolve': ['admin', 'hall_rep'],
  // ADR-002 §5.2.1: manual sync is admin or hall_rep
  'sermons:sync': ['admin', 'hall_rep'],
  'stats:finance': ['admin', 'finance'],
  'stats:people': ['admin', 'hall_rep'],
}

export function canAccessSection(role: WorkerRole, section: DashboardSection): boolean {
  return SECTION_ACCESS[section].includes(role)
}

export function hasPermission(role: WorkerRole, permission: DashboardPermission): boolean {
  return PERMISSIONS[permission].includes(role)
}

/** hall_rep sees only workers from their own hall; other roles see all. */
export function isHallScoped(role: WorkerRole): boolean {
  return role === 'hall_rep'
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
