import 'server-only'

import { cache } from 'react'
import { sanityClient } from '@/lib/sanity'

export interface HallOption {
  id: string
  name: string
  slug?: string
  gender?: 'male' | 'female' | 'mixed' | 'general' | string
  order?: number
  description?: string
  isActive?: boolean
}

export const FALLBACK_HALLS: string[] = [
  'Hall 1',
  'Hall 2',
  'Hall 3',
  'Hall 4',
  'Hall 5',
  'Hall 6',
  'Hall 7',
  'Hall 8',
]

/**
 * Canonical list of Halls of Residence, read dynamically from Sanity `hallResidence` documents.
 *
 * Adding, editing, renaming, or reordering halls in Sanity automatically reflects across
 * all intake forms (/connect, /register), leadership designations, and dashboard filters.
 *
 * Falls back to canonical baseline (Hall 1 through Hall 8) if Sanity is unreachable.
 */
export const getHallOptions = cache(async (): Promise<HallOption[]> => {
  try {
    const rows = await sanityClient.fetch<
      Array<{
        _id: string
        name: string
        slug?: string
        gender?: string
        order?: number
        description?: string
        isActive?: boolean
      }>
    >(
      `*[_type == "hallResidence" && defined(name) && name != "" && coalesce(isActive, true) == true]
        | order(coalesce(order, 999) asc, name asc) {
          _id,
          name,
          "slug": coalesce(slug.current, _id),
          gender,
          order,
          description,
          isActive
        }`
    )

    if (!rows || rows.length === 0) {
      return FALLBACK_HALLS.map((name, index) => ({
        id: `hall-${index + 1}`,
        name,
        slug: `hall-${index + 1}`,
        order: index + 1,
      }))
    }

    // Deduplicate by name
    const seen = new Set<string>()
    const options: HallOption[] = []
    for (const r of rows) {
      const key = r.name.trim().toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        options.push({
          id: r._id,
          name: r.name.trim(),
          slug: r.slug,
          gender: r.gender,
          order: r.order,
          description: r.description,
          isActive: r.isActive !== false,
        })
      }
    }

    return options.length > 0
      ? options
      : FALLBACK_HALLS.map((name, index) => ({
          id: `hall-${index + 1}`,
          name,
          slug: `hall-${index + 1}`,
          order: index + 1,
        }))
  } catch (error) {
    console.error('[getHallOptions] Sanity lookup failed; using fallback list:', error)
    return FALLBACK_HALLS.map((name, index) => ({
      id: `hall-${index + 1}`,
      name,
      slug: `hall-${index + 1}`,
      order: index + 1,
    }))
  }
})

/** Convenience helper for callers that only need the display names (e.g. dropdown options). */
export async function getHallNames(): Promise<string[]> {
  const options = await getHallOptions()
  return options.map((option) => option.name)
}
