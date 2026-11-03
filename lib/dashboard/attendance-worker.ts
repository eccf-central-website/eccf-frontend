/**
 * Attendance worker view model and leader-label helper — shared between server
 * data fetching and client roster rendering. No server-only imports.
 */

import type { WorkerRole } from '@/types'

export interface AttendanceWorker {
  _id: string
  fullName: string
  team: string
  teams?: string[]
  hall: string
  role?: WorkerRole
  positions?: Array<{ kind?: string; rank?: string; status?: string; teamName?: string }>
  leadingTeam?: string
  verificationStatus?: string
  status?: string
}

/**
 * Determine if a worker holds a leadership position worth highlighting on the
 * attendance roster. Returns a short label like "Team Lead", "Assistant Lead",
 * or "Hall Pastor", or null when the worker is not a leader.
 */
export function workerLeaderLabel(w: AttendanceWorker): string | null {
  if (w.role === 'team_lead' || w.role === 'hall_rep') {
    return w.role === 'hall_rep' ? 'Hall Pastor' : 'Team Lead'
  }

  // Check structured positions for approved leadership roles
  if (Array.isArray(w.positions)) {
    const lead = w.positions.find(
      (p) => p.status === 'approved' && p.kind === 'team' && (p.rank === 'lead' || p.rank === 'assistant')
    )
    if (lead) {
      return lead.rank === 'assistant' ? 'Assistant Lead' : 'Team Lead'
    }
    const hall = w.positions.find((p) => p.status === 'approved' && p.kind === 'hall')
    if (hall) return 'Hall Pastor'
  }

  // Legacy flag
  if (w.leadingTeam) return 'Team Lead'
  return null
}
