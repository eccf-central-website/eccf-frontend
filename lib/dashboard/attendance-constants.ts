/**
 * Canonical fellowship teams and service meeting types.
 * Source: ECCF Teams.md
 */

/**
 * Offline fallback only. The live team list is read from Sanity `teamUnit`
 * documents via `getTeamUnitOptions()` (lib/teams.ts). Keep this list for
 * environments where Sanity is unreachable, and for legacy alias matching in
 * server actions.
 */
export const FELLOWSHIP_TEAMS = [
  'Bible Study/Sunday School Team',
  'Prayer Team',
  'Protocol Team',
  'Financial Team',
  'Choir Team',
  'Ushering Team',
  'Drama/Creative Media Team',
  'Outreach Team',
  'Welfare/Medical Team',
  'Academic Team',
  'Colporteur/Library Team',
  'Technical Team',
  'Media Team',
  'Decoration Team',
] as const

/** A selectable team, sourced from a Sanity `teamUnit` document. */
export interface TeamUnitOption {
  id: string
  name: string
  key?: string
  order?: number
}

/** Used only when Sanity cannot be reached, so forms never render empty. */
export const FALLBACK_TEAM_UNIT_OPTIONS: TeamUnitOption[] = FELLOWSHIP_TEAMS.map((name) => ({
  id: `fallback-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name,
}))

export const SERVICE_TYPES = [
  'Team Meeting',
  'Sunday Service',
  'Wednesday Bible Study',
  'Academic Service',
  'Exco Meeting',
  'Special Programme',
] as const

export const GENERAL_SERVICE_TYPES = [
  'Sunday Service',
  'Wednesday Bible Study',
  'Academic Service',
  'Special Programme',
] as const

export type ServiceType = (typeof SERVICE_TYPES)[number]
export type GeneralServiceType = (typeof GENERAL_SERVICE_TYPES)[number]
