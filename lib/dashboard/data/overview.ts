/**
 * Overview data — SERVER-SIDE ONLY. Composes the list functions in ./index
 * into the small, browser-safe shapes the overview's recent-activity lists
 * render. Kept apart from ./index so the overview adds no edits there.
 *
 * Each function re-checks the role's section access (the page also gates
 * on it) and returns null when the role can't see that feed. Only the
 * fields the list shows are kept: no phone/room numbers (already stripped)
 * and no welfare requestDetails, which is personal free text that belongs
 * on the welfare page, not the landing page.
 */

import 'server-only'

import type { ECCFSession, SafeFirstTimer, SafeWelfareRequest } from '@/types'
import { canAccessSection } from '../rbac'
import { listFirstTimers, listWelfare } from './index'

export const RECENT_LIMIT = 5

export type RecentFirstTimer = Pick<SafeFirstTimer, '_id' | 'fullName' | 'hall' | 'department' | 'level' | 'dateVisited'>

export type RecentWelfareRequest = Pick<SafeWelfareRequest, '_id' | 'name' | 'status' | 'dateSubmitted'>

/** Latest first-timers, newest first; null when the role can't open the feed. */
export async function getRecentFirstTimers(session: ECCFSession): Promise<RecentFirstTimer[] | null> {
  if (!canAccessSection(session.role, 'firstTimers')) return null
  const rows = await listFirstTimers()
  return rows
    .slice(0, RECENT_LIMIT)
    .map(({ _id, fullName, hall, department, level, dateVisited }) => ({ _id, fullName, hall, department, level, dateVisited }))
}

/** Latest welfare requests, newest first; null when the role can't open the feed. */
export async function getRecentWelfare(session: ECCFSession): Promise<RecentWelfareRequest[] | null> {
  if (!canAccessSection(session.role, 'welfare')) return null
  const rows = await listWelfare()
  return rows.slice(0, RECENT_LIMIT).map(({ _id, name, status, dateSubmitted }) => ({ _id, name, status, dateSubmitted }))
}
