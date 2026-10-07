/**
 * Dashboard shell constants shared by the server layout (reader) and the
 * client sidebar (writer). Pure data, safe to import anywhere.
 */

/** Persists the lg+ sidebar state so the server renders the right width on first paint. */
export const SIDEBAR_COOKIE = 'eccf-dash-sidebar'

export type SidebarState = 'expanded' | 'collapsed'

export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
