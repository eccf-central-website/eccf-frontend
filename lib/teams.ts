import 'server-only'

import { cache } from 'react'
import { sanityClient } from '@/lib/sanity'
import {
  FALLBACK_TEAM_UNIT_OPTIONS,
  type TeamUnitOption,
} from '@/lib/dashboard/attendance-constants'

/**
 * Canonical list of selectable teams, read from Sanity `teamUnit` documents.
 *
 * Creating, renaming, or reordering a team in Sanity updates every picker that
 * receives this list (registration, attendance rosters, worker directory and
 * email audiences). Drafts are ignored; only published teams are returned.
 *
 * Falls back to the static list when Sanity is unreachable so forms and
 * dashboards never render empty.
 */
export const getTeamUnitOptions = cache(async (): Promise<TeamUnitOption[]> => {
  try {
    const rows = await sanityClient.fetch<TeamUnitOption[]>(
      `*[_type == "teamUnit" && defined(name) && name != ""]
        | order(coalesce(order, 999) asc, name asc) {
          "id": _id,
          name,
          "key": key,
          "order": order
        }`
    )

    const seen = new Set<string>()
    const options = rows.filter((row) => {
      const dedupeKey = (row.key || row.name).trim().toLowerCase()
      if (!dedupeKey || seen.has(dedupeKey)) return false
      seen.add(dedupeKey)
      return true
    })

    return options.length > 0 ? options : FALLBACK_TEAM_UNIT_OPTIONS
  } catch (error) {
    console.error('[getTeamUnitOptions] Sanity lookup failed; using fallback list:', error)
    return FALLBACK_TEAM_UNIT_OPTIONS
  }
})

/** Convenience helper for callers that only need the display names. */
export async function getTeamUnitNames(): Promise<string[]> {
  const options = await getTeamUnitOptions()
  return options.map((option) => option.name)
}
