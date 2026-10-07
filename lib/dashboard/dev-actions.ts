/**
 * Dev-only Server Actions behind the top-bar role / mock-data switcher.
 *
 * Each action refuses unless isMockAuthEnabled() — which is always false
 * in production — so calling the action endpoint directly does nothing
 * there. Inputs are re-validated server-side; the client is never trusted.
 */

'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { DEV_ROLE_COOKIE, isMockAuthEnabled } from './auth'
import { DEV_MOCK_STATE_COOKIE } from './data'
import { isWorkerRole, SECTION_PATHS } from './rbac'
import { isDevMockState } from './shell'
import type { ActionResult } from './action-result'

const NOT_AVAILABLE = 'Dev tools are not available in this environment.'

const DEV_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
} as const

export async function setDevRole(role: unknown): Promise<ActionResult> {
  if (!isMockAuthEnabled()) return { ok: false, error: NOT_AVAILABLE }
  if (!isWorkerRole(role)) return { ok: false, error: 'Unknown role.' }

  cookies().set(DEV_ROLE_COOKIE, role, DEV_COOKIE_OPTIONS)
  revalidatePath(SECTION_PATHS.overview, 'layout')
  return { ok: true, data: undefined }
}

export async function setDevMockState(state: unknown): Promise<ActionResult> {
  if (!isMockAuthEnabled()) return { ok: false, error: NOT_AVAILABLE }
  if (!isDevMockState(state)) return { ok: false, error: 'Unknown mock state.' }

  if (state === 'normal') cookies().delete(DEV_MOCK_STATE_COOKIE)
  else cookies().set(DEV_MOCK_STATE_COOKIE, state, DEV_COOKIE_OPTIONS)
  revalidatePath(SECTION_PATHS.overview, 'layout')
  return { ok: true, data: undefined }
}
