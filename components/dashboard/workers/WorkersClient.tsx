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
  Eye,
  Sparkles,
  Users,
  Building,
  Loader2,
} from 'lucide-react'
import type { WorkerRow, ECCFSession } from '@/types'
import { Badge } from '@/components/dashboard/ui/badge'
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
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { FELLOWSHIP_TEAMS } from '@/lib/dashboard/attendance-constants'
import { verifyWorkerMembership, toggleExcoApproval } from '@/app/actions/worker-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'

interface WorkersClientProps {
  rows: WorkerRow[]
  session: ECCFSession
}

type StatusFilter = 'all' | 'pending' | 'verified' | 'rejected'

export default function WorkersClient({ rows: initialRows, session }: WorkersClientProps) {
  const [rows, setRows] = useState<WorkerRow[]>(initialRows)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [hallFilter, setHallFilter] = useState('all')
  const [activeWorkerDetail, setActiveWorkerDetail] = useState<WorkerRow | null>(null)
  const [, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const isTeamLead = session.role === 'team_lead'
  const isAdmin = session.role === 'admin'

  // Summary counts
  const pendingWorkers = useMemo(
    () => rows.filter((r) => r.verificationStatus === 'pending'),
    [rows]
  )
  const verifiedWorkers = useMemo(
    () => rows.filter((r) => r.verificationStatus === 'verified'),
    [rows]
  )
  const rejectedWorkers = useMemo(
    () => rows.filter((r) => r.verificationStatus === 'rejected'),
    [rows]
  )

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Status filter
      if (statusFilter !== 'all') {
        const rowStatus = row.verificationStatus || 'verified'
        if (rowStatus !== statusFilter) return false
      }

      // Team filter (admins can filter by team)
      if (teamFilter !== 'all') {
        const matchesPrimary = row.team?.toLowerCase() === teamFilter.toLowerCase()
        const matchesSecondary = row.teams?.some(
          (t) => t.toLowerCase() === teamFilter.toLowerCase()
        )
        if (!matchesPrimary && !matchesSecondary) return false
      }

      // Hall filter
      if (hallFilter !== 'all' && row.hall !== hallFilter) {
        return false
      }

      // Search query (name, hall, team)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = row.fullName.toLowerCase().includes(q)
        const matchHall = (row.hall || '').toLowerCase().includes(q)
        const matchTeam = (row.team || '').toLowerCase().includes(q)
        const matchSecondary = row.teams?.some((t) => t.toLowerCase().includes(q))
        if (!matchName && !matchHall && !matchTeam && !matchSecondary) return false
      }

      return true
    })
  }, [rows, statusFilter, teamFilter, hallFilter, searchQuery])

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
                    verifiedBy:
                      session.role === 'admin'
                        ? 'CSGB Admin'
                        : `${session.team} Team Lead`,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0077cc]">
              {isTeamLead ? `${session.team} Team Roster` : 'Central Workforce CRM'}
            </span>
            {pendingWorkers.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                <Clock className="h-3 w-3" />
                {pendingWorkers.length} Pending
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
            {isTeamLead ? `${session.team} Members` : 'Workforce & Leadership Roster'}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {isTeamLead
              ? `Approve or review newly registered members in ${session.team}. Only verified members appear on your attendance sheets and ministerial ledgers.`
              : 'Govern all ~250 fellowship workers across all 14 operational teams. Approve departmental rosters and grant Exco dashboard credentials.'}
          </p>
        </div>

        {/* Quick Stats Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
            <span className="block text-xs font-mono uppercase text-slate-500 font-bold">Total</span>
            <span className="font-serif font-black text-lg text-slate-900">{rows.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs text-center">
            <span className="block text-xs font-mono uppercase text-emerald-700 font-bold">Verified</span>
            <span className="font-serif font-black text-lg text-emerald-800">{verifiedWorkers.length}</span>
          </div>
          {pendingWorkers.length > 0 && (
            <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 shadow-xs text-center">
              <span className="block text-xs font-mono uppercase text-amber-700 font-bold">Pending</span>
              <span className="font-serif font-black text-lg text-amber-800">{pendingWorkers.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PENDING APPROVALS ALERT CAROUSEL / CALLOUT BANNER                    */}
      {/* ==================================================================== */}
      {pendingWorkers.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-50/80 to-white border-2 border-amber-300 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-200 text-amber-900 font-bold">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-amber-950">
                  {isTeamLead
                    ? `${pendingWorkers.length} Membership Request${pendingWorkers.length > 1 ? 's' : ''} Awaiting Your Approval`
                    : `${pendingWorkers.length} Worker Registration${pendingWorkers.length > 1 ? 's' : ''} Pending Departmental Approval`}
                </h3>
                <p className="text-xs text-amber-800 font-medium">
                  Confirm genuine workers so they can be marked present during services and inducted into fellowship care.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('pending')}
              className="hidden sm:inline-flex text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              Filter Pending Only
            </Button>
          </div>

          {/* Pending Worker Quick Action Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {pendingWorkers.slice(0, 6).map((worker) => {
              const isBusy = processingId === worker._id
              return (
                <div
                  key={worker._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-200 shadow-xs hover:border-amber-400 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-serif font-bold text-sm">
                      {worker.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{worker.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {worker.hall || 'No Hall'} • {worker.team}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleVerification(worker, 'approve')}
                      className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                    >
                      {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5 mr-1" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isBusy}
                      onClick={() => handleVerification(worker, 'reject')}
                      className="h-8 px-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
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
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by worker name, hall, or operational team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white text-sm"
            />
          </div>

          {/* Hall Filter */}
          <div className="w-full md:w-44">
            <Select value={hallFilter} onValueChange={setHallFilter}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm">
                <SelectValue placeholder="All Halls" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Halls</SelectItem>
                {['Hall 1', 'Hall 2', 'Hall 3', 'Hall 4', 'Hall 5', 'Hall 6', 'Hall 7', 'Hall 8'].map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Filter (Admins Only) */}
          {isAdmin && (
            <div className="w-full md:w-56">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operational Teams</SelectItem>
                  {FELLOWSHIP_TEAMS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase mr-1">Status:</span>
          {[
            { id: 'all', label: `All (${rows.length})` },
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
                    ? 'bg-[#0077cc] text-white shadow-xs'
                    : tab.alert
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="font-mono text-xs font-bold uppercase text-slate-600">Member</TableHead>
              <TableHead className="font-mono text-xs font-bold uppercase text-slate-600">Team(s)</TableHead>
              <TableHead className="font-mono text-xs font-bold uppercase text-slate-600">Residence</TableHead>
              <TableHead className="font-mono text-xs font-bold uppercase text-slate-600">Status</TableHead>
              <TableHead className="font-mono text-xs font-bold uppercase text-slate-600 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                    <Users className="h-8 w-8 text-slate-400 stroke-1" />
                    <p className="font-semibold text-sm">No workers found matching your filter criteria.</p>
                    <p className="text-xs text-slate-400">Try clearing search keywords or switching status tabs.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((worker) => {
                const status = worker.verificationStatus || 'verified'
                const isBusy = processingId === worker._id
                const allTeams = worker.teams && worker.teams.length > 0 ? worker.teams : [worker.team]

                return (
                  <TableRow key={worker._id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Member Name + Photo */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-serif font-bold text-sm overflow-hidden">
                          {worker.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-950">{worker.fullName}</span>
                            {worker.role && worker.role !== 'team_lead' && (
                              <Badge variant="outline" className="text-[10px] uppercase font-mono bg-sky-50 text-sky-700 border-sky-300">
                                {worker.role}
                              </Badge>
                            )}
                          </div>
                          {worker.excoPosition && (
                            <p className="text-xs font-semibold text-[#0077cc]">{worker.excoPosition}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Operational Teams */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {allTeams.map((t, idx) => (
                          <span
                            key={t + idx}
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                              t === worker.leadingTeam
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {t === worker.leadingTeam && <Sparkles className="h-2.5 w-2.5 mr-1 text-amber-600" />}
                            {t}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    {/* Hall */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        <span>{worker.hall || 'Not set'}</span>
                      </div>
                    </TableCell>

                    {/* Verification Status */}
                    <TableCell>
                      {status === 'verified' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Verified
                        </span>
                      )}
                      {status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          Pending Review
                        </span>
                      )}
                      {status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          Declined
                        </span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If Pending: Show 1-Tap Approve/Decline */}
                        {status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleVerification(worker, 'approve')}
                              className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                            >
                              {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5 mr-1" />}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => handleVerification(worker, 'reject')}
                              className="h-8 px-2.5 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-bold"
                            >
                              Decline
                            </Button>
                          </>
                        )}

                        {/* If Verified: Quick link to view profile or change status */}
                        {status === 'verified' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveWorkerDetail(worker)}
                            className="h-8 px-2.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View Profile
                          </Button>
                        )}

                        {/* Admin Exco Approval Switch */}
                        {isAdmin && worker.requestedRole && !worker.isExcoApproved && (
                          <Button
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleExcoToggle(worker, true)}
                            className="h-8 px-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Grant Exco
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
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-black text-slate-950">
              Worker Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Verified fellowship records &amp; audit delta history.
            </DialogDescription>
          </DialogHeader>

          {activeWorkerDetail && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-[#0077cc] font-serif font-black text-base">
                  {activeWorkerDetail.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-950">{activeWorkerDetail.fullName}</h4>
                  <p className="text-xs text-slate-500">
                    {activeWorkerDetail.hall || 'No Hall'} • {activeWorkerDetail.team}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">Operational Teams</span>
                  <span className="font-semibold text-slate-900">
                    {(activeWorkerDetail.teams && activeWorkerDetail.teams.length > 0
                      ? activeWorkerDetail.teams
                      : [activeWorkerDetail.team]
                    ).join(', ')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">Verification Status</span>
                  <span className="font-bold text-emerald-700 capitalize">
                    {activeWorkerDetail.verificationStatus || 'Verified'}
                  </span>
                </div>
              </div>

              {activeWorkerDetail.verifiedBy && (
                <div className="text-xs text-slate-500 flex items-center justify-between px-1">
                  <span>Verified by: <strong>{activeWorkerDetail.verifiedBy}</strong></span>
                  {activeWorkerDetail.verifiedAt && (
                    <span>{new Date(activeWorkerDetail.verifiedAt).toLocaleDateString()}</span>
                  )}
                </div>
              )}

              {/* Audit Delta History */}
              {activeWorkerDetail.updateLog && activeWorkerDetail.updateLog.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <h5 className="font-mono text-xs font-bold uppercase text-slate-400 mb-2">Audit History</h5>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {activeWorkerDetail.updateLog.map((log, idx) => (
                      <p key={idx} className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {log}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
