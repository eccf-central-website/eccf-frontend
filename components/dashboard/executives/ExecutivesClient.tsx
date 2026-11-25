'use client'

import * as React from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUpDown,
  Building,
  Clock,
  Crown,
  ExternalLink,
  Loader2,
  Search,
  Shield,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import type { ExecutiveRow, PendingExecutiveApplication } from '@/types'
import {
  decideExecutivePosition,
  deleteExecutivePosition,
  updateExecutiveRank,
} from '@/app/actions/executive-actions'
import { Button } from '@/components/dashboard/ui/button'
import { ConfirmDialog } from '@/components/dashboard/ui/confirm-dialog'
import { Input } from '@/components/dashboard/ui/input'
import { KpiStrip } from '@/components/dashboard/ui/kpi-strip'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { RecordSheet } from '@/components/dashboard/ui/record-sheet'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import ExecutiveCsvImportDialog from '@/components/dashboard/workers/ExecutiveCsvImportDialog'
import { formatCount, formatDate, toDateTimeAttr } from '@/lib/dashboard/format'
import { toastError, toastSuccess } from '@/lib/dashboard/toast'
import { cn } from '@/lib/utils'

interface ExecutivesClientProps {
  initialExecutives: ExecutiveRow[]
  /** Registration/profile applications still awaiting an approval decision. */
  initialPendingApplications?: PendingExecutiveApplication[]
  canManage?: boolean
  /** Date-only eyebrow rendered by the server via formatDate(lagosDate()). */
  today: string
}

type CategoryTab = 'all' | 'csgb' | 'hall' | 'team'

interface PendingDecisionState {
  application: PendingExecutiveApplication
  decision: 'approved' | 'rejected'
}

interface DeletePositionState {
  worker: ExecutiveRow
  positionKey: string
  label: string
  fromAppointment: boolean
}

function getInitials(name?: string): string {
  if (!name) return 'EX'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function isValidIso(dateStr?: string): dateStr is string {
  if (!dateStr) return false
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return true
  return !Number.isNaN(new Date(dateStr).getTime())
}

function safeFormatDate(dateStr?: string, fallback = 'Appointed'): string {
  if (!isValidIso(dateStr)) return dateStr || fallback
  return formatDate(dateStr)
}

/** Roster rows must be live, approved appointments — never archived or rejected records. */
function approvedPositions(row: ExecutiveRow) {
  return (row.positions || []).filter((position) => position.status === 'approved')
}

function positionLabel(position: {
  kind: 'csgb' | 'hall' | 'team'
  office?: string
  csgbRoleTitle?: string
  hallName?: string
  hall?: string
  teamTitle?: string
  teamName?: string
}): string {
  if (position.kind === 'csgb') return position.office || position.csgbRoleTitle || 'CSGB Officer'
  if (position.kind === 'hall') return `Hall Pastor (${position.hallName || position.hall || 'Hall'})`
  return position.teamTitle || position.teamName || 'Ministry'
}

function categoryKindLabel(kind: 'csgb' | 'hall' | 'team'): string {
  if (kind === 'csgb') return 'CSGB'
  if (kind === 'hall') return 'Hall Pastor'
  return 'Team'
}

/**
 * Legacy records stored a worker document ID in `decidedBy`. Showing that raw
 * ID helps nobody, so only genuine names are displayed.
 */
function isRecordId(value: string): boolean {
  return !value.includes(' ') && /^[a-z0-9_-]{16,}$/i.test(value)
}

function displayApproverName(decidedBy?: string): string | undefined {
  const name = decidedBy?.trim()
  if (!name || isRecordId(name)) return undefined
  return name
}

function approvedByLine(decidedBy?: string, decidedAt?: string): string {
  const when = isValidIso(decidedAt) ? formatDate(decidedAt) : ''
  const name = displayApproverName(decidedBy)
  if (name) return `Approved by ${name}${when ? ` · ${when}` : ''}`
  return when ? `Approved · ${when}` : 'Approved'
}

export default function ExecutivesClient({
  initialExecutives,
  initialPendingApplications = [],
  canManage = false,
  today,
}: ExecutivesClientProps) {
  const router = useRouter()
  const [executives, setExecutives] = useState<ExecutiveRow[]>(initialExecutives)
  const [pendingApplications, setPendingApplications] = useState<PendingExecutiveApplication[]>(
    initialPendingApplications
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<CategoryTab>('all')
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const [reviewingApp, setReviewingApp] = useState<PendingExecutiveApplication | null>(null)
  const [pendingDecision, setPendingDecision] = useState<PendingDecisionState | null>(null)
  const [deletingPosition, setDeletingPosition] = useState<DeletePositionState | null>(null)

  React.useEffect(() => {
    setExecutives(initialExecutives)
  }, [initialExecutives])

  React.useEffect(() => {
    setPendingApplications(initialPendingApplications)
  }, [initialPendingApplications])

  // Defensive filter: only approved appointments stay on the roster.
  const roster = useMemo(
    () =>
      executives
        .map((row) => ({ ...row, positions: approvedPositions(row) }))
        .filter((row) => row.positions.length > 0),
    [executives]
  )

  const { totalExcos, registeredCount, unregisteredCount, csgbCount, hallCount, teamCount } =
    useMemo(() => {
      let csgb = 0
      let hall = 0
      let team = 0
      let registered = 0

      for (const ex of roster) {
        if (ex.isRegistered) registered++
        for (const p of ex.positions) {
          if (p.kind === 'csgb') csgb++
          else if (p.kind === 'hall') hall++
          else if (p.kind === 'team') team++
        }
      }

      return {
        totalExcos: roster.length,
        registeredCount: registered,
        unregisteredCount: roster.length - registered,
        csgbCount: csgb,
        hallCount: hall,
        teamCount: team,
      }
    }, [roster])

  const filteredExecutives = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return roster.filter((worker) => {
      const matchesTab =
        activeTab === 'all'
          ? true
          : worker.positions.some((p) => p.kind === activeTab)

      if (!matchesTab) return false
      if (!q) return true

      const nameMatch = worker.fullName?.toLowerCase().includes(q)
      const emailMatch = worker.email?.toLowerCase().includes(q)
      const hallMatch = worker.hall?.toLowerCase().includes(q)
      const posMatch = worker.positions.some((p) => {
        const title = (
          p.office ||
          p.csgbRoleTitle ||
          p.hallName ||
          p.teamTitle ||
          p.teamName ||
          ''
        ).toLowerCase()
        return title.includes(q) || Boolean(p.decidedBy?.toLowerCase().includes(q))
      })

      return Boolean(nameMatch || emailMatch || hallMatch || posMatch)
    })
  }, [roster, activeTab, searchQuery])

  async function handleConfirmDecision() {
    if (!pendingDecision) return
    const { application, decision } = pendingDecision
    const key = `${application.workerId}:${application.position.key}`
    setBusyKey(key)

    try {
      const res = await decideExecutivePosition(
        application.workerId,
        application.position.key,
        decision
      )

      if (!res.ok) {
        toastError(res.error || 'Failed to record the decision.')
        return
      }

      setPendingApplications((prev) =>
        prev.filter(
          (item) =>
            !(
              item.workerId === application.workerId &&
              item.position.key === application.position.key
            )
        )
      )
      setPendingDecision(null)
      if (
        reviewingApp &&
        reviewingApp.workerId === application.workerId &&
        reviewingApp.position.key === application.position.key
      ) {
        setReviewingApp(null)
      }

      toastSuccess(
        decision === 'approved'
          ? `${application.fullName} approved as ${positionLabel(application.position)}.`
          : `${application.fullName}'s ${positionLabel(application.position)} application was declined.`
      )
      router.refresh()
    } catch {
      toastError('An unexpected network error occurred.')
    } finally {
      setBusyKey(null)
    }
  }

  async function handleConfirmDeletePosition() {
    if (!deletingPosition) return
    const { worker, positionKey, label, fromAppointment } = deletingPosition
    const isReserved = fromAppointment || !worker.isRegistered
    const key = `delete:${worker._id}:${positionKey}`
    setBusyKey(key)

    try {
      const res = await deleteExecutivePosition(worker._id, positionKey, {
        fromAppointment,
        reason: isReserved ? 'Reserved appointment removed' : 'Executive role deleted',
      })
      if (!res.ok) {
        toastError(res.error || 'Failed to delete this executive role.')
        return
      }

      setDeletingPosition(null)
      toastSuccess(
        `${worker.fullName} — ${label} deleted.${
          res.deletedPlaceholders
            ? ` ${res.deletedPlaceholders} Sanity placeholder${
                res.deletedPlaceholders === 1 ? '' : 's'
              } removed.`
            : ''
        }`
      )
      router.refresh()
    } catch {
      toastError('An unexpected network error occurred.')
    } finally {
      setBusyKey(null)
    }
  }

  async function handleToggleRank(
    worker: ExecutiveRow,
    positionKey: string,
    currentRank: 'lead' | 'assistant' | undefined
  ) {
    const nextRank = currentRank === 'assistant' ? 'lead' : 'assistant'
    setBusyKey(`rank:${worker._id}:${positionKey}`)
    try {
      const res = await updateExecutiveRank(worker._id, positionKey, nextRank)
      if (!res.ok) {
        toastError(res.error || 'Failed to update rank.')
        return
      }
      toastSuccess(`${worker.fullName} is now ${nextRank === 'assistant' ? 'Assistant' : 'Lead'}.`)
      router.refresh()
    } catch {
      toastError('An unexpected network error occurred.')
    } finally {
      setBusyKey(null)
    }
  }

  const tabClass = (tab: CategoryTab) =>
    cn(
      'flex min-h-11 shrink-0 items-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] px-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10',
      activeTab === tab
        ? 'bg-card text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    )

  const countChipClass = (tab: CategoryTab) =>
    cn(
      'ml-0.5 rounded-[var(--radius-pill)] px-2 py-0.5 text-[13px] font-semibold tabular-nums',
      activeTab === tab
        ? 'bg-primary/10 text-accent-foreground dark:text-primary'
        : 'bg-muted text-muted-foreground'
    )

  const pendingDecisionBusy = Boolean(
    pendingDecision &&
      busyKey ===
        `${pendingDecision.application.workerId}:${pendingDecision.application.position.key}`
  )

  const deletingPositionBusy = Boolean(
    deletingPosition &&
      busyKey === `delete:${deletingPosition.worker._id}:${deletingPosition.positionKey}`
  )

  const deleteTargetIsReserved = Boolean(
    deletingPosition &&
      (deletingPosition.fromAppointment || !deletingPosition.worker.isRegistered)
  )

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow={today}
        title="Executive Council & Leadership Roster"
        description="Approved leaders across CSGB, Hall Pastorate, and Ministry Teams. Reserved appointments activate automatically when the leader registers."
        primaryAction={
          canManage ? (
            <ExecutiveCsvImportDialog
              buttonLabel="Import Leadership Roster"
              className="min-h-11 bg-primary font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            />
          ) : undefined
        }
      />

      {/* Fixed-row KPI Strip (non-interactive so filter tabs remain unique buttons) */}
      <KpiStrip
        ariaLabel="Executive leadership counts"
        items={[
          {
            id: 'total-leaders',
            label: 'Total Leaders',
            value: formatCount(totalExcos),
            rawValue: totalExcos,
            caption: `${formatCount(registeredCount)} registered${
              unregisteredCount > 0 ? ` · ${formatCount(unregisteredCount)} awaiting` : ''
            }`,
            icon: <Crown className="h-4 w-4" />,
            tone: 'primary',
          },
          {
            id: 'csgb-board',
            label: 'CSGB Board',
            value: formatCount(csgbCount),
            rawValue: csgbCount,
            caption: 'Governing board seats',
            icon: <Shield className="h-4 w-4" />,
            tone: 'neutral',
          },
          {
            id: 'hall-pastors',
            label: 'Hall Pastors',
            value: formatCount(hallCount),
            rawValue: hallCount,
            caption: 'Hall pastorate leads',
            icon: <Building className="h-4 w-4" />,
            tone: 'neutral',
          },
          {
            id: 'team-leads',
            label: 'Team Leads',
            value: formatCount(teamCount),
            rawValue: teamCount,
            caption: 'Ministry team heads',
            icon: <Users className="h-4 w-4" />,
            tone: 'neutral',
          },
        ]}
      />

      {unregisteredCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-[var(--radius-card)] bg-surface-raised px-4 py-3.5 text-sm text-foreground">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="leading-relaxed">
            <span className="font-semibold">
              {formatCount(unregisteredCount)} appointed leader
              {unregisteredCount === 1 ? ' has' : 's have'} not registered yet.
            </span>{' '}
            Their role is reserved. Dashboard access activates automatically the moment they
            register as a worker on <span className="font-mono">/register</span>.
          </p>
        </div>
      )}

      {/* Pending executive applications — Review drawer + confirmation dialog */}
      {canManage && pendingApplications.length > 0 && (
        <section className="rounded-[var(--radius-card)] bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-sans text-base font-semibold text-foreground">
                Awaiting Your Decision
              </h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Applications submitted by workers. Review each candidate before confirming access.
              </p>
            </div>
            <StatusBadge variant="warning">
              {formatCount(pendingApplications.length)} pending
            </StatusBadge>
          </div>

          <ul className="mt-4 space-y-2.5">
            {pendingApplications.map((application) => {
              const key = `${application.workerId}:${application.position.key}`
              const submittedRaw = application.position.submittedAt || application.createdAt
              const validSubmitted = isValidIso(submittedRaw)

              return (
                <li
                  key={key}
                  className="flex flex-col gap-3 rounded-[var(--radius-control)] bg-surface-raised p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {application.fullName}
                      </span>
                      <StatusBadge variant="primary">
                        {positionLabel(application.position)}
                      </StatusBadge>
                    </div>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {application.email || 'No email on record'}
                      {application.hall ? ` · ${application.hall}` : ''}
                      {' · '}
                      Submitted{' '}
                      {validSubmitted ? (
                        <time dateTime={toDateTimeAttr(submittedRaw)}>
                          {formatDate(submittedRaw)}
                        </time>
                      ) : (
                        'recently'
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => setReviewingApp(application)}
                      className="min-h-11 px-4 md:min-h-10"
                    >
                      Review
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Filter executive roster by leadership category"
          className="flex items-center gap-1 overflow-x-auto rounded-[var(--radius-control)] bg-surface-raised p-1"
        >
          <button
            type="button"
            aria-pressed={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            className={tabClass('all')}
          >
            All Leadership
            <span className={countChipClass('all')}>{formatCount(totalExcos)}</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'csgb'}
            onClick={() => setActiveTab('csgb')}
            className={tabClass('csgb')}
          >
            CSGB Board
            <span className={countChipClass('csgb')}>{formatCount(csgbCount)}</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'hall'}
            onClick={() => setActiveTab('hall')}
            className={tabClass('hall')}
          >
            Hall Pastors
            <span className={countChipClass('hall')}>{formatCount(hallCount)}</span>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'team'}
            onClick={() => setActiveTab('team')}
            className={tabClass('team')}
          >
            Team Leads
            <span className={countChipClass('team')}>{formatCount(teamCount)}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <label htmlFor="executives-search" className="sr-only">
            Search executive leaders
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="executives-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leader..."
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn(
              'h-11 rounded-[var(--radius-control)] bg-card pl-9 md:h-10',
              searchQuery ? 'pr-11' : 'pr-3'
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear leader search"
              className="absolute right-0.5 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Executives List */}
      {filteredExecutives.length === 0 ? (
        <div
          role="status"
          className="flex flex-col items-center justify-center rounded-[var(--radius-card)] bg-card p-12 text-center shadow-sm"
        >
          <div
            aria-hidden="true"
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-sans text-lg font-semibold text-foreground">
            No executive leaders found
          </h3>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {searchQuery
              ? `No executives match "${searchQuery}". Try clearing your search query.`
              : 'No approved executive appointments have been recorded for this category yet. Import an executive roster to get started.'}
          </p>
          {canManage && !searchQuery && (
            <div className="mt-4">
              <ExecutiveCsvImportDialog
                buttonLabel="Import Leadership Roster"
                className="min-h-11 bg-primary text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredExecutives.map((worker) => {
            const visiblePositions =
              activeTab === 'all'
                ? worker.positions
                : worker.positions.filter((p) => p.kind === activeTab)

            return (
              <article
                key={worker._id}
                className="group relative flex flex-col justify-between rounded-[var(--radius-card)] bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div>
                  {/* Top: Avatar & Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {worker.profileImageUrl ? (
                        // Profile images can come from Sanity or an external
                        // avatar URL, so use a plain img with a fixed box.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={worker.profileImageUrl}
                          alt={worker.fullName}
                          className={cn(
                            'h-11 w-11 shrink-0 rounded-full object-cover ring-2',
                            worker.isRegistered ? 'ring-primary/20' : 'ring-gold/40'
                          )}
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold shadow-sm',
                            worker.isRegistered
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-gold/25 text-gold-foreground dark:bg-gold/20 dark:text-gold'
                          )}
                        >
                          {getInitials(worker.fullName)}
                        </div>
                      )}
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="font-sans text-base font-semibold leading-tight text-foreground">
                            {worker.fullName}
                          </h4>
                          {!worker.isRegistered && (
                            <StatusBadge
                              variant="gold"
                              icon={<Clock className="h-3.5 w-3.5" />}
                            >
                              Unregistered
                            </StatusBadge>
                          )}
                        </div>
                        <p className="truncate text-[13px] text-muted-foreground">
                          {worker.email ||
                            (worker.isRegistered
                              ? 'No email registered'
                              : 'No email on the leadership sheet')}
                        </p>
                        {worker.hall && (
                          <p className="text-[13px] text-muted-foreground">{worker.hall}</p>
                        )}
                      </div>
                    </div>

                    {worker.isRegistered ? (
                      <Link
                        href={`/dashboard/workers?search=${encodeURIComponent(worker.fullName)}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:w-10"
                        title="View workforce profile"
                        aria-label={`View ${worker.fullName}'s workforce profile`}
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </Link>
                    ) : (
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-gold-foreground/80 dark:text-gold"
                        title="Workforce profile unlocks after the leader registers"
                        aria-label="Workforce profile unlocks after the leader registers"
                      >
                        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </span>
                    )}
                  </div>

                  {/* Positions Held */}
                  <div className="mt-4 space-y-2 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Executive Appointments
                    </p>
                    <div className="space-y-2">
                      {visiblePositions.map((pos) => {
                        const label = positionLabel(pos)
                        const isAssistant = pos.rank === 'assistant'
                        const deleteKey = `delete:${worker._id}:${pos.key}`
                        const rankKey = `rank:${worker._id}:${pos.key}`
                        const reservedDate = worker.importedAt || pos.submittedAt

                        return (
                          <div
                            key={pos.key}
                            className="rounded-[var(--radius-control)] bg-surface-raised px-3 py-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex min-w-0 flex-col gap-1">
                                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                  <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-primary/10 px-2 py-0.5 text-[13px] font-medium text-accent-foreground dark:text-primary">
                                    {categoryKindLabel(pos.kind)}
                                  </span>
                                  <span className="truncate text-sm font-semibold text-foreground">
                                    {label}
                                  </span>
                                </div>

                                <span className="text-[13px] text-muted-foreground">
                                  {isAssistant ? 'Assistant' : 'Head / Lead'} ·{' '}
                                  {worker.isRegistered
                                    ? approvedByLine(
                                        pos.decidedBy,
                                        pos.decidedAt || pos.submittedAt
                                      )
                                    : displayApproverName(pos.decidedBy)
                                      ? `Reserved by ${displayApproverName(pos.decidedBy)} · ${safeFormatDate(
                                          reservedDate,
                                          'Reserved'
                                        )}`
                                      : `Reserved ${safeFormatDate(reservedDate, 'on file')}`}
                                </span>
                              </div>

                              {canManage && (
                                <div className="flex shrink-0 items-center gap-1">
                                  {worker.isRegistered && !pos.fromAppointment && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleRank(worker, pos.key, pos.rank)
                                      }
                                      disabled={busyKey === rankKey}
                                      className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 md:h-10 md:w-10"
                                      title={
                                        isAssistant
                                          ? `Promote ${worker.fullName} to Lead`
                                          : `Make ${worker.fullName} Assistant`
                                      }
                                      aria-label={
                                        isAssistant
                                          ? `Promote ${worker.fullName} to Lead`
                                          : `Make ${worker.fullName} Assistant`
                                      }
                                    >
                                      {busyKey === rankKey ? (
                                        <Loader2
                                          className="h-4 w-4 animate-spin motion-reduce:animate-none"
                                          aria-hidden="true"
                                        />
                                      ) : (
                                        <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                                      )}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeletingPosition({
                                        worker,
                                        positionKey: pos.key,
                                        label,
                                        fromAppointment: Boolean(pos.fromAppointment),
                                      })
                                    }
                                    disabled={busyKey === deleteKey}
                                    className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 md:h-10 md:w-10"
                                    title={
                                      pos.fromAppointment || !worker.isRegistered
                                        ? `Delete ${worker.fullName}'s reserved ${label} appointment and its Sanity placeholder`
                                        : `Delete ${worker.fullName}'s ${label} role and linked Sanity placeholders`
                                    }
                                    aria-label={
                                      pos.fromAppointment || !worker.isRegistered
                                        ? `Delete ${worker.fullName}'s reserved ${label} appointment`
                                        : `Delete ${worker.fullName}'s ${label} role`
                                    }
                                  >
                                    {busyKey === deleteKey ? (
                                      <Loader2
                                        className="h-4 w-4 animate-spin motion-reduce:animate-none"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer status */}
                <div className="mt-4 flex items-center justify-between gap-2 pt-2">
                  {worker.isRegistered ? (
                    <StatusBadge variant="success">Active Roster</StatusBadge>
                  ) : (
                    <StatusBadge variant="gold" icon={<Clock className="h-3.5 w-3.5" />}>
                      Awaiting registration
                    </StatusBadge>
                  )}
                  <span className="shrink-0 font-mono text-[13px] text-muted-foreground">
                    ID: {worker._id.slice(-6)}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Review Drawer for Pending Executive Application */}
      <RecordSheet
        open={Boolean(reviewingApp)}
        onOpenChange={(open) => {
          if (!open) setReviewingApp(null)
        }}
        headerExtra={
          reviewingApp && (
            <StatusBadge variant="warning">Pending executive application</StatusBadge>
          )
        }
        title={reviewingApp?.fullName ?? 'Candidate review'}
        description={
          reviewingApp ? positionLabel(reviewingApp.position) : undefined
        }
        footer={
          reviewingApp && (
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setPendingDecision({ application: reviewingApp, decision: 'rejected' })
                }
                className="min-h-11 gap-2"
              >
                <ThumbsDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Decline</span>
              </Button>
              <Button
                type="button"
                onClick={() =>
                  setPendingDecision({ application: reviewingApp, decision: 'approved' })
                }
                className="min-h-11 gap-2"
              >
                <ThumbsUp className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Approve</span>
              </Button>
            </div>
          )
        }
      >
        {reviewingApp && (
          <div className="space-y-5">
            <dl className="grid grid-cols-1 gap-3.5 rounded-[var(--radius-card)] bg-surface-raised p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[13px] font-medium text-muted-foreground">Email</dt>
                <dd className="mt-0.5 break-all font-medium text-foreground">
                  {reviewingApp.email || 'No email on record'}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted-foreground">Hall</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {reviewingApp.hall || 'Not specified'}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted-foreground">
                  Leadership category
                </dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {categoryKindLabel(reviewingApp.position.kind)}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-muted-foreground">
                  Submitted
                </dt>
                <dd className="mt-0.5 font-medium text-foreground tabular-nums">
                  {isValidIso(reviewingApp.position.submittedAt || reviewingApp.createdAt) ? (
                    <time
                      dateTime={toDateTimeAttr(
                        (reviewingApp.position.submittedAt || reviewingApp.createdAt)!
                      )}
                    >
                      {formatDate(
                        (reviewingApp.position.submittedAt || reviewingApp.createdAt)!
                      )}
                    </time>
                  ) : (
                    'Recently'
                  )}
                </dd>
              </div>
            </dl>

            <div className="rounded-[var(--radius-control)] bg-primary/10 p-4 text-sm leading-relaxed text-foreground">
              <p className="font-semibold">Permission effect upon approval</p>
              <p className="mt-1 text-muted-foreground">
                Approving grants verified membership, activates the{' '}
                <strong className="font-semibold text-foreground">
                  {positionLabel(reviewingApp.position)}
                </strong>{' '}
                role immediately, and publishes {reviewingApp.fullName} to the Executive Council
                roster.
              </p>
            </div>
          </div>
        )}
      </RecordSheet>

      {/* Confirm Decision Dialog */}
      <ConfirmDialog
        open={Boolean(pendingDecision)}
        onOpenChange={(open) => {
          if (!open) setPendingDecision(null)
        }}
        tone={pendingDecision?.decision === 'approved' ? 'primary' : 'destructive'}
        title={
          pendingDecision
            ? pendingDecision.decision === 'approved'
              ? `Approve ${pendingDecision.application.fullName} as ${positionLabel(
                  pendingDecision.application.position
                )}?`
              : `Decline ${pendingDecision.application.fullName}’s application?`
            : 'Confirm decision'
        }
        description={
          pendingDecision
            ? pendingDecision.decision === 'approved'
              ? `You are approving ${pendingDecision.application.fullName} for the ${positionLabel(
                  pendingDecision.application.position
                )} appointment.`
              : `You are declining ${pendingDecision.application.fullName}’s application for ${positionLabel(
                  pendingDecision.application.position
                )}.`
            : undefined
        }
        effectSummary={
          pendingDecision?.decision === 'approved'
            ? `Approving grants verified membership, activates dashboard leadership permissions for ${positionLabel(
                pendingDecision.application.position
              )}, and lists ${pendingDecision.application.fullName} on the Executive Council roster.`
            : 'Declining marks this application as rejected and removes it from the decision queue without granting executive permissions.'
        }
        confirmLabel={
          pendingDecision?.decision === 'approved'
            ? 'Approve appointment'
            : 'Decline application'
        }
        loading={pendingDecisionBusy}
        loadingLabel={
          pendingDecision?.decision === 'approved' ? 'Approving…' : 'Declining…'
        }
        onConfirm={handleConfirmDecision}
      />

      {/* Confirm Delete Executive Position Dialog */}
      <ConfirmDialog
        open={Boolean(deletingPosition)}
        onOpenChange={(open) => {
          if (!open) setDeletingPosition(null)
        }}
        tone="destructive"
        title={
          deletingPosition
            ? deleteTargetIsReserved
              ? `Remove ${deletingPosition.worker.fullName}’s reserved “${deletingPosition.label}” role?`
              : `Delete ${deletingPosition.worker.fullName}’s “${deletingPosition.label}” role?`
            : 'Delete executive role'
        }
        description={
          deletingPosition
            ? deleteTargetIsReserved
              ? `This removes the reserved appointment placeholder for ${deletingPosition.worker.fullName}.`
              : `This removes the ${deletingPosition.label} executive role from ${deletingPosition.worker.fullName}’s worker record.`
            : undefined
        }
        effectSummary={
          deleteTargetIsReserved
            ? 'The Sanity placeholder is removed, so this executive role will no longer auto-activate when they register.'
            : 'Any linked Sanity appointment placeholders are deleted so this role cannot auto-link again.'
        }
        confirmLabel="Delete role"
        loading={deletingPositionBusy}
        loadingLabel="Deleting…"
        onConfirm={handleConfirmDeletePosition}
      />
    </div>
  )
}
