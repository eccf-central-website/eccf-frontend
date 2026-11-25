'use client'

import * as React from 'react'
import { useId, useMemo, useState } from 'react'
import {
  Building,
  Eye,
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react'
import type { WorkerRow, ECCFSession } from '@/types'
import type { WorkerAccess } from '@/lib/dashboard/access'
import type { TeamUnitOption } from '@/lib/dashboard/attendance-constants'
import { isMediaTeam } from '@/lib/dashboard/rbac'
import { deleteApprovedWorkerAction } from '@/app/actions/worker-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'
import { formatCount, toDateTimeAttr } from '@/lib/dashboard/format'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import {
  DataToolbar,
  type ActiveFilterChip,
} from '@/components/dashboard/ui/data-toolbar'
import { RecordSheet } from '@/components/dashboard/ui/record-sheet'
import { ConfirmDialog } from '@/components/dashboard/ui/confirm-dialog'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import EmptyState from '@/components/dashboard/states/EmptyState'
import { cn } from '@/lib/utils'
import {
  formatWorkerBirthday,
  getWorkerTeams,
  isWorkerPending,
  renderWorkerStatusBadge,
  resolveWorkerStatus,
  safeFormatDate,
  WorkerAvatar,
  WorkerProfileDetails,
  WorkerVerifyConfirmDialog,
  type VerifyDecisionState,
} from './WorkerApprovals'

export type WorkerStatusFilter = 'all' | 'pending' | 'verified' | 'rejected'

function normalizeTeam(t?: string | null): string {
  if (!t) return ''
  return t
    .toLowerCase()
    .trim()
    .replace(/(?:\s+team)+$/i, '')
    .trim()
}

export function matchesWorkerTeam(
  worker: { team?: string; teams?: string[] },
  targetTeamOrTeams: string | string[] | null | undefined
): boolean {
  if (!targetTeamOrTeams || targetTeamOrTeams === 'all') return true
  const targets = (
    Array.isArray(targetTeamOrTeams) ? targetTeamOrTeams : [targetTeamOrTeams]
  )
    .flatMap((t) => (t ? t.split(',') : []))
    .map(normalizeTeam)
    .filter(Boolean)

  if (targets.length === 0) return true

  const workerTeams = [worker.team, ...(worker.teams || [])]
    .filter((t): t is string => Boolean(t && typeof t === 'string'))
    .flatMap((t) => (t ? t.split(',') : []))
    .map(normalizeTeam)
    .filter(Boolean)

  return workerTeams.some((wt) =>
    targets.some((tgt) => wt === tgt || wt.includes(tgt) || tgt.includes(wt))
  )
}

export interface WorkersDirectoryProps {
  scopedWorkers: WorkerRow[]
  session: ECCFSession & { access?: WorkerAccess }
  teamOptions: TeamUnitOption[]
  hallOptions: string[]
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: WorkerStatusFilter
  onStatusFilterChange: (value: WorkerStatusFilter) => void
  teamFilter: string
  onTeamFilterChange: (value: string) => void
  hallFilter: string
  onHallFilterChange: (value: string) => void
  onResetFilters: () => void
  canApprove: boolean
  canDelete: boolean
  processingId: string | null
  onVerify: (
    worker: WorkerRow,
    decision: 'approve' | 'reject',
    reason?: string
  ) => Promise<boolean>
  onOpenEmail: (worker: WorkerRow) => void
  onToggleExco: (worker: WorkerRow, approved: boolean) => Promise<boolean>
  onOffboardSuccess: (workerId: string, policy: 'archive' | 'permanent') => void
}

const STATUS_LABELS: Record<WorkerStatusFilter, string> = {
  all: 'All statuses',
  verified: 'Verified',
  pending: 'Pending',
  rejected: 'Declined',
}

export default function WorkersDirectory({
  scopedWorkers,
  session,
  teamOptions,
  hallOptions,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  teamFilter,
  onTeamFilterChange,
  hallFilter,
  onHallFilterChange,
  onResetFilters,
  canApprove,
  canDelete,
  processingId,
  onVerify,
  onOpenEmail,
  onToggleExco,
  onOffboardSuccess,
}: WorkersDirectoryProps) {
  const idPrefix = useId()
  const [activeWorkerId, setActiveWorkerId] = useState<string | null>(null)
  const [verifyDecision, setVerifyDecision] =
    useState<VerifyDecisionState | null>(null)

  // Offboarding dialog state
  const [workerToDelete, setWorkerToDelete] = useState<WorkerRow | null>(null)
  const [confirmDeleteName, setConfirmDeleteName] = useState('')
  const [deletePolicy, setDeletePolicy] = useState<'archive' | 'permanent'>(
    'archive'
  )
  const [deleteReason, setDeleteReason] = useState(
    'Left the team / fellowship'
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const access = session.access
  const isPresident = Boolean(access?.isPresident)
  const isAdmin = session.role === 'admin'
  const isHallRep = session.role === 'hall_rep'
  const isMedia = isMediaTeam(session)
  const leadsTeamIds = access?.leadsTeamIds || []
  const leadsTeamKeys = access?.leadsTeamKeys || []
  const isLeadOrAssistant =
    leadsTeamIds.length > 0 ||
    leadsTeamKeys.length > 0 ||
    session.role === 'team_lead'

  const showTeamSelect = isPresident || isAdmin || isMedia

  // Merge configured options with any halls/teams present on live/mock records
  const availableHalls = useMemo(() => {
    const seen = new Set<string>()
    const merged: string[] = []
    const addHall = (h?: string) => {
      const trimmed = h?.trim()
      if (!trimmed) return
      const key = trimmed.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(trimmed)
      }
    }
    hallOptions.forEach(addHall)
    scopedWorkers.forEach((w) => addHall(w.hall))
    return merged
  }, [hallOptions, scopedWorkers])

  const availableTeams = useMemo(() => {
    const seen = new Set<string>()
    const merged: string[] = []
    const addTeam = (t?: string) => {
      const trimmed = t?.trim()
      if (!trimmed) return
      const key = trimmed.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(trimmed)
      }
    }
    teamOptions.forEach((opt) => addTeam(opt.name))
    scopedWorkers.forEach((w) => {
      getWorkerTeams(w).forEach(addTeam)
    })
    return merged
  }, [teamOptions, scopedWorkers])

  // Counts for status dropdown
  const statusCounts = useMemo(() => {
    let verified = 0
    let pending = 0
    let rejected = 0
    for (const w of scopedWorkers) {
      const st = resolveWorkerStatus(w)
      if (st === 'pending') pending++
      else if (st === 'rejected') rejected++
      else verified++
    }
    return {
      all: scopedWorkers.length,
      verified,
      pending,
      rejected,
    }
  }, [scopedWorkers])

  const filteredRows = useMemo(() => {
    return scopedWorkers.filter((row) => {
      if (statusFilter !== 'all') {
        const rowStatus = resolveWorkerStatus(row)
        if (rowStatus !== statusFilter) return false
      }

      if (teamFilter !== 'all' && !matchesWorkerTeam(row, teamFilter)) {
        return false
      }

      if (hallFilter !== 'all' && row.hall !== hallFilter) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = row.fullName.toLowerCase().includes(q)
        const matchHall = (row.hall || '').toLowerCase().includes(q)
        const matchTeam = (row.team || '').toLowerCase().includes(q)
        const matchSecondary = row.teams?.some((t) =>
          Boolean(t && typeof t === 'string' && t.toLowerCase().includes(q))
        )
        const matchExco = (row.excoPosition || '').toLowerCase().includes(q)
        if (!matchName && !matchHall && !matchTeam && !matchSecondary && !matchExco) {
          return false
        }
      }

      return true
    })
  }, [scopedWorkers, statusFilter, teamFilter, hallFilter, searchQuery])

  const activeWorkerDetail = useMemo(
    () => scopedWorkers.find((w) => w._id === activeWorkerId) ?? null,
    [scopedWorkers, activeWorkerId]
  )

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = []
    if (searchQuery.trim()) {
      chips.push({
        id: 'search',
        label: 'Search',
        value: searchQuery.trim(),
        onRemove: () => onSearchChange(''),
      })
    }
    if (!isHallRep && hallFilter !== 'all') {
      chips.push({
        id: 'hall',
        label: 'Hall',
        value: hallFilter,
        onRemove: () => onHallFilterChange('all'),
      })
    }
    if (showTeamSelect && teamFilter !== 'all') {
      chips.push({
        id: 'team',
        label: 'Team',
        value: teamFilter,
        onRemove: () => onTeamFilterChange('all'),
      })
    }
    if (statusFilter !== 'all') {
      chips.push({
        id: 'status',
        label: 'Status',
        value: STATUS_LABELS[statusFilter],
        onRemove: () => onStatusFilterChange('all'),
      })
    }
    return chips
  }, [
    searchQuery,
    onSearchChange,
    isHallRep,
    hallFilter,
    onHallFilterChange,
    showTeamSelect,
    teamFilter,
    onTeamFilterChange,
    statusFilter,
    onStatusFilterChange,
  ])

  const mobileSheetFilterCount =
    (!isHallRep && hallFilter !== 'all' ? 1 : 0) +
    (showTeamSelect && teamFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0)

  function openOffboardDialog(worker: WorkerRow) {
    setWorkerToDelete(worker)
    setConfirmDeleteName('')
    setDeletePolicy('archive')
    setDeleteReason('Left the team / fellowship')
  }

  async function handleDeleteWorker() {
    if (!workerToDelete) return
    if (
      confirmDeleteName.trim().toLowerCase() !==
      workerToDelete.fullName.trim().toLowerCase()
    ) {
      toastError('Please type the exact worker name to confirm deletion.')
      return
    }

    setIsDeleting(true)
    try {
      const res = await deleteApprovedWorkerAction({
        workerId: workerToDelete._id,
        confirmedName: confirmDeleteName,
        policy: deletePolicy,
        reason: deleteReason.trim() || 'Worker left the fellowship team',
      })

      if (res.ok) {
        const deletedName = workerToDelete.fullName
        const deletedId = workerToDelete._id
        const policyUsed = deletePolicy
        if (activeWorkerId === deletedId && policyUsed === 'permanent') {
          setActiveWorkerId(null)
        }
        setWorkerToDelete(null)
        setConfirmDeleteName('')
        setDeleteReason('Left the team / fellowship')
        onOffboardSuccess(deletedId, policyUsed)
        toastSuccess(
          policyUsed === 'permanent'
            ? `${deletedName} has been permanently deleted.`
            : `${deletedName} has been archived and offboarded.`
        )
      } else {
        toastError(res.error || 'Failed to delete worker profile.')
      }
    } catch {
      toastError('An unexpected network error occurred while deleting worker.')
    } finally {
      setIsDeleting(false)
    }
  }

  function renderFilterControls(mode: 'desktop' | 'mobile') {
    const isMobile = mode === 'mobile'
    const hallId = `${idPrefix}-${mode}-hall`
    const teamId = `${idPrefix}-${mode}-team`
    const statusId = `${idPrefix}-${mode}-status`

    return (
      <>
        {/* Hall Filter */}
        {isHallRep ? (
          <div className="inline-flex min-h-11 md:min-h-10 items-center gap-2 rounded-[var(--radius-control)] bg-surface-raised px-3 text-[13px] font-medium text-foreground">
            <Building
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>{session.hall || 'Assigned Hall'}</span>
          </div>
        ) : (
          <div className={isMobile ? 'space-y-1.5' : 'w-44'}>
            <label
              htmlFor={hallId}
              className={
                isMobile
                  ? 'block text-[13px] font-semibold text-foreground'
                  : 'sr-only'
              }
            >
              Hall
            </label>
            <Select value={hallFilter} onValueChange={onHallFilterChange}>
              <SelectTrigger
                id={hallId}
                aria-label="Filter by hall"
                className="min-h-11 md:min-h-10 w-full bg-background text-sm"
              >
                <SelectValue placeholder="All halls" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All halls</SelectItem>
                {availableHalls.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Team Filter */}
        {showTeamSelect ? (
          <div className={isMobile ? 'space-y-1.5' : 'w-52'}>
            <label
              htmlFor={teamId}
              className={
                isMobile
                  ? 'block text-[13px] font-semibold text-foreground'
                  : 'sr-only'
              }
            >
              Operational team
            </label>
            <Select value={teamFilter} onValueChange={onTeamFilterChange}>
              <SelectTrigger
                id={teamId}
                aria-label="Filter by operational team"
                className="min-h-11 md:min-h-10 w-full bg-background text-sm"
              >
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teams</SelectItem>
                {availableTeams.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          isLeadOrAssistant &&
          !isMedia && (
            <div className="inline-flex min-h-11 md:min-h-10 items-center gap-2 rounded-[var(--radius-control)] bg-surface-raised px-3 text-[13px] font-medium text-foreground">
              <Users
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>
                {session.leadingTeam || session.team || leadsTeamKeys[0]}
              </span>
            </div>
          )
        )}

        {/* Status Filter */}
        <div className={isMobile ? 'space-y-1.5' : 'w-44'}>
          <label
            htmlFor={statusId}
            className={
              isMobile
                ? 'block text-[13px] font-semibold text-foreground'
                : 'sr-only'
            }
          >
            Verification status
          </label>
          <Select
            value={statusFilter}
            onValueChange={(val) =>
              onStatusFilterChange(val as WorkerStatusFilter)
            }
          >
            <SelectTrigger
              id={statusId}
              aria-label="Filter by verification status"
              className="min-h-11 md:min-h-10 w-full bg-background text-sm"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All statuses ({formatCount(statusCounts.all)})
              </SelectItem>
              <SelectItem value="verified">
                Verified ({formatCount(statusCounts.verified)})
              </SelectItem>
              <SelectItem value="pending">
                Pending ({formatCount(statusCounts.pending)})
              </SelectItem>
              <SelectItem value="rejected">
                Declined ({formatCount(statusCounts.rejected)})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-[var(--radius-card)] bg-card p-4 shadow-sm">
        <DataToolbar
          searchValue={searchQuery}
          onSearchChange={onSearchChange}
          searchLabel="Search workers"
          searchPlaceholder="Search by name, hall, or team…"
          filters={renderFilterControls('desktop')}
          mobileFilters={renderFilterControls('mobile')}
          activeFilterCount={mobileSheetFilterCount}
          activeFilters={activeFilterChips}
          onResetFilters={onResetFilters}
          filterSheetTitle="Filter workers"
          filterSheetDescription="Narrow the workers directory by hall, team, or verification status."
          meta={
            <span>
              Showing{' '}
              <strong className="font-semibold text-foreground">
                {formatCount(filteredRows.length)}
              </strong>{' '}
              of {formatCount(scopedWorkers.length)} workers
            </span>
          }
        />
      </div>

      {/* Results */}
      {filteredRows.length === 0 ? (
        <EmptyState
          variant="no-results"
          title="No workers match your filters"
          description="Try clearing search keywords or resetting the hall, team, or status filters."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={onResetFilters}
              className="min-h-11 md:min-h-10"
            >
              Clear all filters
            </Button>
          }
        />
      ) : (
        <>
          {/* Mobile Compact Record Cards */}
          <ul className="space-y-3 md:hidden">
            {filteredRows.map((worker) => {
              const status = resolveWorkerStatus(worker)
              const teams = getWorkerTeams(worker)
              const registeredDate = safeFormatDate(worker.createdAt)
              const birthday = formatWorkerBirthday(worker)

              return (
                <li
                  key={worker._id}
                  className="min-h-16 rounded-[var(--radius-card)] bg-card p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <WorkerAvatar worker={worker} size="md" />
                      <div className="min-w-0">
                        <p className="font-sans text-base font-semibold text-foreground truncate">
                          {worker.fullName}
                        </p>
                        <p className="text-[13px] text-muted-foreground truncate">
                          {worker.hall || 'No hall assigned'}
                          {worker.excoPosition ? ` · ${worker.excoPosition}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">{renderWorkerStatusBadge(status)}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {teams.length > 0 ? (
                      teams.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-[var(--radius-pill)] bg-surface-raised px-2.5 py-0.5 text-[13px] font-medium text-foreground"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[13px] text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                    {teams.length > 3 && (
                      <span className="text-[13px] text-muted-foreground tabular-nums">
                        +{teams.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted-foreground">
                    <span>Birthday: {birthday}</span>
                    {registeredDate && worker.createdAt && (
                      <span>
                        Joined{' '}
                        <time dateTime={toDateTimeAttr(worker.createdAt)}>
                          {registeredDate}
                        </time>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveWorkerId(worker._id)}
                      aria-label={`View details for ${worker.fullName}`}
                      className="min-h-11 flex-1 text-[13px] font-semibold"
                    >
                      <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Details</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenEmail(worker)}
                      aria-label={`Email ${worker.fullName}`}
                      className="min-h-11 flex-1 text-[13px] font-semibold"
                    >
                      <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Email</span>
                    </Button>

                    {canDelete && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => openOffboardDialog(worker)}
                        aria-label={`Offboard ${worker.fullName}`}
                        className="min-h-11 min-w-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-[var(--radius-card)] bg-card shadow-sm">
            <Table aria-label="Workers directory">
              <TableCaption className="sr-only">
                Workers directory showing name, hall, operational teams, verification status, registration or birthday dates, and actions.
              </TableCaption>
              <TableHeader sticky>
                <TableRow className="hover:bg-surface-raised">
                  <TableHead scope="col">Name &amp; Hall</TableHead>
                  <TableHead scope="col">Teams</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col">Registered / Birthday</TableHead>
                  <TableHead scope="col" className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((worker) => {
                  const status = resolveWorkerStatus(worker)
                  const teams = getWorkerTeams(worker)
                  const registeredDate = safeFormatDate(worker.createdAt)
                  const birthday = formatWorkerBirthday(worker)

                  return (
                    <TableRow
                      key={worker._id}
                      onClick={() => setActiveWorkerId(worker._id)}
                      className="cursor-pointer"
                    >
                      {/* Name & Hall */}
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-0">
                          <WorkerAvatar worker={worker} size="sm" />
                          <div className="min-w-0">
                            <p className="font-sans text-sm font-semibold text-foreground truncate">
                              {worker.fullName}
                            </p>
                            <p className="text-[13px] text-muted-foreground truncate">
                              {worker.hall || 'No hall assigned'}
                              {worker.excoPosition
                                ? ` · ${worker.excoPosition}`
                                : ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Teams */}
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                          {teams.length > 0 ? (
                            teams.slice(0, 2).map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center rounded-[var(--radius-pill)] bg-surface-raised px-2.5 py-0.5 text-[13px] font-medium text-foreground"
                              >
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-[13px] text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                          {teams.length > 2 && (
                            <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-surface-raised px-2 py-0.5 text-[13px] font-medium text-muted-foreground tabular-nums">
                              +{teams.length - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>{renderWorkerStatusBadge(status)}</TableCell>

                      {/* Registered / Birthday */}
                      <TableCell>
                        <div className="space-y-0.5 text-[13px] tabular-nums">
                          {registeredDate && worker.createdAt ? (
                            <p className="text-foreground">
                              Joined{' '}
                              <time dateTime={toDateTimeAttr(worker.createdAt)}>
                                {registeredDate}
                              </time>
                            </p>
                          ) : (
                            <p className="text-muted-foreground">
                              Registration date unavailable
                            </p>
                          )}
                          <p className="text-muted-foreground">
                            Birthday: {birthday}
                          </p>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setActiveWorkerId(worker._id)}
                            aria-label={`View details for ${worker.fullName}`}
                            className="min-h-11 md:min-h-10 px-3 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
                          >
                            <Eye
                              className="h-4 w-4 shrink-0"
                              aria-hidden="true"
                            />
                            <span>Details</span>
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenEmail(worker)}
                            aria-label={`Email ${worker.fullName}`}
                            className="min-h-11 md:min-h-10 px-3 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
                          >
                            <Mail
                              className="h-4 w-4 shrink-0"
                              aria-hidden="true"
                            />
                            <span>Email</span>
                          </Button>

                          {canDelete && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => openOffboardDialog(worker)}
                              aria-label={`Offboard ${worker.fullName}`}
                              className="min-h-11 md:min-h-10 px-3 text-[13px] font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2
                                className="h-4 w-4 shrink-0"
                                aria-hidden="true"
                              />
                              <span>Offboard</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Worker Detail Drawer */}
      <RecordSheet
        open={Boolean(activeWorkerDetail)}
        onOpenChange={(open) => {
          if (!open) setActiveWorkerId(null)
        }}
        headerExtra={
          activeWorkerDetail ? (
            <div className="flex flex-wrap items-center gap-2">
              {renderWorkerStatusBadge(resolveWorkerStatus(activeWorkerDetail))}
              {activeWorkerDetail.excoPosition && (
                <StatusBadge variant="primary" dot>
                  {activeWorkerDetail.excoPosition}
                </StatusBadge>
              )}
            </div>
          ) : undefined
        }
        title={activeWorkerDetail?.fullName ?? 'Worker profile'}
        description={
          activeWorkerDetail
            ? `${activeWorkerDetail.hall || 'No hall assigned'} · ${activeWorkerDetail.email || 'No email on record'}`
            : undefined
        }
        footer={
          activeWorkerDetail ? (
            <div className="flex w-full flex-col gap-2">
              {canApprove && isWorkerPending(activeWorkerDetail) && (
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={processingId === activeWorkerDetail._id}
                    onClick={() =>
                      setVerifyDecision({
                        worker: activeWorkerDetail,
                        decision: 'reject',
                      })
                    }
                    className="min-h-11 md:min-h-10 flex-1 sm:flex-initial text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <UserX className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Decline</span>
                  </Button>
                  <Button
                    type="button"
                    disabled={processingId === activeWorkerDetail._id}
                    onClick={() =>
                      setVerifyDecision({
                        worker: activeWorkerDetail,
                        decision: 'approve',
                      })
                    }
                    className="min-h-11 md:min-h-10 flex-1 sm:flex-initial"
                  >
                    <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Approve</span>
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const target = activeWorkerDetail
                      setActiveWorkerId(null)
                      onOpenEmail(target)
                    }}
                    className="min-h-11 md:min-h-10"
                  >
                    <Mail
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>Email Worker</span>
                  </Button>

                  {canDelete && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openOffboardDialog(activeWorkerDetail)}
                      className="min-h-11 md:min-h-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Offboard</span>
                    </Button>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveWorkerId(null)}
                  className="min-h-11 md:min-h-10"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        {activeWorkerDetail && (
          <WorkerProfileDetails
            worker={activeWorkerDetail}
            extraActions={
              isAdmin &&
              activeWorkerDetail.requestedRole &&
              !activeWorkerDetail.isExcoApproved ? (
                <div className="flex flex-col gap-3 rounded-[var(--radius-control)] bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">
                      Requested Executive Access
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      Requested role:{' '}
                      <strong className="text-foreground">
                        {activeWorkerDetail.requestedRole.replace('_', ' ')}
                      </strong>
                    </p>
                  </div>
                  <Button
                    type="button"
                    disabled={processingId === activeWorkerDetail._id}
                    onClick={() => onToggleExco(activeWorkerDetail, true)}
                    className="min-h-11 md:min-h-10 shrink-0"
                  >
                    {processingId === activeWorkerDetail._id ? (
                      <Loader2
                        className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    ) : (
                      <ShieldCheck
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span>Grant Exco</span>
                  </Button>
                </div>
              ) : undefined
            }
          />
        )}
      </RecordSheet>

      {/* Verify Confirmation Dialog (from Directory Detail Drawer) */}
      <WorkerVerifyConfirmDialog
        pendingDecision={verifyDecision}
        onOpenChange={(open) => {
          if (!open) setVerifyDecision(null)
        }}
        loading={
          Boolean(verifyDecision) &&
          processingId === verifyDecision?.worker._id
        }
        onConfirm={onVerify}
      />

      {/* Offboarding / Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(workerToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setWorkerToDelete(null)
            setConfirmDeleteName('')
          }
        }}
        tone="destructive"
        title={
          workerToDelete
            ? `Offboard ${workerToDelete.fullName}`
            : 'Offboard Worker'
        }
        description="Authorized for Christian Student Governing Board and Chaplains when a worker leaves the team."
        effectSummary={
          workerToDelete ? (
            <div className="space-y-1">
              <p className="font-semibold">
                {deletePolicy === 'permanent'
                  ? `Permanently deletes ${workerToDelete.fullName}'s profile, credentials, and sign-in account.`
                  : `Archives ${workerToDelete.fullName}, revoking dashboard access and active memberships while preserving audit logs.`}
              </p>
              <p className="text-[13px] text-muted-foreground">
                Current assignment:{' '}
                <strong className="text-foreground">
                  {workerToDelete.team || 'Unassigned'}
                </strong>{' '}
                · {workerToDelete.hall || 'No Hall'}
              </p>
            </div>
          ) : undefined
        }
        confirmLabel={
          deletePolicy === 'permanent'
            ? 'Confirm Permanent Deletion'
            : 'Confirm Archiving'
        }
        loadingLabel="Processing…"
        loading={isDeleting}
        confirmDisabled={
          !workerToDelete ||
          confirmDeleteName.trim().toLowerCase() !==
            workerToDelete.fullName.trim().toLowerCase()
        }
        onConfirm={handleDeleteWorker}
      >
        {workerToDelete && (
          <div className="space-y-4">
            {/* Policy Selector */}
            <div className="space-y-2">
              <span
                id={`${idPrefix}-policy-label`}
                className="block text-[13px] font-semibold text-foreground"
              >
                Offboarding Policy
              </span>
              <div
                role="radiogroup"
                aria-labelledby={`${idPrefix}-policy-label`}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={deletePolicy === 'archive'}
                  onClick={() => setDeletePolicy('archive')}
                  className={cn(
                    'min-h-11 rounded-[var(--radius-control)] p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    deletePolicy === 'archive'
                      ? 'bg-primary/10 text-foreground ring-1 ring-inset ring-primary/40'
                      : 'bg-surface-raised text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="block text-sm font-semibold text-foreground">
                    Archive Record
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted-foreground">
                    Revoke access, keep logs
                  </span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={deletePolicy === 'permanent'}
                  onClick={() => setDeletePolicy('permanent')}
                  className={cn(
                    'min-h-11 rounded-[var(--radius-control)] p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    deletePolicy === 'permanent'
                      ? 'bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/40'
                      : 'bg-surface-raised text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="block text-sm font-semibold text-destructive">
                    Permanent Delete
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted-foreground">
                    Wipe profile &amp; credentials
                  </span>
                </button>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label
                htmlFor={`${idPrefix}-offboard-reason`}
                className="text-[13px] font-semibold text-foreground"
              >
                Reason for departure
              </Label>
              <Input
                id={`${idPrefix}-offboard-reason`}
                type="text"
                placeholder="e.g. Left fellowship team, graduated, relocated"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                disabled={isDeleting}
                className="min-h-11 md:min-h-10 text-sm"
              />
            </div>

            {/* Exact Name Confirmation */}
            <div className="space-y-1.5">
              <Label
                htmlFor={`${idPrefix}-offboard-confirm-name`}
                className="text-[13px] font-semibold text-foreground"
              >
                Type{' '}
                <span className="font-sans font-semibold text-destructive select-all">
                  {workerToDelete.fullName}
                </span>{' '}
                to confirm
              </Label>
              <Input
                id={`${idPrefix}-offboard-confirm-name`}
                type="text"
                placeholder="Enter worker's exact name"
                value={confirmDeleteName}
                onChange={(e) => setConfirmDeleteName(e.target.value)}
                disabled={isDeleting}
                autoComplete="off"
                className="min-h-11 md:min-h-10 border-destructive/40 text-sm focus-visible:ring-destructive"
              />
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
