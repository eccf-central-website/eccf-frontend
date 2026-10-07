/**
 * Dashboard shell constants shared by the server layout (reader) and the
 * client sidebar (writer). Pure data, safe to import anywhere.
 */

/** Persists the lg+ sidebar state so the server renders the right width on first paint. */
export const SIDEBAR_COOKIE = 'eccf-dash-sidebar'

export type SidebarState = 'expanded' | 'collapsed'

export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Dev mock-data states (see lib/dashboard/data). Listed here, not imported
 * from data/, so the client switcher can render them without touching a
 * server-only module.
 */
export const DEV_MOCK_STATES = ['normal', 'empty', 'error', 'slow'] as const

export type DevMockState = (typeof DEV_MOCK_STATES)[number]

export function isDevMockState(value: unknown): value is DevMockState {
  return typeof value === 'string' && (DEV_MOCK_STATES as readonly string[]).includes(value)
}
