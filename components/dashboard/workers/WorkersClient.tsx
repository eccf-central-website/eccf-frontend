'use client'

import * as React from 'react'
import { useState, useMemo, useTransition } from 'react'
import {
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Shield,
  Home,
  Briefcase,
  Eye,
  Users,
  Building,
  Loader2,
  Calendar,
  Download,
  Mail,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import type { WorkerRow, ECCFSession } from '@/types'
import type { WorkerAccess } from '@/lib/dashboard/access'
import SendWorkerEmailDialog from './SendWorkerEmailDialog'
import SendWorkerEmailCard from './SendWorkerEmailCard'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import type { TeamUnitOption } from '@/lib/dashboard/attendance-constants'
import { isMediaTeam, canDeleteWorkers } from '@/lib/dashboard/rbac'
import { verifyWorkerMembership, toggleExcoApproval, deleteApprovedWorkerAction } from '@/app/actions/worker-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function formatBirthday(dateStr?: string, monthNum?: number, dayNum?: number): string {
  if (monthNum && dayNum) {
    return `${MONTH_NAMES[monthNum - 1] || 'Month ' + monthNum} ${dayNum}`
  }
  if (!dateStr) return 'Not set'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const m = parseInt(parts[1], 10)
    const d = parseInt(parts[2], 10)
    if (!isNaN(m) && !isNaN(d) && m >= 1 && m <= 12) {
      return `${MONTH_NAMES[m - 1]} ${d}`
    }
  } else if (parts.length === 2) {
    const m = parseInt(parts[0], 10)
    const d = parseInt(parts[1], 10)
    if (!isNaN(m) && !isNaN(d) && m >= 1 && m <= 12) {
      return `${MONTH_NAMES[m - 1]} ${d}`
    }
  }
  return dateStr
}

function normalizeTeam(t?: string | null): string {
  if (!t) return ''
  return t
    .toLowerCase()
    .trim()
    .replace(/(?:\s+team)+$/i, '')
    .trim()
}

function matchesWorkerTeam(
  worker: { team?: string; teams?: string[] },
  targetTeamOrTeams: string | string[] | null | undefined
): boolean {
  if (!targetTeamOrTeams || targetTeamOrTeams === 'all') return true
  const targets = (Array.isArray(targetTeamOrTeams) ? targetTeamOrTeams : [targetTeamOrTeams])
    .flatMap((t) => (t ? t.split(',') : []))
    .map(normalizeTeam)
    .filter(Boolean)

  if (targets.length === 0) return true

  const workerTeams = [worker.team, ...(worker.teams || [])]
    .flatMap((t) => (t ? t.split(',') : []))
    .map(normalizeTeam)
    .filter(Boolean)

  return workerTeams.some((wt) =>
    targets.some((tgt) => wt === tgt || wt.includes(tgt) || tgt.includes(wt))
  )
}

interface WorkersClientProps {
  rows: WorkerRow[]
  session: ECCFSession & { access?: WorkerAccess }
  teamOptions: TeamUnitOption[]
  hallOptions?: string[]
}

type StatusFilter = 'all' | 'pending' | 'verified' | 'rejected'

const DEFAULT_HALLS = ['Hall 1', 'Hall 2', 'Hall 3', 'Hall 4', 'Hall 5', 'Hall 6', 'Hall 7', 'Hall 8']

export default function WorkersClient({ rows: initialRows, session, teamOptions, hallOptions }: WorkersClientProps) {
  const halls = hallOptions && hallOptions.length > 0 ? hallOptions : DEFAULT_HALLS
  const teamNames = teamOptions.map((option) => option.name)
  const [rows, setRows] = useState<WorkerRow[]>(initialRows)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [hallFilter, setHallFilter] = useState('all')
  const [activeWorkerDetail, setActiveWorkerDetail] = useState<WorkerRow | null>(null)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [emailPreselectedWorker, setEmailPreselectedWorker] = useState<WorkerRow | null>(null)
  const [, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const canDelete = useMemo(() => canDeleteWorkers(session), [session])
  const [workerToDelete, setWorkerToDelete] = useState<WorkerRow | null>(null)
  const [confirmDeleteName, setConfirmDeleteName] = useState('')
  const [deletePolicy, setDeletePolicy] = useState<'archive' | 'permanent'>('archive')
  const [deleteReason, setDeleteReason] = useState('Left the team / fellowship')
  const [isDeleting, setIsDeleting] = useState(false)

  const access = session.access
  const isPresident = Boolean(access?.isPresident)
  const leadsTeamIds = useMemo(() => access?.leadsTeamIds || [], [access?.leadsTeamIds])
  const leadsTeamKeys = useMemo(() => access?.leadsTeamKeys || [], [access?.leadsTeamKeys])
  const isTeamLead = session.role === 'team_lead'
  const isLeadOrAssistant = leadsTeamIds.length > 0 || leadsTeamKeys.length > 0 || isTeamLead
  const isAdmin = session.role === 'admin'
  const isHallRep = session.role === 'hall_rep'
  const isMedia = isMediaTeam(session)

  // Operational team target for non-media team leads: strictly session.leadingTeam || session.team || leadsTeamKeys[0]
  const targetLeaderTeam = useMemo(() => {
    if ((!isLeadOrAssistant) || isMedia) return null
    return (session.leadingTeam || session.team || leadsTeamKeys[0] || '').trim() || null
  }, [isLeadOrAssistant, isMedia, session.leadingTeam, session.team, leadsTeamKeys])

  // Scope workers: President, CSGB Admin, and Media see all.
  // Team Leads and Assistant Leads are scoped to their operational teams (leadsTeamIds, leadsTeamKeys, or targetLeaderTeam).
  const scopedWorkers = useMemo(() => {
    if (isPresident || isAdmin || isMedia) return rows
    if (isLeadOrAssistant) {
      return rows.filter((r) => {
        // Structured memberships check
        if (Array.isArray(r.memberships) && r.memberships.length > 0) {
          const hasMatch = r.memberships.some(
            (m) =>
              (m.teamId && leadsTeamIds.includes(m.teamId)) ||
              (m.teamKey && leadsTeamKeys.includes(m.teamKey)) ||
              (targetLeaderTeam && matchesWorkerTeam(r, targetLeaderTeam))
          )
          if (hasMatch) return true
        }
        // Fallback to legacy team match
        if (targetLeaderTeam) {
          return matchesWorkerTeam(r, targetLeaderTeam)
        }
        return false
      })
    }
    return rows
  }, [rows, isPresident, isAdmin, isMedia, isLeadOrAssistant, leadsTeamIds, leadsTeamKeys, targetLeaderTeam])

  // Helper to determine if worker has any pending membership or status
  const isWorkerPending = (w: WorkerRow) => {
    if ((w.verificationStatus || 'verified') === 'pending') return true
    if (Array.isArray(w.memberships) && w.memberships.some((m) => m.status === 'pending')) {
      return true
    }
    return false
  }

  // Summary counts
  const pendingWorkers = useMemo(
    () => scopedWorkers.filter((r) => isWorkerPending(r)),
    [scopedWorkers]
  )
  const verifiedWorkers = useMemo(
    () => scopedWorkers.filter((r) => (r.verificationStatus || 'verified') === 'verified' && !isWorkerPending(r)),
    [scopedWorkers]
  )
  const rejectedWorkers = useMemo(
    () => scopedWorkers.filter((r) => (r.verificationStatus || 'verified') === 'rejected' && !isWorkerPending(r)),
    [scopedWorkers]
  )

  // Filtered rows
  const filteredRows = useMemo(() => {
    return scopedWorkers.filter((row) => {
      // Status filter
      if (statusFilter !== 'all') {
        const rowStatus = row.verificationStatus || 'verified'
        if (rowStatus !== statusFilter) return false
      }

      // Team filter (admins & media can filter by team)
      if (teamFilter !== 'all') {
        if (!matchesWorkerTeam(row, teamFilter)) return false
      }

      // Hall filter
      if (hallFilter !== 'all' && row.hall !== hallFilter) {
        return false
      }

      // Search query (name, hall, team)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = row.fullName.toLowerCase().includes(q)
        const matchHall = (row.hall || '').toLowerCase().includes(q)
        const matchTeam = (row.team || '').toLowerCase().includes(q)
        const matchSecondary = row.teams?.some((t) => t.toLowerCase().includes(q))
        if (!matchName && !matchHall && !matchTeam && !matchSecondary) return false
      }

      return true
    })
  }, [scopedWorkers, statusFilter, teamFilter, hallFilter, searchQuery])

  // Handle Team Lead / Admin verification action
  function handleVerification(worker: WorkerRow, decision: 'approve' | 'reject') {
    setProcessingId(worker._id)
    startTransition(async () => {
      try {
        const res = await verifyWorkerMembership({
          workerId: worker._id,
          decision,
        })

        if (res.ok) {
          const newStatus = decision === 'approve' ? 'verified' : 'rejected'
          setRows((prev) =>
            prev.map((r) =>
              r._id === worker._id
                ? {
                    ...r,
                    verificationStatus: newStatus,
                    verifiedBy: isPresident
                      ? 'Fellowship President'
                      : access?.titles?.[0] ||
                        (session.role === 'admin'
                          ? 'CSGB Admin'
                          : `${session.leadingTeam || session.team} Team Lead`),
                    verifiedAt: new Date().toISOString(),
                  }
                : r
            )
          )

          toastSuccess(
            decision === 'approve'
              ? `${worker.fullName} approved as verified member of ${worker.team}!`
              : `${worker.fullName} membership declined.`
          )
        } else {
          toastError(res.error || 'Failed to update verification status.')
        }
      } catch {
        toastError('An unexpected network error occurred.')
      } finally {
        setProcessingId(null)
      }
    })
  }

  // Handle Worker Deletion / Offboarding (CSGB & Chaplains only)
  function handleDeleteWorker() {
    if (!workerToDelete) return
    if (confirmDeleteName.trim().toLowerCase() !== workerToDelete.fullName.trim().toLowerCase()) {
      toastError('Please type the exact worker name to confirm deletion.')
      return
    }

    setIsDeleting(true)
    startTransition(async () => {
      try {
        const res = await deleteApprovedWorkerAction({
          workerId: workerToDelete._id,
          confirmedName: confirmDeleteName,
          policy: deletePolicy,
          reason: deleteReason.trim() || 'Worker left the fellowship team',
        })

        if (res.ok) {
          setRows((prev) =>
            deletePolicy === 'permanent'
              ? prev.filter((w) => w._id !== workerToDelete._id)
              : prev.map((w) => (w._id === workerToDelete._id ? { ...w, verificationStatus: 'rejected' } : w))
          )
          if (activeWorkerDetail?._id === workerToDelete._id) {
            setActiveWorkerDetail(null)
          }
          setWorkerToDelete(null)
          setConfirmDeleteName('')
          setDeleteReason('Left the team / fellowship')
          toastSuccess(
            deletePolicy === 'permanent'
              ? `${workerToDelete.fullName} has been permanently deleted.`
              : `${workerToDelete.fullName} has been archived and offboarded.`
          )
        } else {
          toastError(res.error || 'Failed to delete worker profile.')
        }
      } catch {
        toastError('An unexpected network error occurred while deleting worker.')
      } finally {
        setIsDeleting(false)
      }
    })
  }

  // Handle Exco Approval toggle (Admins only)
  function handleExcoToggle(worker: WorkerRow, approved: boolean) {
    setProcessingId(worker._id)
    startTransition(async () => {
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
                ? { ...r, isExcoApproved: approved, role: approved ? (r.requestedRole || 'team_lead') : undefined }
                : r
            )
          )
          toastSuccess(
            approved
              ? `Exco privileges approved for ${worker.fullName}!`
              : `Exco privileges revoked for ${worker.fullName}.`
          )
        } else {
          toastError(res.error || 'Failed to update Exco status.')
        }
      } catch {
        toastError('An unexpected error occurred.')
      } finally {
        setProcessingId(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* SECTION HEADER                                                       */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
              {isPresident
                ? 'Presidential Workforce CRM'
                : isAdmin
                ? 'Central Workforce CRM'
                : isMedia
                ? 'Media & Celebrations Directory'
                : isHallRep
                ? `${session.hall || 'Hall'} Workers Roster`
                : `${session.leadingTeam || session.team || leadsTeamKeys[0] || 'Ministry'} Team Roster`}
            </span>
            {pendingWorkers.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse">
                <Clock className="h-3 w-3 shrink-0" />
                {pendingWorkers.length} Pending
              </span>
            )}
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
            Workers
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Directory, approvals, and team communications.
          </p>
        </div>

        {/* Quick Actions & Unified KPI Strip */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => {
              setEmailPreselectedWorker(null)
              setIsEmailDialogOpen(true)
            }}
            className="min-h-[44px] px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm shadow-xs"
          >
            <Mail className="h-4 w-4 shrink-0 mr-2" />
            Email Workers
          </Button>

          <div className="inline-flex items-center divide-x divide-border/20 rounded-xl bg-card shadow-sm border-0 px-3 py-1.5">
            <div className="px-3 text-center">
              <span className="block text-[11px] font-medium uppercase text-muted-foreground">Total</span>
              <span className="font-sans font-bold text-base text-foreground">{scopedWorkers.length}</span>
            </div>
            <div className="px-3 text-center">
              <span className="block text-[11px] font-medium uppercase text-emerald-600 dark:text-emerald-400">Verified</span>
              <span className="font-sans font-bold text-base text-foreground">{verifiedWorkers.length}</span>
            </div>
            {pendingWorkers.length > 0 && (
              <div className="px-3 text-center">
                <span className="block text-[11px] font-medium uppercase text-amber-600 dark:text-amber-400">Pending</span>
                <span className="font-sans font-bold text-base text-amber-600 dark:text-amber-400">{pendingWorkers.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* WORKFORCE EMAIL DISPATCH INPUT BOX                                   */}
      {/* ==================================================================== */}
      <SendWorkerEmailCard
        session={session}
        workers={scopedWorkers}
        teamOptions={teamOptions}
        defaultExpanded={false}
      />

      {/* ==================================================================== */}
      {/* PENDING APPROVALS ALERT CAROUSEL / CALLOUT BANNER                    */}
      {/* ==================================================================== */}
      {pendingWorkers.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-card shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                <Clock className="h-4 w-4 shrink-0" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-foreground">
                  {isTeamLead && !isMedia
                    ? `${pendingWorkers.length} Membership Request${pendingWorkers.length > 1 ? 's' : ''} Awaiting Your Approval`
                    : isHallRep
                    ? `${pendingWorkers.length} Pending Worker Registration${pendingWorkers.length > 1 ? 's' : ''} in ${session.hall || 'Your Hall'}`
                    : `${pendingWorkers.length} Worker Registration${pendingWorkers.length > 1 ? 's' : ''} Pending Departmental Approval`}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {isTeamLead && !isMedia
                    ? `Review applicants who requested to join ${session.leadingTeam || session.team}. Once you accept them, they become verified members.`
                    : 'Confirm genuine workers so they can be marked present during services and inducted into fellowship care.'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('pending')}
              className="hidden sm:inline-flex text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              Filter Pending Only
            </Button>
          </div>

          {/* Pending Worker Quick Action Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {pendingWorkers.slice(0, 6).map((worker) => {
              const isBusy = processingId === worker._id
              const canApprove = isPresident || isAdmin || (isLeadOrAssistant && !isMedia)

              return (
                <div
                  key={worker._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-card shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-serif font-bold text-sm overflow-hidden">
                      {worker.profileImageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={worker.profileImageUrl}
                          alt={worker.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        worker.fullName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{worker.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {worker.hall || 'No Hall'} • {worker.team}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {canApprove ? (
                      <>
                        <Button
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleVerification(worker, 'approve')}
                          className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                        >
                          {isBusy ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <UserCheck className="h-3.5 w-3.5 shrink-0 mr-1" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() => handleVerification(worker, 'reject')}
                          className="h-8 px-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 text-xs"
                        >
                          <UserX className="h-3.5 w-3.5 shrink-0" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveWorkerDetail(worker)}
                        className="h-8 px-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent text-xs font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0 mr-1" /> View
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* FILTER & SEARCH BAR                                                  */}
      {/* ==================================================================== */}
      <div className="p-4 rounded-2xl bg-card shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by worker name, hall, or operational team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-muted/40 border-input focus:bg-background text-sm text-foreground"
            />
          </div>

          {/* Hall Filter (hidden for Hall Reps whose view is locked to their assigned hall) */}
          {isHallRep ? (
            <div className="flex items-center gap-1.5 h-11 px-3.5 rounded-xl bg-primary/10 text-primary text-xs font-bold shrink-0">
              <Building className="h-4 w-4 shrink-0 text-primary" />
              <span>{session.hall || 'Assigned Hall'}</span>
            </div>
          ) : (
            <div className="w-full md:w-44">
              <Select value={hallFilter} onValueChange={setHallFilter}>
                <SelectTrigger className="h-11 rounded-xl border-input bg-background/50 text-sm">
                  <SelectValue placeholder="All Halls" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Halls</SelectItem>
                  {halls.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Team Filter (Admins & Media Team see all teams) */}
          {(isAdmin || isMedia) && (
            <div className="w-full md:w-56">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="h-11 rounded-xl border-input bg-background/50 text-sm">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operational Teams</SelectItem>
                  {teamNames.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fixed Team Badge for Unit Leaders */}
          {isTeamLead && !isMedia && (
            <div className="flex items-center gap-1.5 h-11 px-3.5 rounded-xl bg-muted/40 text-foreground text-xs font-bold shrink-0">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              <span>{session.leadingTeam || session.team}</span>
            </div>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-mono font-bold text-muted-foreground uppercase mr-1">Status:</span>
          {[
            { id: 'all', label: `All (${scopedWorkers.length})` },
            { id: 'verified', label: `Verified (${verifiedWorkers.length})` },
            { id: 'pending', label: `Pending Review (${pendingWorkers.length})`, alert: pendingWorkers.length > 0 },
            { id: 'rejected', label: `Declined (${rejectedWorkers.length})` },
          ].map((tab) => {
            const isActive = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as StatusFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : tab.alert
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* WORKERS TABLE                                                        */}
      {/* ==================================================================== */}
      {/* Mobile: Compact worker rows */}
      <div className="md:hidden rounded-2xl bg-card shadow-sm divide-y-0 space-y-2 overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Users className="h-8 w-8 text-muted-foreground/50 stroke-1 shrink-0" />
            <p className="font-semibold text-sm">No workers found matching your filter criteria.</p>
            <p className="text-xs text-muted-foreground/70">Try clearing search keywords or switching status tabs.</p>
          </div>
        ) : (
          filteredRows.map((worker) => {
            const status = isWorkerPending(worker) ? 'pending' : worker.verificationStatus || 'verified'
            return (
              <button
                key={worker._id}
                type="button"
                onClick={() => setActiveWorkerDetail(worker)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors focus:outline-none focus:bg-muted/40 min-h-[52px]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground font-semibold text-xs overflow-hidden">
                    {worker.profileImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={worker.profileImageUrl} alt={worker.fullName} className="h-full w-full object-cover" />
                    ) : (
                      worker.fullName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="font-semibold text-sm text-foreground truncate">{worker.fullName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {status === 'verified' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Verified
                    </span>
                  )}
                  {status === 'pending' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Pending
                    </span>
                  )}
                  {status === 'rejected' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      Declined
                    </span>
                  )}
                  <Eye className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Desktop: Compact Table */}
      <div className="hidden md:block rounded-2xl bg-card shadow-sm overflow-hidden">
        <Table aria-label="Workers records">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-mono text-xs font-bold uppercase text-muted-foreground">Worker</TableHead>
              <TableHead className="font-mono text-xs font-bold uppercase text-muted-foreground">Status</TableHead>
              <TableHead className="font-mono text-xs font-bold uppercase text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8 shrink-0 text-muted-foreground/50 stroke-1" />
                    <p className="font-semibold text-sm">No workers found matching your filter criteria.</p>
                    <p className="text-xs text-muted-foreground/70">Try clearing search keywords or switching status tabs.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((worker) => {
                const status = isWorkerPending(worker) ? 'pending' : worker.verificationStatus || 'verified'
                const isBusy = processingId === worker._id

                return (
                  <TableRow
                    key={worker._id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setActiveWorkerDetail(worker)}
                  >
                    {/* Member Name + Photo */}
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground font-semibold text-xs overflow-hidden">
                          {worker.profileImageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={worker.profileImageUrl}
                              alt={worker.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            worker.fullName.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <span className="font-semibold text-sm text-foreground">{worker.fullName}</span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-2.5">
                      {status === 'verified' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          Verified
                        </span>
                      )}
                      {status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                          Pending Review
                        </span>
                      )}
                      {status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <XCircle className="h-3 w-3 text-rose-500 shrink-0" />
                          Declined
                        </span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveWorkerDetail(worker)}
                          className="h-8 px-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground text-xs font-semibold"
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0 mr-1" /> View Details
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEmailPreselectedWorker(worker)
                            setIsEmailDialogOpen(true)
                          }}
                          title={`Send email to ${worker.fullName}`}
                          className="h-8 px-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 text-xs font-semibold"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0 mr-1" /> Email
                        </Button>

                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setWorkerToDelete(worker)
                              setConfirmDeleteName('')
                              setDeletePolicy('archive')
                              setDeleteReason('Left the team / fellowship')
                            }}
                            title={`Delete worker profile (${worker.fullName})`}
                            className="h-8 px-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs font-semibold"
                          >
                            <Trash2 className="h-3.5 w-3.5 shrink-0 text-destructive mr-1" /> Delete
                          </Button>
                        )}

                        {(status === 'pending' || isWorkerPending(worker)) && (isPresident || isAdmin || (isLeadOrAssistant && !isMedia)) && (
                          <>
                            <Button
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleVerification(worker, 'approve')}
                              className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                            >
                              {isBusy ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <UserCheck className="h-3.5 w-3.5 shrink-0 mr-1" />}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => handleVerification(worker, 'reject')}
                              className="h-8 px-2.5 rounded-lg text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 text-xs font-bold"
                            >
                              Decline
                            </Button>
                          </>
                        )}

                        {isAdmin && worker.requestedRole && !worker.isExcoApproved && (
                          <Button
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleExcoToggle(worker, true)}
                            className="h-8 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0 mr-1" /> Grant Exco
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ==================================================================== */}
      {/* WORKER DETAIL MODAL                                                  */}
      {/* ==================================================================== */}
      <Dialog open={!!activeWorkerDetail} onOpenChange={(open) => !open && setActiveWorkerDetail(null)}>
        <DialogContent className="flex sm:max-w-lg max-h-[92vh] flex-col gap-0 overflow-hidden rounded-3xl border-0 shadow-2xl p-0 bg-card text-card-foreground">
          {activeWorkerDetail && (
            <>
              {/* Luxury Ambient Header */}
              <div className="relative overflow-hidden bg-gradient-to-b from-primary/15 via-primary/5 to-card p-6 pb-5 border-b border-border/10">
                {/* Radial Glow */}
                <div
                  aria-hidden="true"
                  className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-primary/20 blur-3xl pointer-events-none"
                />

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                  {/* Portrait */}
                  <div className="relative shrink-0">
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden ring-4 ring-card bg-muted shadow-xl flex items-center justify-center">
                      {activeWorkerDetail.profileImageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={activeWorkerDetail.profileImageUrl}
                          alt={activeWorkerDetail.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-serif font-black text-2xl text-primary">
                          {activeWorkerDetail.fullName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {(activeWorkerDetail.verificationStatus || 'verified') === 'verified' && (
                      <div
                        className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-card shadow-sm"
                        title="Verified Worker"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Identity Information */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Worker Profile
                      </span>
                    </div>

                    <DialogTitle asChild>
                      <h3 className="font-serif text-xl sm:text-2xl font-black text-foreground tracking-tight break-words leading-tight">
                        {activeWorkerDetail.fullName}
                      </h3>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      Verified fellowship records and profile details for {activeWorkerDetail.fullName}.
                    </DialogDescription>

                    {activeWorkerDetail.excoPosition && (
                      <p className="text-xs sm:text-sm font-semibold text-primary flex items-center justify-center sm:justify-start gap-1.5">
                        <Shield className="h-3.5 w-3.5 shrink-0" />
                        <span>{activeWorkerDetail.excoPosition}</span>
                      </p>
                    )}

                    {/* Quick Meta Badges */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background/80 text-[11px] font-medium text-foreground border border-border/30 shadow-2xs">
                        <Home className="h-3 w-3 text-muted-foreground" />
                        <span>{activeWorkerDetail.hall || 'No Hall'}</span>
                      </span>

                      {(activeWorkerDetail.verificationStatus || 'verified') === 'verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="h-3 w-3" />
                          <span>Pending Approval</span>
                        </span>
                      )}

                      {activeWorkerDetail.profileImageUrl && (
                        <a
                          href={activeWorkerDetail.profileImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-[11px] font-semibold text-primary border border-primary/20 transition-colors"
                        >
                          <Download className="h-3 w-3" />
                          <span>Photo</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4">
                {/* 2-Column Core Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Birthday Card */}
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/10 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Birthday
                      </span>
                    </div>
                    <p className="font-sans font-bold text-base text-foreground pl-0.5">
                      {formatBirthday(activeWorkerDetail.birthDate, activeWorkerDetail.birthMonth, activeWorkerDetail.birthDay)}
                    </p>
                    <p className="text-[11px] text-muted-foreground pl-0.5">
                      Media flyer &amp; welfare care
                    </p>
                  </div>

                  {/* Primary Assignment Card */}
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/10 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Briefcase className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Primary Assignment
                      </span>
                    </div>
                    <p className="font-sans font-bold text-base text-foreground pl-0.5 truncate">
                      {activeWorkerDetail.leadingTeam
                        ? `${activeWorkerDetail.leadingTeam} (Lead)`
                        : activeWorkerDetail.team || 'Unassigned'}
                    </p>
                    <p className="text-[11px] text-muted-foreground pl-0.5">
                      Operational roster unit
                    </p>
                  </div>
                </div>

                {/* Assigned Operational Teams */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/10 space-y-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    All Assigned Teams &amp; Departments
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeWorkerDetail.teams && activeWorkerDetail.teams.length > 0
                      ? activeWorkerDetail.teams
                      : [activeWorkerDetail.team]
                    ).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-semibold border border-primary/15"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Verification Delta History */}
                {(activeWorkerDetail.verifiedBy || activeWorkerDetail.verifiedAt) && (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 border border-border/10 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate">
                        Verified by <strong className="text-foreground">{activeWorkerDetail.verifiedBy || 'Executive Desk'}</strong>
                      </span>
                    </div>
                    {activeWorkerDetail.verifiedAt && (
                      <span className="text-muted-foreground font-mono text-[11px] shrink-0 pl-2">
                        {new Date(activeWorkerDetail.verifiedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                )}

                {/* Audit Delta History */}
                {activeWorkerDetail.updateLog && activeWorkerDetail.updateLog.length > 0 && (
                  <div className="p-4 rounded-2xl bg-muted/20 border border-border/10 space-y-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Audit Trail &amp; Delta Log
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {activeWorkerDetail.updateLog.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span className="leading-relaxed">{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dialog Footer Actions */}
              <div className="p-4 px-6 bg-muted/20 border-t border-border/10 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmailPreselectedWorker(activeWorkerDetail)
                    setActiveWorkerDetail(null)
                    setIsEmailDialogOpen(true)
                  }}
                  className="min-h-[44px] sm:min-h-[38px] px-4 rounded-xl text-xs font-semibold gap-2 border-border/50 hover:bg-muted"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  <span>Email Worker</span>
                </Button>

                  {canDelete && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setWorkerToDelete(activeWorkerDetail)
                        setConfirmDeleteName('')
                        setDeletePolicy('archive')
                        setDeleteReason('Left the team / fellowship')
                      }}
                      className="min-h-[44px] sm:min-h-[38px] px-4 rounded-xl text-xs font-semibold gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Profile</span>
                    </Button>
                  )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveWorkerDetail(null)}
                  className="min-h-[44px] sm:min-h-[38px] px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Email to Workers Dialog */}
      {/* ==================================================================== */}
      {/* DELETE / OFFBOARD WORKER CONFIRMATION DIALOG                        */}
      {/* ==================================================================== */}
      <Dialog
        open={!!workerToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setWorkerToDelete(null)
            setConfirmDeleteName('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl p-6 bg-card text-card-foreground">
          {workerToDelete && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                  <Trash2 className="h-6 w-6 shrink-0" />
                </div>
                <div>
                  <DialogTitle className="font-serif text-lg font-bold text-foreground">
                    Offboard &amp; Delete Worker
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Authorized for Christian Student Governing Board and Chaplains when a worker leaves the team.
                  </DialogDescription>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs space-y-1">
                <p className="font-semibold text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Target Worker: {workerToDelete.fullName}</span>
                </p>
                <p className="text-muted-foreground">
                  Current assignment: <strong className="text-foreground">{workerToDelete.team || 'Unassigned'}</strong> • {workerToDelete.hall || 'No Hall'}
                </p>
              </div>

              {/* Policy Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Deletion Policy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeletePolicy('archive')}
                    className={`p-3 rounded-xl text-left border transition-all text-xs ${
                      deletePolicy === 'archive'
                        ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-2xs'
                        : 'border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div className="font-bold text-foreground">Archive Record</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Revoke access, keep logs</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletePolicy('permanent')}
                    className={`p-3 rounded-xl text-left border transition-all text-xs ${
                      deletePolicy === 'permanent'
                        ? 'border-destructive bg-destructive/10 text-destructive font-semibold shadow-2xs'
                        : 'border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div className="font-bold text-destructive">Permanent Delete</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Wipe profile &amp; credentials</div>
                  </button>
                </div>
              </div>

              {/* Reason for departure */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Reason for departure</label>
                <Input
                  type="text"
                  placeholder="e.g. Left fellowship team, graduated, relocated"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              {/* Name Confirmation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Type <span className="font-mono font-bold text-destructive select-all">{workerToDelete.fullName}</span> to confirm
                </label>
                <Input
                  type="text"
                  placeholder="Enter worker's exact name"
                  value={confirmDeleteName}
                  onChange={(e) => setConfirmDeleteName(e.target.value)}
                  className="h-10 text-xs rounded-xl border-destructive/40 focus-visible:ring-destructive"
                />
              </div>

              {/* Dialog Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setWorkerToDelete(null)
                    setConfirmDeleteName('')
                  }}
                  disabled={isDeleting}
                  className="h-9 px-4 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteWorker}
                  disabled={
                    isDeleting ||
                    confirmDeleteName.trim().toLowerCase() !== workerToDelete.fullName.trim().toLowerCase()
                  }
                  className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 shadow-xs"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Confirm {deletePolicy === 'permanent' ? 'Permanent Deletion' : 'Archiving'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SendWorkerEmailDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        session={session}
        workers={scopedWorkers}
        teamOptions={teamOptions}
        preselectedWorker={emailPreselectedWorker}
      />
    </div>
  )
}
