/**
 * Canonical fellowship teams and service meeting types.
 * Source: ECCF Teams.md
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

export const SERVICE_TYPES = [
  'Team Meeting',
  'Sunday Service',
  'Wednesday Bible Study',
  'Exco Meeting',
  'Special Programme',
] as const

export type ServiceType = (typeof SERVICE_TYPES)[number]
