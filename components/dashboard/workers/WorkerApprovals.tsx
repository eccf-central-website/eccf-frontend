'use client'

import * as React from 'react'
import { useId, useMemo, useState } from 'react'
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Home,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react'
import type { WorkerRow, ECCFSession } from '@/types'
import type { WorkerAccess } from '@/lib/dashboard/access'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import { RecordSheet } from '@/components/dashboard/ui/record-sheet'
import { ConfirmDialog } from '@/components/dashboard/ui/confirm-dialog'
import EmptyState from '@/components/dashboard/states/EmptyState'
import {
  formatDate,
  formatRelativeDay,
  formatShortDate,
  toDateTimeAttr,
} from '@/lib/dashboard/format'
import { cn } from '@/lib/utils'

export function getWorkerInitials(name?: string): string {
  if (!name) return 'WK'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'WK'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function getWorkerTeams(worker: {
  team?: string
  teams?: string[]
}): string[] {
  const collected = [
    ...(Array.isArray(worker.teams) ? worker.teams : []),
    worker.team,
  ]
    .filter((t): t is string => Boolean(t && typeof t === 'string'))
    .flatMap((t) => t.split(','))
    .map((t) => t.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  const unique: string[] = []
  for (const item of collected) {
    const key = item.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(item)
    }
  }
  return unique
}

export function isWorkerPending(worker: WorkerRow): boolean {
  if ((worker.verificationStatus || 'verified') === 'pending') return true
  if (
    Array.isArray(worker.memberships) &&
    worker.memberships.some((m) => m.status === 'pending')
  ) {
    return true
  }
  return false
}

export function resolveWorkerStatus(
  worker: WorkerRow
): 'verified' | 'pending' | 'rejected' {
  if (isWorkerPending(worker)) return 'pending'
  if (worker.verificationStatus === 'rejected') return 'rejected'
  return 'verified'
}

export function safeFormatDate(iso?: string): string | null {
  if (!iso) return null
  const trimmed = iso.trim()
  if (!trimmed) return null
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? Date.parse(`${trimmed}T12:00:00Z`)
    : Date.parse(trimmed)
  if (Number.isNaN(parsed)) return null
  try {
    return formatDate(trimmed)
  } catch {
    return null
  }
}

export function safeFormatRelativeDay(iso?: string): string | null {
  if (!iso) return null
  const trimmed = iso.trim()
  if (!trimmed) return null
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? Date.parse(`${trimmed}T12:00:00Z`)
    : Date.parse(trimmed)
  if (Number.isNaN(parsed)) return null
  try {
    return formatRelativeDay(trimmed)
  } catch {
    return null
  }
}

export function formatWorkerBirthday(worker: {
  birthDate?: string
  birthMonth?: number
  birthDay?: number
}): string {
  const { birthDate, birthMonth, birthDay } = worker
  if (birthMonth && birthDay && birthMonth >= 1 && birthMonth <= 12 && birthDay >= 1 && birthDay <= 31) {
    const paddedMonth = String(birthMonth).padStart(2, '0')
    const paddedDay = String(birthDay).padStart(2, '0')
    try {
      return formatShortDate(`2000-${paddedMonth}-${paddedDay}`)
    } catch {
      return `${paddedDay}/${paddedMonth}`
    }
  }

  if (!birthDate) return 'Not set'
  const parts = birthDate.split('-')
  if (parts.length === 3) {
    const m = parseInt(parts[1], 10)
    const d = parseInt(parts[2], 10)
    if (!Number.isNaN(m) && !Number.isNaN(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      try {
        return formatShortDate(
          `2000-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        )
      } catch {
        return birthDate
      }
    }
  } else if (parts.length === 2) {
    const m = parseInt(parts[0], 10)
    const d = parseInt(parts[1], 10)
    if (!Number.isNaN(m) && !Number.isNaN(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      try {
        return formatShortDate(
          `2000-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        )
      } catch {
        return birthDate
      }
    }
  }

  return birthDate
}

export function renderWorkerStatusBadge(
  status: 'verified' | 'pending' | 'rejected'
) {
  switch (status) {
    case 'verified':
      return <StatusBadge variant="success">Verified</StatusBadge>
    case 'pending':
      return <StatusBadge variant="warning">Pending</StatusBadge>
    case 'rejected':
      return <StatusBadge variant="destructive">Declined</StatusBadge>
  }
}

export function WorkerAvatar({
  worker,
  size = 'md',
}: {
  worker: { fullName: string; profileImageUrl?: string }
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass =
    size === 'lg'
      ? 'h-16 w-16 rounded-2xl text-lg'
      : size === 'sm'
        ? 'h-10 w-10 rounded-[var(--radius-control)] text-[13px]'
        : 'h-11 w-11 rounded-[var(--radius-control)] text-[13px]'

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden bg-surface-raised font-sans font-semibold text-foreground',
        sizeClass
      )}
    >
      {worker.profileImageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={worker.profileImageUrl}
          alt={worker.fullName}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{getWorkerInitials(worker.fullName)}</span>
      )}
    </div>
  )
}

export interface WorkerProfileDetailsProps {
  worker: WorkerRow
  extraActions?: React.ReactNode
}

export function WorkerProfileDetails({
  worker,
  extraActions,
}: WorkerProfileDetailsProps) {
  const teams = getWorkerTeams(worker)
  const verifiedDate = safeFormatDate(worker.verifiedAt)
  const registeredDate = safeFormatDate(worker.createdAt)
  const registeredRelative = safeFormatRelativeDay(worker.createdAt)

  return (
    <div className="space-y-4">
      {/* Identity & Photo Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] bg-surface-raised p-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <WorkerAvatar worker={worker} size="lg" />
          <div className="min-w-0 space-y-1">
            {worker.excoPosition && (
              <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent-foreground dark:text-primary">
                <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{worker.excoPosition}</span>
              </p>
            )}
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Home className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{worker.hall || 'No hall assigned'}</span>
            </p>
            {registeredDate && worker.createdAt && (
              <p className="text-[13px] text-muted-foreground">
                Registered{' '}
                <time dateTime={toDateTimeAttr(worker.createdAt)}>
                  {registeredDate}
                </time>
                {registeredRelative ? ` (${registeredRelative})` : ''}
              </p>
            )}
          </div>
        </div>

        {worker.profileImageUrl && (
          <a
            href={worker.profileImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 md:min-h-10 items-center gap-1.5 rounded-[var(--radius-control)] bg-card px-3.5 text-[13px] font-semibold text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>Open Photo</span>
          </a>
        )}
      </div>

      {/* Key Facts */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius-control)] bg-surface-raised p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>Birthday</span>
          </div>
          <p className="font-sans text-base font-semibold text-foreground">
            {formatWorkerBirthday(worker)}
          </p>
          <p className="text-[13px] text-muted-foreground">
            Media flyer &amp; welfare care
          </p>
        </div>

        <div className="rounded-[var(--radius-control)] bg-surface-raised p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Briefcase className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>Primary Assignment</span>
          </div>
          <p className="font-sans text-base font-semibold text-foreground truncate">
            {worker.leadingTeam
              ? `${worker.leadingTeam} (Lead)`
              : worker.team || 'Unassigned'}
          </p>
          <p className="text-[13px] text-muted-foreground">
            Operational roster unit
          </p>
        </div>
      </div>

      {/* Membership Requests & Operational Teams */}
      <div className="rounded-[var(--radius-control)] bg-surface-raised p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Operational Teams &amp; Membership Status
        </p>

        {Array.isArray(worker.memberships) && worker.memberships.length > 0 ? (
          <ul className="space-y-2">
            {worker.memberships.map((membership, idx) => {
              const teamLabel =
                membership.teamName ||
                (typeof membership.team === 'object' && membership.team !== null
                  ? membership.team.name
                  : typeof membership.team === 'string'
                    ? membership.team
                    : undefined) ||
                membership.teamKey ||
                'Operational Team'
              const mStatus = membership.status || 'verified'
              return (
                <li
                  key={membership._key ?? `${teamLabel}-${idx}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card px-3.5 py-2.5 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {teamLabel}
                    </p>
                    {membership.decidedBy && (
                      <p className="text-[13px] text-muted-foreground">
                        Reviewed by {membership.decidedBy}
                      </p>
                    )}
                  </div>
                  {renderWorkerStatusBadge(mStatus)}
                </li>
              )
            })}
          </ul>
        ) : teams.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-[var(--radius-pill)] bg-card px-3 py-1 text-[13px] font-medium text-foreground shadow-sm"
              >
                {t}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">
            No operational teams recorded yet.
          </p>
        )}
      </div>

      {/* Verification Record */}
      {(worker.verifiedBy || verifiedDate) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] bg-surface-raised px-4 py-3 text-[13px]">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck
              className="h-4 w-4 shrink-0 text-success"
              aria-hidden="true"
            />
            <span className="truncate text-muted-foreground">
              Verified by{' '}
              <strong className="text-foreground">
                {worker.verifiedBy || 'Executive Desk'}
              </strong>
            </span>
          </div>
          {verifiedDate && worker.verifiedAt && (
            <time
              dateTime={toDateTimeAttr(worker.verifiedAt)}
              className="shrink-0 font-sans tabular-nums text-muted-foreground"
            >
              {verifiedDate}
            </time>
          )}
        </div>
      )}

      {extraActions}

      {/* Audit Trail */}
      {worker.updateLog && worker.updateLog.length > 0 && (
        <div className="rounded-[var(--radius-control)] bg-surface-raised p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Audit Trail &amp; Activity Log
          </p>
          <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {worker.updateLog.map((log, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-[13px] text-muted-foreground leading-relaxed"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                />
                <span>{log}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export interface VerifyDecisionState {
  worker: WorkerRow
  decision: 'approve' | 'reject'
}

export interface WorkerVerifyConfirmDialogProps {
  pendingDecision: VerifyDecisionState | null
  onOpenChange: (open: boolean) => void
  loading: boolean
  onConfirm: (
    worker: WorkerRow,
    decision: 'approve' | 'reject',
    reason?: string
  ) => Promise<boolean>
}

export function WorkerVerifyConfirmDialog({
  pendingDecision,
  onOpenChange,
  loading,
  onConfirm,
}: WorkerVerifyConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const reasonId = useId()

  const worker = pendingDecision?.worker ?? null
  const decision = pendingDecision?.decision ?? 'approve'
  const teamsList = worker ? getWorkerTeams(worker).join(', ') || 'their requested team' : ''
  const isApprove = decision === 'approve'

  async function handleConfirm() {
    if (!worker) return
    const ok = await onConfirm(
      worker,
      decision,
      !isApprove && reason.trim() ? reason.trim() : undefined
    )
    if (ok) {
      setReason('')
      onOpenChange(false)
    }
  }

  return (
    <ConfirmDialog
      open={Boolean(pendingDecision)}
      onOpenChange={(next) => {
        if (!next) setReason('')
        onOpenChange(next)
      }}
      tone={isApprove ? 'primary' : 'destructive'}
      title={
        worker
          ? isApprove
            ? `Approve ${worker.fullName}?`
            : `Decline ${worker.fullName}?`
          : 'Confirm verification'
      }
      description={
        worker
          ? isApprove
            ? `Verify ${worker.fullName} as an active member for ${teamsList}.`
            : `Decline the pending membership request for ${worker.fullName} (${teamsList}).`
          : undefined
      }
      effectSummary={
        worker
          ? isApprove
            ? `Approving marks ${worker.fullName} as Verified, adds them to active attendance rosters for ${teamsList}, and sends their fellowship welcome email if not yet dispatched.`
            : `Declining sets ${worker.fullName}'s pending membership for ${teamsList} to Declined and keeps them off active service attendance rosters.`
          : undefined
      }
      confirmLabel={isApprove ? 'Approve Worker' : 'Decline Request'}
      loadingLabel={isApprove ? 'Approving…' : 'Declining…'}
      loading={loading}
      onConfirm={handleConfirm}
    >
      {!isApprove && worker && (
        <div className="space-y-1.5">
          <Label
            htmlFor={reasonId}
            className="text-[13px] font-semibold text-foreground"
          >
            Reason for declining (optional)
          </Label>
          <Input
            id={reasonId}
            type="text"
            placeholder="e.g. Duplicate registration or wrong team selected"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            className="min-h-11 md:min-h-10 text-sm"
          />
        </div>
      )}
    </ConfirmDialog>
  )
}

export interface WorkerApprovalsProps {
  pendingWorkers: WorkerRow[]
  canApprove: boolean
  processingId: string | null
  onVerify: (
    worker: WorkerRow,
    decision: 'approve' | 'reject',
    reason?: string
  ) => Promise<boolean>
  session: ECCFSession & { access?: WorkerAccess }
  onSwitchToDirectory?: () => void
}

export default function WorkerApprovals({
  pendingWorkers,
  canApprove,
  processingId,
  onVerify,
  session,
  onSwitchToDirectory,
}: WorkerApprovalsProps) {
  const [reviewWorkerId, setReviewWorkerId] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<VerifyDecisionState | null>(null)

  const reviewWorker = useMemo(
    () => pendingWorkers.find((w) => w._id === reviewWorkerId) ?? null,
    [pendingWorkers, reviewWorkerId]
  )

  const isTeamLead = session.role === 'team_lead' && !session.access?.isCSGB
  const isHallRep = session.role === 'hall_rep'

  if (pendingWorkers.length === 0) {
    return (
      <EmptyState
        variant="nothing-yet"
        icon={<CheckCircle2 />}
        title="No pending approvals"
        description="Every worker registration and membership request in your scope has been reviewed."
        action={
          onSwitchToDirectory ? (
            <Button
              type="button"
              variant="outline"
              onClick={onSwitchToDirectory}
              className="min-h-11 md:min-h-10"
            >
              View Directory
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Calm Queue Guidance Header */}
      <div className="flex flex-col gap-2 rounded-[var(--radius-card)] bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-sans text-base font-semibold text-foreground">
              {isTeamLead
                ? `Membership Requests for ${session.leadingTeam || session.team}`
                : isHallRep
                  ? `Pending Registrations in ${session.hall || 'Your Hall'}`
                  : 'Pending Workforce Verifications'}
            </h2>
            <StatusBadge variant="warning">
              <span className="tabular-nums">
                {pendingWorkers.length} awaiting review
              </span>
            </StatusBadge>
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
            {canApprove
              ? 'Open each candidate to review their requested hall and operational team before approving or declining.'
              : 'Review details of pending worker registrations in your scope. Verification decisions are made by Team Leads or CSGB Executives.'}
          </p>
        </div>
      </div>

      {/* Candidate List */}
      <ul className="divide-y divide-border/50 overflow-hidden rounded-[var(--radius-card)] bg-card shadow-sm">
        {pendingWorkers.map((worker) => {
          const submittedIso = worker.createdAt || worker.updatedAt
          const submittedAge = safeFormatRelativeDay(submittedIso)
          const pendingTeams = Array.isArray(worker.memberships)
            ? worker.memberships
                .filter((m) => m.status === 'pending')
                .map((m) => m.teamName || m.teamKey)
                .filter(Boolean)
            : []
          const teamsLabel =
            pendingTeams.length > 0
              ? pendingTeams.join(', ')
              : getWorkerTeams(worker).join(', ') || 'Unassigned'

          return (
            <li
              key={worker._id}
              className="flex flex-col justify-between gap-3.5 p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="flex min-w-0 items-start gap-3.5">
                <WorkerAvatar worker={worker} size="md" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sans text-base font-semibold text-foreground">
                      {worker.fullName}
                    </span>
                    <StatusBadge variant="warning">Pending</StatusBadge>
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {worker.hall || 'No hall'}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>{teamsLabel}</span>
                  </p>
                  {submittedAge && submittedIso && (
                    <p className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        Submitted{' '}
                        <time dateTime={toDateTimeAttr(submittedIso)}>
                          {submittedAge}
                        </time>
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end">
                <Button
                  type="button"
                  onClick={() => setReviewWorkerId(worker._id)}
                  aria-label={`Review ${worker.fullName}`}
                  className="min-h-11 md:min-h-10 w-full sm:w-auto px-5 font-semibold"
                >
                  Review
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Candidate Review Drawer */}
      <RecordSheet
        open={Boolean(reviewWorker)}
        onOpenChange={(open) => {
          if (!open) setReviewWorkerId(null)
        }}
        headerExtra={
          reviewWorker ? (
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant="warning">Pending Review</StatusBadge>
              {reviewWorker.requestedRole && (
                <StatusBadge variant="primary" dot>
                  Requested role: {reviewWorker.requestedRole.replace('_', ' ')}
                </StatusBadge>
              )}
            </div>
          ) : undefined
        }
        title={reviewWorker?.fullName ?? 'Candidate review'}
        description={
          reviewWorker
            ? `${reviewWorker.hall || 'No hall assigned'} · ${reviewWorker.email || 'No email on record'}`
            : undefined
        }
        footer={
          reviewWorker ? (
            canApprove ? (
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setReviewWorkerId(null)}
                  className="min-h-11 md:min-h-10"
                >
                  Close
                </Button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={processingId === reviewWorker._id}
                    onClick={() =>
                      setConfirmState({
                        worker: reviewWorker,
                        decision: 'reject',
                      })
                    }
                    className="min-h-11 md:min-h-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <UserX className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Decline</span>
                  </Button>
                  <Button
                    type="button"
                    disabled={processingId === reviewWorker._id}
                    onClick={() =>
                      setConfirmState({
                        worker: reviewWorker,
                        decision: 'approve',
                      })
                    }
                    className="min-h-11 md:min-h-10"
                  >
                    <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Approve</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-muted-foreground">
                  Team Leads or CSGB Executives handle verification decisions.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewWorkerId(null)}
                  className="min-h-11 md:min-h-10 shrink-0"
                >
                  Close
                </Button>
              </div>
            )
          ) : undefined
        }
      >
        {reviewWorker && <WorkerProfileDetails worker={reviewWorker} />}
      </RecordSheet>

      {/* Approve / Decline Confirmation Dialog */}
      <WorkerVerifyConfirmDialog
        pendingDecision={confirmState}
        onOpenChange={(open) => {
          if (!open) setConfirmState(null)
        }}
        loading={
          Boolean(confirmState) &&
          processingId === confirmState?.worker._id
        }
        onConfirm={async (worker, decision, reason) => {
          const ok = await onVerify(worker, decision, reason)
          if (ok) {
            setReviewWorkerId(null)
          }
          return ok
        }}
      />
    </div>
  )
}
