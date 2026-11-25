'use client'

import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Clock, Mail, Users } from 'lucide-react'
import type { WorkerRow, ECCFSession } from '@/types'
import type { WorkerAccess } from '@/lib/dashboard/access'
import type { TeamUnitOption } from '@/lib/dashboard/attendance-constants'
import { isMediaTeam, canDeleteWorkers } from '@/lib/dashboard/rbac'
import {
  verifyWorkerMembership,
  toggleExcoApproval,
} from '@/app/actions/worker-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'
import { formatCount, formatDate } from '@/lib/dashboard/format'
import { lagosDate } from '@/lib/dashboard/dates'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { KpiStrip, type KpiStripItem } from '@/components/dashboard/ui/kpi-strip'
import { Button } from '@/components/dashboard/ui/button'
import { cn } from '@/lib/utils'
import ExecutiveCsvImportDialog from './ExecutiveCsvImportDialog'
import SendWorkerEmailDialog from './SendWorkerEmailDialog'
import WorkersDirectory, {
  matchesWorkerTeam,
  type WorkerStatusFilter,
} from './WorkersDirectory'
import WorkerApprovals, { isWorkerPending } from './WorkerApprovals'
import WorkerEmailPanel from './WorkerEmailPanel'

export type WorkersTab = 'directory' | 'approvals' | 'email'

function isWorkersTab(value: string | null | undefined): value is WorkersTab {
  return value === 'directory' || value === 'approvals' || value === 'email'
}

interface WorkersClientProps {
  rows: WorkerRow[]
  session: ECCFSession & { access?: WorkerAccess }
  teamOptions: TeamUnitOption[]
  hallOptions?: string[]
  initialTab?: string
  initialSearch?: string
  today?: string
}

const DEFAULT_HALLS = [
  'Hall 1',
  'Hall 2',
  'Hall 3',
  'Hall 4',
  'Hall 5',
  'Hall 6',
  'Hall 7',
  'Hall 8',
]

export default function WorkersClient({
  rows: initialRows,
  session,
  teamOptions,
  hallOptions,
  initialTab,
  initialSearch = '',
  today,
}: WorkersClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const halls =
    hallOptions && hallOptions.length > 0 ? hallOptions : DEFAULT_HALLS

  const [rows, setRows] = useState<WorkerRow[]>(initialRows)
  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])

  const access = session.access
  const isPresident = Boolean(access?.isPresident)
  const leadsTeamIds = useMemo(
    () => access?.leadsTeamIds || [],
    [access?.leadsTeamIds]
  )
  const leadsTeamKeys = useMemo(
    () => access?.leadsTeamKeys || [],
    [access?.leadsTeamKeys]
  )
  const isTeamLead = session.role === 'team_lead'
  const isLeadOrAssistant =
    leadsTeamIds.length > 0 || leadsTeamKeys.length > 0 || isTeamLead
  const isAdmin = session.role === 'admin'
  const isHallRep = session.role === 'hall_rep'
  const isMedia = isMediaTeam(session)

  const canApprove = isPresident || isAdmin || (isLeadOrAssistant && !isMedia)
  const canDelete = useMemo(() => canDeleteWorkers(session), [session])

  const targetLeaderTeam = useMemo(() => {
    if (!isLeadOrAssistant || isMedia) return null
    return (
      (session.leadingTeam || session.team || leadsTeamKeys[0] || '').trim() ||
      null
    )
  }, [
    isLeadOrAssistant,
    isMedia,
    session.leadingTeam,
    session.team,
    leadsTeamKeys,
  ])

  const scopedWorkers = useMemo(() => {
    if (isPresident || isAdmin || isMedia) return rows
    if (isLeadOrAssistant) {
      return rows.filter((r) => {
        if (Array.isArray(r.memberships) && r.memberships.length > 0) {
          const hasMatch = r.memberships.some(
            (m) =>
              (m.teamId && leadsTeamIds.includes(m.teamId)) ||
              (m.teamKey && leadsTeamKeys.includes(m.teamKey)) ||
              (targetLeaderTeam && matchesWorkerTeam(r, targetLeaderTeam))
          )
          if (hasMatch) return true
        }
        if (targetLeaderTeam) {
          return matchesWorkerTeam(r, targetLeaderTeam)
        }
        return false
      })
    }
    return rows
  }, [
    rows,
    isPresident,
    isAdmin,
    isMedia,
    isLeadOrAssistant,
    leadsTeamIds,
    leadsTeamKeys,
    targetLeaderTeam,
  ])

  const pendingWorkers = useMemo(
    () => scopedWorkers.filter((r) => isWorkerPending(r)),
    [scopedWorkers]
  )
  const verifiedWorkers = useMemo(
    () =>
      scopedWorkers.filter(
        (r) =>
          (r.verificationStatus || 'verified') === 'verified' &&
          !isWorkerPending(r)
      ),
    [scopedWorkers]
  )

  const urlTabParam = searchParams.get('tab') ?? initialTab
  const urlSearchParam = searchParams.get('search') ?? initialSearch

  const [activeTab, setActiveTab] = useState<WorkersTab>(() => {
    if (isWorkersTab(urlTabParam)) return urlTabParam
    if (canApprove && pendingWorkers.length > 0 && !urlSearchParam.trim()) {
      return 'approvals'
    }
    return 'directory'
  })

  const [searchQuery, setSearchQuery] = useState<string>(urlSearchParam)
  const [statusFilter, setStatusFilter] = useState<WorkerStatusFilter>('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [hallFilter, setHallFilter] = useState('all')

  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [emailPreselectedWorker, setEmailPreselectedWorker] =
    useState<WorkerRow | null>(null)

  const prevUrlTabRef = useRef<string | undefined>(urlTabParam)
  const prevUrlSearchRef = useRef(urlSearchParam)
  const tabRefs = useRef<Record<WorkersTab, HTMLButtonElement | null>>({
    directory: null,
    approvals: null,
    email: null,
  })

  useEffect(() => {
    const nextTab = searchParams.get('tab') ?? undefined
    if (nextTab !== prevUrlTabRef.current) {
      prevUrlTabRef.current = nextTab
      if (isWorkersTab(nextTab)) {
        setActiveTab(nextTab)
      }
    }

    const nextSearch = searchParams.get('search') ?? ''
    if (nextSearch !== prevUrlSearchRef.current) {
      prevUrlSearchRef.current = nextSearch
      setSearchQuery(nextSearch)
    }
  }, [searchParams])

  const updateUrlParams = useCallback(
    (updates: { tab?: WorkersTab; clearSearch?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (updates.tab) {
        params.set('tab', updates.tab)
      }
      if (updates.clearSearch) {
        params.delete('search')
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router, searchParams]
  )

  const handleTabChange = useCallback(
    (nextTab: WorkersTab) => {
      setActiveTab(nextTab)
      prevUrlTabRef.current = nextTab
      updateUrlParams({ tab: nextTab })
    },
    [updateUrlParams]
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value)
      if (!value && searchParams.get('search')) {
        prevUrlSearchRef.current = ''
        updateUrlParams({ clearSearch: true })
      }
    },
    [searchParams, updateUrlParams]
  )

  const handleResetFilters = useCallback(() => {
    setSearchQuery('')
    setStatusFilter('all')
    setTeamFilter('all')
    setHallFilter('all')
    if (searchParams.get('search')) {
      prevUrlSearchRef.current = ''
      updateUrlParams({ clearSearch: true })
    }
  }, [searchParams, updateUrlParams])

  const handleVerify = useCallback(
    async (
      worker: WorkerRow,
      decision: 'approve' | 'reject',
      reason?: string
    ): Promise<boolean> => {
      setProcessingId(worker._id)
      try {
        const res = await verifyWorkerMembership({
          workerId: worker._id,
          decision,
          reason,
        })

        if (res.ok) {
          const newStatus = decision === 'approve' ? 'verified' : 'rejected'
          const approverLabel = isPresident
            ? 'Fellowship President'
            : access?.titles?.[0] ||
              (session.role === 'admin'
                ? 'CSGB Executive'
                : `${session.leadingTeam || session.team} Team Lead`)

          setRows((prev) =>
            prev.map((r) =>
              r._id === worker._id
                ? {
                    ...r,
                    verificationStatus: newStatus,
                    verifiedBy: approverLabel,
                    verifiedAt: new Date().toISOString(),
                    memberships: Array.isArray(r.memberships)
                      ? r.memberships.map((m) =>
                          m.status === 'pending'
                            ? {
                                ...m,
                                status: newStatus,
                                decidedBy: approverLabel,
                                decidedAt: new Date().toISOString(),
                              }
                            : m
                        )
                      : r.memberships,
                  }
                : r
            )
          )

          toastSuccess(
            decision === 'approve'
              ? `${worker.fullName} approved as a verified member of ${worker.team || 'their team'}.`
              : `${worker.fullName} membership request declined.`
          )
          return true
        }

        toastError(res.error || 'Failed to update verification status.')
        return false
      } catch {
        toastError('An unexpected network error occurred.')
        return false
      } finally {
        setProcessingId(null)
      }
    },
    [access?.titles, isPresident, session.leadingTeam, session.role, session.team]
  )

  const handleToggleExco = useCallback(
    async (worker: WorkerRow, approved: boolean): Promise<boolean> => {
      setProcessingId(worker._id)
      try {
        const res = await toggleExcoApproval({
          workerId: worker._id,
          approved,
          role: worker.requestedRole || 'team_lead',
        })

        if (res.ok) {
          setRows((prev) =>
            prev.map((r) =>
              r._id === worker._id
                ? {
                    ...r,
                    isExcoApproved: approved,
                    role: approved ? r.requestedRole || 'team_lead' : undefined,
                  }
                : r
            )
          )
          toastSuccess(
            approved
              ? `Exco privileges approved for ${worker.fullName}.`
              : `Exco privileges revoked for ${worker.fullName}.`
          )
          return true
        }

        toastError(res.error || 'Failed to update Exco status.')
        return false
      } catch {
        toastError('An unexpected error occurred.')
        return false
      } finally {
        setProcessingId(null)
      }
    },
    []
  )

  const handleOffboardSuccess = useCallback(
    (workerId: string, policy: 'archive' | 'permanent') => {
      setRows((prev) =>
        policy === 'permanent'
          ? prev.filter((w) => w._id !== workerId)
          : prev.map((w) =>
              w._id === workerId
                ? { ...w, verificationStatus: 'rejected', status: 'archived' }
                : w
            )
      )
    },
    []
  )

  const handleOpenEmail = useCallback((worker: WorkerRow) => {
    setEmailPreselectedWorker(worker)
    setIsEmailDialogOpen(true)
  }, [])

  const scopeCaption = isPresident || isAdmin || isMedia
    ? 'Fellowship roster'
    : isHallRep
      ? `${session.hall || 'Hall'} roster`
      : `${session.leadingTeam || session.team || 'Team'} roster`

  const verifiedPercent =
    scopedWorkers.length > 0
      ? Math.round((verifiedWorkers.length / scopedWorkers.length) * 100)
      : 0

  const kpiItems: KpiStripItem[] = [
    {
      id: 'total',
      label: 'Total',
      value: formatCount(scopedWorkers.length),
      rawValue: scopedWorkers.length,
      caption: scopeCaption,
      icon: <Users aria-hidden="true" />,
      tone: 'primary',
      active: activeTab === 'directory' && statusFilter === 'all',
      onClick: () => {
        setStatusFilter('all')
        handleTabChange('directory')
      },
      ariaLabel: `Total workers: ${scopedWorkers.length}. View all workers in directory.`,
    },
    {
      id: 'verified',
      label: 'Verified',
      value: formatCount(verifiedWorkers.length),
      rawValue: verifiedWorkers.length,
      caption: `${verifiedPercent}% verified`,
      icon: <CheckCircle2 aria-hidden="true" />,
      tone: 'success',
      active: activeTab === 'directory' && statusFilter === 'verified',
      onClick: () => {
        setStatusFilter('verified')
        handleTabChange('directory')
      },
      ariaLabel: `Verified workers: ${verifiedWorkers.length}. Filter directory to verified workers.`,
    },
    {
      id: 'pending',
      label: 'Pending',
      value: formatCount(pendingWorkers.length),
      rawValue: pendingWorkers.length,
      caption:
        pendingWorkers.length > 0 ? 'Awaiting team review' : 'All caught up',
      icon: <Clock aria-hidden="true" />,
      tone: pendingWorkers.length > 0 ? 'warning' : 'neutral',
      active: activeTab === 'approvals',
      onClick: () => handleTabChange('approvals'),
      ariaLabel: `Pending workers: ${pendingWorkers.length}. Open approvals queue.`,
    },
  ]

  const tabs: Array<{
    id: WorkersTab
    label: string
    count?: number
    highlightPending?: boolean
  }> = [
    {
      id: 'directory',
      label: `Directory (${formatCount(scopedWorkers.length)})`,
    },
    {
      id: 'approvals',
      label: `Approvals (${formatCount(pendingWorkers.length)})`,
      count: pendingWorkers.length,
      highlightPending: pendingWorkers.length > 0,
    },
    {
      id: 'email',
      label: 'Email',
    },
  ]

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1
    }

    if (nextIndex !== null) {
      event.preventDefault()
      const nextTab = tabs[nextIndex].id
      handleTabChange(nextTab)
      tabRefs.current[nextTab]?.focus()
    }
  }

  const eyebrowDate = today || formatDate(lagosDate())

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrowDate}
        title="Workers"
        description="Directory, approvals, and team communications."
        secondaryActions={
          isPresident || isAdmin ? (
            <ExecutiveCsvImportDialog
              variant="outline"
              className="min-h-11 md:min-h-10"
            />
          ) : undefined
        }
        primaryAction={
          <Button
            type="button"
            onClick={() => handleTabChange('email')}
            className="min-h-11 md:min-h-10 font-semibold"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Email workers</span>
          </Button>
        }
      />

      <KpiStrip items={kpiItems} ariaLabel="Workforce summary" />

      {/* URL-backed Segmented Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Workers workspace sections"
          className="flex w-full overflow-x-auto rounded-[var(--radius-card)] bg-card p-1.5 shadow-sm sm:inline-flex sm:w-auto gap-1"
        >
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el
                }}
                type="button"
                role="tab"
                id={`workers-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`workers-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabChange(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={cn(
                  'inline-flex min-h-11 flex-1 sm:flex-initial items-center justify-center gap-2 whitespace-nowrap rounded-[calc(var(--radius-card)-4px)] px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : tab.highlightPending
                      ? 'bg-warning/20 text-warning-foreground dark:bg-warning/15 dark:text-warning hover:bg-warning/30'
                      : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground'
                )}
              >
                <span className="tabular-nums">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Tab Panel */}
      {activeTab === 'directory' && (
        <div
          role="tabpanel"
          id="workers-panel-directory"
          aria-labelledby="workers-tab-directory"
        >
          <WorkersDirectory
            scopedWorkers={scopedWorkers}
            session={session}
            teamOptions={teamOptions}
            hallOptions={halls}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            teamFilter={teamFilter}
            onTeamFilterChange={setTeamFilter}
            hallFilter={hallFilter}
            onHallFilterChange={setHallFilter}
            onResetFilters={handleResetFilters}
            canApprove={canApprove}
            canDelete={canDelete}
            processingId={processingId}
            onVerify={handleVerify}
            onOpenEmail={handleOpenEmail}
            onToggleExco={handleToggleExco}
            onOffboardSuccess={handleOffboardSuccess}
          />
        </div>
      )}

      {activeTab === 'approvals' && (
        <div
          role="tabpanel"
          id="workers-panel-approvals"
          aria-labelledby="workers-tab-approvals"
        >
          <WorkerApprovals
            pendingWorkers={pendingWorkers}
            canApprove={canApprove}
            processingId={processingId}
            onVerify={handleVerify}
            session={session}
            onSwitchToDirectory={() => handleTabChange('directory')}
          />
        </div>
      )}

      {activeTab === 'email' && (
        <div
          role="tabpanel"
          id="workers-panel-email"
          aria-labelledby="workers-tab-email"
        >
          <WorkerEmailPanel
            session={session}
            workers={scopedWorkers}
            teamOptions={teamOptions}
          />
        </div>
      )}

      {/* Direct Per-Worker Email Modal (opened from Directory row or drawer) */}
      <SendWorkerEmailDialog
        open={isEmailDialogOpen}
        onOpenChange={(open) => {
          setIsEmailDialogOpen(open)
          if (!open) setEmailPreselectedWorker(null)
        }}
        session={session}
        workers={scopedWorkers}
        teamOptions={teamOptions}
        preselectedWorker={emailPreselectedWorker}
      />
    </div>
  )
}
