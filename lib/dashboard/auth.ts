/**
 * Dashboard auth boundary — SERVER-SIDE ONLY.
 *
 * Implements Clerk Authentication (ADR-003):
 * - Checks currentUser() from @clerk/nextjs/server
 * - Matches worker in Sanity by clerkUserId or lower(email)
 * - Auto-links clerkUserId on email match
 * - Calls deriveAccess(worker)
 * - Returns { worker, access, ...session }
 * - Retains DASHBOARD_MOCK_AUTH=1 outside production for development
 */

import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { patchPrivateDocument, sanityPrivateClient } from '@/lib/sanity'
import { deriveAccess, type WorkerAccess, type RawWorkerPosition, type RawWorkerMembership } from './access'
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

export interface DashboardSession extends ECCFSession {
  worker: Record<string, unknown>
  access: WorkerAccess
  email?: string
}

interface SanityWorkerSessionDoc {
  _id: string
  _rev?: string
  fullName?: string
  email?: string
  clerkUserId?: string
  role?: WorkerRole
  requestedRole?: WorkerRole
  excoPosition?: string
  isExcoApproved?: boolean
  canApproveExecutives?: boolean
  profileImageUrl?: string
  team?: { name?: string } | string
  hall?: string
  leadingTeam?: { name?: string } | string
  teams?: Array<{ name?: string } | string>
  positions?: RawWorkerPosition[]
  memberships?: RawWorkerMembership[]
  [key: string]: unknown
}

/** Mock identities — ids match workers in lib/dashboard/mock/data.ts. */
const MOCK_SESSIONS: Record<WorkerRole, ECCFSession> = {
  admin: {
    id: 'mock-worker-admin',
    name: 'Osaro Igbinedion',
    role: 'admin',
    team: 'Exco',
    teams: ['Executive Council'],
    excoPosition: 'President',
    hall: 'Hall A',
    email: 'admin@eccf.org',
  },
  team_lead: {
    id: 'mock-worker-teamlead',
    name: 'Tobi Adebayo',
    role: 'team_lead',
    team: 'Media',
    teams: ['Media', 'Technical'],
    leadingTeam: 'Media',
    excoPosition: 'Media Coordinator',
    hall: 'Hall D',
    email: 'media@eccf.org',
  },
  hall_rep: {
    id: 'mock-worker-hallrep',
    name: 'Ivie Aigbe',
    role: 'hall_rep',
    team: 'Welfare',
    teams: ['Welfare'],
    hall: 'Hall B',
    email: 'welfare@eccf.org',
  },
  finance: {
    id: 'mock-worker-finance',
    name: 'Efosa Osagie',
    role: 'finance',
    team: 'Finance',
    teams: ['Finance'],
    excoPosition: 'Financial Secretary',
    hall: 'Hall C',
    email: 'finance@eccf.org',
  },
}

export function isMockAuthEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.DASHBOARD_MOCK_AUTH === '1'
}

export async function getSession(): Promise<DashboardSession | null> {
  if (isMockAuthEnabled()) {
    const cookieRole = cookies().get(DEV_ROLE_COOKIE)?.value
    const roleKey = isWorkerRole(cookieRole) ? cookieRole : 'admin'
    const mock = MOCK_SESSIONS[roleKey]
    const mockWorker: Record<string, unknown> = {
      _id: mock.id,
      fullName: mock.name,
      role: mock.role,
      profileImageUrl: mock.profileImageUrl,
      team: mock.team,
      teams: mock.teams,
      leadingTeam: mock.leadingTeam,
      excoPosition: mock.excoPosition,
      hall: mock.hall,
      isExcoApproved: true,
      canApproveExecutives: roleKey === 'admin',
      email: mock.email,
    }
    const access = deriveAccess(mockWorker)
    return {
      ...mock,
      profileImageUrl: mock.profileImageUrl,
      worker: mockWorker,
      access,
    }
  }

  let clerkUser = null
  try {
    clerkUser = await currentUser()
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[getSession] Clerk currentUser() error:', err)
    }
    return null
  }

  if (!clerkUser) return null

  const primaryEmailObj =
    clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId) ||
    clerkUser.emailAddresses?.[0]
  const isEmailVerified = primaryEmailObj?.verification?.status === 'verified'
  const primaryEmail = (primaryEmailObj?.emailAddress || '').toLowerCase().trim()

  const clerkUserId = clerkUser.id
  if (!primaryEmail && !clerkUserId) return null

  let worker: SanityWorkerSessionDoc | null = null
  try {
    worker = await sanityPrivateClient.fetch<SanityWorkerSessionDoc | null>(
      `*[_type == "worker" && (
        (defined(clerkUserId) && clerkUserId == $clerkUserId) ||
        ($isEmailVerified && defined(email) && lower(email) == $primaryEmail)
      )][0]{
        _id,
        _rev,
        fullName,
        email,
        clerkUserId,
        role,
        requestedRole,
        excoPosition,
        isExcoApproved,
        canApproveExecutives,
        "profileImageUrl": coalesce(profileImageUrl, headshot.asset->url),
        "team": coalesce(team->name, team),
        "hall": coalesce(hallRef->name, hall),
        "leadingTeam": coalesce(leadingTeam->name, leadingTeam),
        "teams": coalesce(teams[]->name, teams, [coalesce(team->name, team)]),
        positions[] {
          kind,
          "team": team->{ _id, name, "key": coalesce(key, slug.current) },
          "csgbRole": csgbRole->{ _id, title, "key": coalesce(slug.current, key), canApproveExecutives },
          "hall": coalesce(hallRef->name, hall),
          "office": coalesce(csgbRole->title, office),
          rank,
          status
        },
        memberships[] {
          "team": team->{ _id, name, "key": coalesce(key, slug.current) },
          status
        }
      }`,
      { clerkUserId, primaryEmail, isEmailVerified }
    )
  } catch (err) {
    console.error('[getSession] Error querying worker from Sanity:', err)
    return null
  }

  if (!worker) return null

  // If matched by email without clerkUserId, or clerkUserId has changed, patch in Sanity (only if email is verified)
  if (worker._id && (!worker.clerkUserId || worker.clerkUserId !== clerkUserId)) {
    if (isEmailVerified) {
      try {
        await patchPrivateDocument(String(worker._id))
          .set({ clerkUserId })
          .commit()
        worker.clerkUserId = clerkUserId
      } catch (patchErr) {
        console.warn('[getSession] Failed to patch clerkUserId to worker in Sanity:', patchErr)
      }
    }
  }
  const access = deriveAccess(worker)

  if (!access.isExecutive) {
    return null
  }

  // Derive backwards-compatible WorkerRole
  let role: WorkerRole = 'team_lead'
  if (isWorkerRole(worker.role)) {
    role = worker.role
  } else if (access.isCSGB || access.isPresident) {
    role = 'admin'
  } else if (access.isFinance) {
    role = 'finance'
  } else if (access.repsHalls.length > 0) {
    role = 'hall_rep'
  }

  const teamObj = worker.team
  const team = typeof teamObj === 'string' ? teamObj : teamObj?.name || 'Exco'
  const rawTeams = worker.teams || []
  const teams = Array.isArray(rawTeams)
    ? (rawTeams.map((t) => (typeof t === 'string' ? t : t?.name)).filter(Boolean) as string[])
    : [team]

  const displayName =
    worker.fullName ||
    access.fullName ||
    (clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : undefined)

  const leadingTeamObj = worker.leadingTeam
  const leadingTeam = typeof leadingTeamObj === 'string' ? leadingTeamObj : leadingTeamObj?.name
  const excoPosition = (typeof worker.excoPosition === 'string' ? worker.excoPosition : undefined) || access.titles[0]
  const hall = (typeof worker.hall === 'string' ? worker.hall : undefined) || access.repsHalls[0]

  return {
    id: String(worker._id || access.workerId),
    name: displayName,
    role,
    team,
    teams,
    leadingTeam,
    excoPosition,
    hall,
    email: primaryEmail || (typeof worker.email === 'string' ? worker.email : undefined),
    profileImageUrl:
      (typeof worker.profileImageUrl === 'string' && worker.profileImageUrl ? worker.profileImageUrl : undefined) ||
      clerkUser.imageUrl ||
      undefined,
    worker: worker as Record<string, unknown>,
    access,
  }
}

/** For pages/layouts: redirect to /login when there is no session. */
export async function requireSession(): Promise<DashboardSession> {
  const session = await getSession()
  if (!session) redirect('/login?denied=approval_pending')
  return session
}

/** For pages: redirect to the overview (open to every role) when the role can't see this section. */
export async function requireSection(section: DashboardSection): Promise<DashboardSession> {
  const session = await requireSession()
  if (!canAccessSection(session.role, section, session)) redirect(`${SECTION_PATHS.overview}?denied=${section}`)
  return session
}

/**
 * For Server Actions (RBAC layer 2, SDD §7.3): re-check session and role
 * on every call. Returns a typed failure instead of throwing so the client
 * can show a toast.
 */
export async function authorize(
  permission: DashboardPermission
): Promise<{ ok: true; session: DashboardSession } | Extract<ActionResult<never>, { ok: false }>> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Your session has expired. Please sign in again.' }
  if (!hasPermission(session.role, permission)) {
    return { ok: false, error: 'You do not have permission to do that.' }
  }
  return { ok: true, session }
}
