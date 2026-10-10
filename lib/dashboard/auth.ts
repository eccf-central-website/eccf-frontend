/**
 * Dashboard auth boundary — SERVER-SIDE ONLY.
 *
 * Every dashboard page and Server Action gets the session from here, never
 * from NextAuth directly, so the mock → NextAuth swap is a one-file change.
 *
 * Today: NextAuth is not configured yet (feature/dashboard-auth). Outside
 * production, setting DASHBOARD_MOCK_AUTH=1 enables a mock session whose role
 * comes from the `eccf-dev-role` cookie (default: admin). In production the
 * mock path is unreachable and getSession() returns null until NextAuth lands,
 * so /dashboard always redirects to /login.
 */

import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth-options'
import type { ECCFSession, WorkerRole } from '@/types'
import {
  canAccessSection,
  hasPermission,
  isWorkerRole,
  SECTION_PATHS,
  type DashboardPermission,
  type DashboardSection,
} from './rbac'
import type { ActionResult } from './action-result'

export const DEV_ROLE_COOKIE = 'eccf-dev-role'

/** Mock identities — ids match workers in lib/dashboard/mock/data.ts. */
const MOCK_SESSIONS: Record<WorkerRole, ECCFSession> = {
  admin: { id: 'mock-worker-admin', role: 'admin', team: 'Exco', teams: ['Executive Council'], excoPosition: 'President' },
  team_lead: { id: 'mock-worker-teamlead', role: 'team_lead', team: 'Media', teams: ['Media', 'Technical'], excoPosition: 'Media Coordinator' },
  hall_rep: { id: 'mock-worker-hallrep', role: 'hall_rep', team: 'Welfare', teams: ['Welfare'] },
  finance: { id: 'mock-worker-finance', role: 'finance', team: 'Finance', teams: ['Finance'], excoPosition: 'Financial Secretary' },
}

export function isMockAuthEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.DASHBOARD_MOCK_AUTH === '1'
}

export async function getSession(): Promise<ECCFSession | null> {
  if (isMockAuthEnabled()) {
    const cookieRole = cookies().get(DEV_ROLE_COOKIE)?.value
    return MOCK_SESSIONS[isWorkerRole(cookieRole) ? cookieRole : 'admin']
  }

  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const user = session.user as unknown as { id?: string; role?: WorkerRole; team?: string; teams?: string[]; excoPosition?: string }
  if (!user.id || !user.role) return null

  return {
    id: user.id,
    role: user.role,
    team: user.team || 'Exco',
    teams: user.teams,
    excoPosition: user.excoPosition,
  }
}

/** For pages/layouts: redirect to /login when there is no session. */
export async function requireSession(): Promise<ECCFSession> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

/** For pages: redirect to the overview (open to every role) when the role can't see this section. */
export async function requireSection(section: DashboardSection): Promise<ECCFSession> {
  const session = await requireSession()
  if (!canAccessSection(session.role, section)) redirect(`${SECTION_PATHS.overview}?denied=${section}`)
  return session
}

/**
 * For Server Actions (RBAC layer 2, SDD §7.3): re-check session and role
 * on every call. Returns a typed failure instead of throwing so the client
 * can show a toast.
 */
export async function authorize(
  permission: DashboardPermission
): Promise<{ ok: true; session: ECCFSession } | Extract<ActionResult<never>, { ok: false }>> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Your session has expired. Please sign in again.' }
  if (!hasPermission(session.role, permission)) {
    return { ok: false, error: 'You do not have permission to do that.' }
  }
  return { ok: true, session }
}
