import 'server-only'

import { cache } from 'react'
import { sanityClient } from '@/lib/sanity'

export interface CSGBRoleOption {
  id: string
  title: string
  shortTitle?: string
  key: string
  order?: number
  isExecutiveShepherd?: boolean
  canApproveExecutives?: boolean
  description?: string
  isActive?: boolean
}

export const FALLBACK_CSGB_ROLES: CSGBRoleOption[] = [
  {
    id: 'csgb-role-president',
    title: 'President & Executive Shepherd',
    shortTitle: 'President',
    key: 'president',
    order: 1,
    isExecutiveShepherd: true,
    canApproveExecutives: true,
  },
  {
    id: 'csgb-role-vp-admin',
    title: "Vice President - Admin / Brothers' Coordinator",
    shortTitle: 'VP Admin',
    key: 'vp-admin',
    order: 2,
  },
  {
    id: 'csgb-role-vp-evangelism',
    title: "Vice President - Evangelism / Sisters' Coordinator",
    shortTitle: 'VP Evangelism',
    key: 'vp-evangelism',
    order: 3,
  },
  {
    id: 'csgb-role-general-secretary',
    title: 'General Secretary',
    shortTitle: 'Gen Sec',
    key: 'general-secretary',
    order: 4,
  },
  {
    id: 'csgb-role-prayer-coordinator',
    title: 'Prayer Coordinator',
    shortTitle: 'Prayer Coord',
    key: 'prayer-coordinator',
    order: 5,
  },
]

/**
 * Canonical list of CSGB Roles, read dynamically from Sanity `csgbRole` documents.
 *
 * Adding, editing, or reordering a role in Sanity automatically reflects across
 * all selection dropdowns, access checks, and leadership projections.
 *
 * Falls back to canonical baseline if Sanity is unreachable.
 */
export const getCSGBRoleOptions = cache(async (): Promise<CSGBRoleOption[]> => {
  try {
    const rows = await sanityClient.fetch<
      Array<{
        _id: string
        title: string
        shortTitle?: string
        key?: string
        order?: number
        isExecutiveShepherd?: boolean
        canApproveExecutives?: boolean
        description?: string
        isActive?: boolean
      }>
    >(
      `*[_type == "csgbRole" && defined(title) && title != "" && coalesce(isActive, true) == true]
        | order(coalesce(order, 999) asc, title asc) {
          _id,
          title,
          shortTitle,
          "key": coalesce(slug.current, key, _id),
          order,
          isExecutiveShepherd,
          canApproveExecutives,
          description,
          isActive
        }`
    )

    if (!rows || rows.length === 0) return FALLBACK_CSGB_ROLES

    return rows.map((r) => ({
      id: r._id,
      title: r.title,
      shortTitle: r.shortTitle || r.title,
      key: r.key || r._id,
      order: r.order,
      isExecutiveShepherd: Boolean(r.isExecutiveShepherd),
      canApproveExecutives: Boolean(r.canApproveExecutives),
      description: r.description,
      isActive: r.isActive !== false,
    }))
  } catch (error) {
    console.error('[getCSGBRoleOptions] Sanity lookup failed; using fallback list:', error)
    return FALLBACK_CSGB_ROLES
  }
})
