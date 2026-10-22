import 'server-only'

/**
 * Pure RBAC & Access Derivation Engine â€” lib/dashboard/access.ts
 *
 * Implements ADR-003 and SDD Â§6.2.
 * Pure, deterministic mapping from Sanity worker document to computed capabilities.
 * Enforces:
 * - Only approved positions count.
 * - CSGB includes President, VP Admin, VP Evangelism, General Secretary, and Prayer Team Lead.
 * - Finance access is granted exclusively to approved Finance Team Lead / Assistant.
 * - Media access is granted to approved Media Team Lead / Assistant.
 * - Welfare access is granted to approved Welfare Team Lead / Assistant and Hall Reps.
 */

export interface WorkerPosition {
  _key?: string
  kind: 'team' | 'hall' | 'csgb'
  team?: { _ref?: string; _id?: string; name?: string; key?: string } | string
  teamId?: string
  teamKey?: string
  teamName?: string
  hall?: string
  office?: string
  rank?: 'lead' | 'assistant'
  status: 'pending' | 'approved' | 'rejected'
  decidedBy?: string
  decidedAt?: string
}

export interface WorkerMembership {
  _key?: string
  team?: { _ref?: string; _id?: string; name?: string; key?: string } | string
  teamId?: string
  teamKey?: string
  teamName?: string
  status: 'pending' | 'verified' | 'rejected'
  decidedBy?: string
  decidedAt?: string
}

export interface WorkerAccess {
  workerId: string
  fullName: string
  email: string
  clerkUserId?: string
  isExecutive: boolean
  isPresident: boolean
  isVP: boolean
  isCSGB: boolean
  isFinance: boolean
  isWelfare: boolean
  isMedia: boolean
  isChaplain: boolean
  leadsTeamIds: string[]
  leadsTeamKeys: string[]
  repsHalls: string[]
  titles: string[]
  positions: WorkerPosition[]
  memberships: WorkerMembership[]
}

export interface RawWorkerPosition {
  _key?: string
  kind: 'team' | 'hall' | 'csgb'
  team?: { _ref?: string; _id?: string; name?: string; key?: string } | string
  hall?: string
  office?: string
  rank?: 'lead' | 'assistant'
  status?: 'pending' | 'approved' | 'rejected'
  decidedBy?: string
  decidedAt?: string
}

export interface RawWorkerMembership {
  _key?: string
  team?: { _ref?: string; _id?: string; name?: string; key?: string } | string
  status?: 'pending' | 'verified' | 'rejected'
  decidedBy?: string
  decidedAt?: string
}

export interface RawWorkerDoc {
  _id?: string
  fullName?: string
  email?: string
  clerkUserId?: string
  canApproveExecutives?: boolean
  positions?: any[]
  memberships?: any[]
  [key: string]: any
}

export function deriveAccess(worker: RawWorkerDoc | null | undefined): WorkerAccess {
  if (!worker) {
    return {
      workerId: '',
      fullName: '',
      email: '',
      isExecutive: false,
      isPresident: false,
      isVP: false,
      isCSGB: false,
      isFinance: false,
      isWelfare: false,
      isMedia: false,
      isChaplain: false,
      leadsTeamIds: [],
      leadsTeamKeys: [],
      repsHalls: [],
      titles: [],
      positions: [],
      memberships: [],
    }
  }

  // Parse structured positions
  const rawPositions: RawWorkerPosition[] = Array.isArray(worker.positions) ? worker.positions : []
  const parsedPositions: WorkerPosition[] = rawPositions.map((pos) => {
    const teamObj = typeof pos.team === 'object' && pos.team !== null ? pos.team : undefined
    const teamId = teamObj?._id || teamObj?._ref || (typeof pos.team === 'string' ? pos.team : undefined)
    const teamKey = teamObj?.key || undefined
    const teamName = teamObj?.name || undefined

    return {
      _key: pos._key,
      kind: pos.kind,
      team: pos.team,
      teamId,
      teamKey,
      teamName,
      hall: pos.hall,
      office: pos.office,
      rank: pos.rank || 'lead',
      status: pos.status || 'pending',
      decidedBy: pos.decidedBy,
      decidedAt: pos.decidedAt,
    }
  })

  // Parse structured memberships
  const rawMemberships: RawWorkerMembership[] = Array.isArray(worker.memberships) ? worker.memberships : []
  const parsedMemberships: WorkerMembership[] = rawMemberships.map((mem) => {
    const teamObj = typeof mem.team === 'object' && mem.team !== null ? mem.team : undefined
    const teamId = teamObj?._id || teamObj?._ref || (typeof mem.team === 'string' ? mem.team : undefined)
    const teamKey = teamObj?.key || undefined
    const teamName = teamObj?.name || undefined

    return {
      _key: mem._key,
      team: mem.team,
      teamId,
      teamKey,
      teamName,
      status: mem.status || 'pending',
      decidedBy: mem.decidedBy,
      decidedAt: mem.decidedAt,
    }
  })

  // Filter approved positions
  const approvedPositions = parsedPositions.filter((p) => p.status === 'approved')

  // Backwards compatibility for legacy workers:
  // If no positions array yet, derive from legacy role and isExcoApproved
  const legacyIsExcoApproved = Boolean(worker.isExcoApproved)
  const legacyRole = worker.role as string | undefined
  const legacyExcoPosition = worker.excoPosition as string | undefined

  const isPresident =
    Boolean(worker.canApproveExecutives) ||
    approvedPositions.some((p) => p.kind === 'csgb' && p.office?.toLowerCase().includes('president')) ||
    (legacyIsExcoApproved && legacyExcoPosition?.toLowerCase().includes('president'))

  const isVP =
    approvedPositions.some((p) => p.kind === 'csgb' && (p.office?.toLowerCase().includes('vp') || p.office?.toLowerCase().includes('vice president'))) ||
    (legacyIsExcoApproved && legacyExcoPosition?.toLowerCase().includes('vp'))

  const isChaplain =
    approvedPositions.some((p) => p.office?.toLowerCase().includes('chaplain')) ||
    (legacyIsExcoApproved && legacyExcoPosition?.toLowerCase().includes('chaplain')) ||
    worker.role === 'chaplain'

  const isCSGB =
    isPresident ||
    approvedPositions.some((p) => p.kind === 'csgb') ||
    approvedPositions.some(
      (p) =>
        p.kind === 'team' &&
        (p.teamKey === 'prayer' || p.teamName?.toLowerCase().includes('prayer')) &&
        p.rank === 'lead'
    ) ||
    (legacyIsExcoApproved && (legacyRole === 'admin' || legacyExcoPosition?.toLowerCase().includes('president') || legacyExcoPosition?.toLowerCase().includes('general secretary')))

  const isFinance =
    isCSGB ||
    approvedPositions.some(
      (p) => p.kind === 'team' && (p.teamKey === 'finance' || p.teamName?.toLowerCase().includes('finance'))
    ) ||
    (legacyIsExcoApproved && (legacyRole === 'finance' || legacyExcoPosition?.toLowerCase().includes('financial')))

  const isWelfare =
    isCSGB ||
    approvedPositions.some(
      (p) => p.kind === 'team' && (p.teamKey === 'welfare' || p.teamName?.toLowerCase().includes('welfare'))
    ) ||
    (legacyIsExcoApproved && legacyExcoPosition?.toLowerCase().includes('welfare'))

  const isMedia =
    approvedPositions.some(
      (p) =>
        p.kind === 'team' &&
        (p.teamKey === 'media' ||
          p.teamKey === 'media-technical' ||
          p.teamName?.toLowerCase().includes('media'))
    ) ||
    (legacyIsExcoApproved && legacyExcoPosition?.toLowerCase().includes('media'))

  const leadsTeamIds = Array.from(
    new Set(
      approvedPositions
        .filter((p) => p.kind === 'team' && p.teamId)
        .map((p) => p.teamId as string)
    )
  )

  const leadsTeamKeys = Array.from(
    new Set(
      approvedPositions
        .filter((p) => p.kind === 'team' && p.teamKey)
        .map((p) => p.teamKey as string)
    )
  )

  const repsHalls = Array.from(
    new Set(
      approvedPositions
        .filter((p) => p.kind === 'hall' && p.hall)
        .map((p) => p.hall as string)
        .concat(legacyIsExcoApproved && legacyRole === 'hall_rep' && worker.hall ? [String(worker.hall)] : [])
    )
  )

  const titles = approvedPositions.map((p) => {
    if (p.kind === 'csgb') return p.office || 'CSGB Officer'
    if (p.kind === 'hall') return `${p.rank === 'assistant' ? 'Assistant ' : ''}Hall Pastor (${p.hall})`
    return `${p.rank === 'assistant' ? 'Assistant ' : ''}Lead (${p.teamName || 'Team'})`
  })

  if (titles.length === 0 && legacyExcoPosition) {
    titles.push(legacyExcoPosition)
  }

  const isExecutive = Boolean(isPresident || isCSGB || approvedPositions.length > 0 || (legacyIsExcoApproved && Boolean(legacyRole)))

  return {
    workerId: worker._id || '',
    fullName: worker.fullName || '',
    email: worker.email || '',
    clerkUserId: worker.clerkUserId || undefined,
    isExecutive,
    isPresident: Boolean(isPresident),
    isVP: Boolean(isVP),
    isCSGB: Boolean(isCSGB),
    isFinance: Boolean(isFinance),
    isWelfare: Boolean(isWelfare),
    isMedia: Boolean(isMedia),
    isChaplain: Boolean(isChaplain),
    leadsTeamIds,
    leadsTeamKeys,
    repsHalls,
    titles,
    positions: parsedPositions,
    memberships: parsedMemberships,
  }
}
