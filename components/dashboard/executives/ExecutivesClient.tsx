'use client'

import * as React from 'react'
import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import {
  Shield,
  ShieldCheck,
  Building,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Crown,
  Loader2,
} from 'lucide-react'
import type { ExecutiveRow } from '@/types'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Badge } from '@/components/dashboard/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'
import ExecutiveCsvImportDialog from '@/components/dashboard/workers/ExecutiveCsvImportDialog'
import { relieveExecutivePosition } from '@/app/actions/executive-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'
import { cn } from '@/lib/utils'

interface ExecutivesClientProps {
  initialExecutives: ExecutiveRow[]
  canManage?: boolean
}

type CategoryTab = 'all' | 'csgb' | 'hall' | 'team'

function getInitials(name?: string): string {
  if (!name) return 'EX'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Appointed'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function ExecutivesClient({
  initialExecutives,
  canManage = false,
}: ExecutivesClientProps) {
  const [executives, setExecutives] = useState<ExecutiveRow[]>(initialExecutives)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<CategoryTab>('all')
  const [isPending, startTransition] = useTransition()

  // Relieve dialog state
  const [relieveTarget, setRelieveTarget] = useState<{
    workerId: string
    workerName: string
    positionKey: string
    positionLabel: string
  } | null>(null)

  // Keep local state in sync when server props refresh
  React.useEffect(() => {
    setExecutives(initialExecutives)
  }, [initialExecutives])

  // Count totals across all executives
  const { totalExcos, csgbCount, hallCount, teamCount } = useMemo(() => {
    let csgb = 0
    let hall = 0
    let team = 0

    for (const ex of executives) {
      for (const p of ex.positions || []) {
        if (p.kind === 'csgb') csgb++
        else if (p.kind === 'hall') hall++
        else if (p.kind === 'team') team++
      }
    }

    return {
      totalExcos: executives.length,
      csgbCount: csgb,
      hallCount: hall,
      teamCount: team,
    }
  }, [executives])

  // Flattened position items for precise search and category filtering
  const filteredExecutives = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return executives.filter((worker) => {
      // Category filter: worker must have at least one position matching the active tab
      const matchesTab =
        activeTab === 'all'
          ? true
          : worker.positions?.some((p) => p.kind === activeTab)

      if (!matchesTab) return false

      if (!q) return true

      // Search match across worker name, email, hall, and position titles
      const nameMatch = worker.fullName?.toLowerCase().includes(q)
      const emailMatch = worker.email?.toLowerCase().includes(q)
      const hallMatch = worker.hall?.toLowerCase().includes(q)
      const posMatch = worker.positions?.some((p) => {
        const title = (p.office || p.csgbRoleTitle || p.hallName || p.teamTitle || p.teamName || '').toLowerCase()
        return title.includes(q)
      })

      return Boolean(nameMatch || emailMatch || hallMatch || posMatch)
    })
  }, [executives, activeTab, searchQuery])

  const handleConfirmRelieve = () => {
    if (!relieveTarget) return

    startTransition(async () => {
      try {
        const res = await relieveExecutivePosition(relieveTarget.workerId, relieveTarget.positionKey)
        if (res.ok) {
          toastSuccess(`Relieved ${relieveTarget.workerName} from ${relieveTarget.positionLabel}`)
          // Optimistically update local list
          setExecutives((prev) =>
            prev
              .map((w) => {
                if (w._id !== relieveTarget.workerId) return w
                const updatedPositions = (w.positions || []).filter(
                  (p) => p.key !== relieveTarget.positionKey
                )
                return { ...w, positions: updatedPositions }
              })
              .filter((w) => w.positions && w.positions.length > 0)
          )
          setRelieveTarget(null)
        } else {
          toastError(res.error || 'Failed to relieve appointment.')
        }
      } catch {
        toastError('An unexpected error occurred.')
      }
    })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Executive Council & Leadership Roster
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage appointed executive leaders, CSGB Central Board, Hall Pastors, and Ministry Team Leads.
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <ExecutiveCsvImportDialog
              buttonLabel="Import Leadership Roster"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm transition-all"
            />
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Leaders</p>
              <p className="text-2xl font-bold text-foreground">{totalExcos}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">CSGB Board</p>
              <p className="text-2xl font-bold text-foreground">{csgbCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Hall Pastors</p>
              <p className="text-2xl font-bold text-foreground">{hallCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Team Leads</p>
              <p className="text-2xl font-bold text-foreground">{teamCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border/60 bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              activeTab === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All Leadership
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {totalExcos}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('csgb')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              activeTab === 'csgb'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            CSGB Board
            <span className="ml-1 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
              {csgbCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hall')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              activeTab === 'hall'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Hall Pastors
            <span className="ml-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {hallCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              activeTab === 'team'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Team Leads
            <span className="ml-1 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              {teamCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leader, office, hall..."
            className="pl-9 h-9 rounded-xl text-xs bg-background"
          />
        </div>
      </div>

      {/* Executives List */}
      {filteredExecutives.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-12 text-center bg-card/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No executive leaders found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {searchQuery
              ? `No executives match "${searchQuery}". Try clearing your search query.`
              : 'No executive appointments have been recorded for this category yet. Import an executive roster to get started.'}
          </p>
          {canManage && !searchQuery && (
            <div className="mt-4">
              <ExecutiveCsvImportDialog
                buttonLabel="Import Leadership Roster"
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-sm"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredExecutives.map((worker) => {
            const visiblePositions =
              activeTab === 'all'
                ? worker.positions || []
                : (worker.positions || []).filter((p) => p.kind === activeTab)

            return (
              <div
                key={worker._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-border hover:shadow-md"
              >
                <div>
                  {/* Top: Avatar & Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {worker.profileImageUrl ? (
                        <img
                          src={worker.profileImageUrl}
                          alt={worker.fullName}
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-purple-500/20"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                          {getInitials(worker.fullName)}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-semibold text-foreground leading-tight">
                          {worker.fullName}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {worker.email || 'No email registered'}
                        </p>
                        {worker.hall && (
                          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                            {worker.hall} {worker.roomNumber ? `• Rm ${worker.roomNumber}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/workers?search=${encodeURIComponent(worker.fullName)}`}
                      className="rounded-lg p-1.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
                      title="View workforce profile"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Positions Held */}
                  <div className="mt-4 space-y-2 border-t border-border/40 pt-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Executive Appointments
                    </p>
                    <div className="space-y-1.5">
                      {visiblePositions.map((pos) => {
                        const positionLabel =
                          pos.kind === 'csgb'
                            ? pos.office || pos.csgbRoleTitle || 'CSGB Officer'
                            : pos.kind === 'hall'
                            ? `Hall Pastor (${pos.hallName || pos.hall || 'Hall'})`
                            : `${pos.teamTitle || pos.teamName || 'Ministry'} Lead`

                        const isAssistant = pos.rank === 'assistant'

                        return (
                          <div
                            key={pos.key}
                            className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 border border-border/30"
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                {pos.kind === 'csgb' && (
                                  <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-none text-[10px] px-1.5 py-0">
                                    CSGB
                                  </Badge>
                                )}
                                {pos.kind === 'hall' && (
                                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-none text-[10px] px-1.5 py-0">
                                    Hall Pastor
                                  </Badge>
                                )}
                                {pos.kind === 'team' && (
                                  <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-none text-[10px] px-1.5 py-0">
                                    Team Lead
                                  </Badge>
                                )}
                                <span className="text-xs font-semibold text-foreground">
                                  {positionLabel}
                                </span>
                              </div>

                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                {isAssistant ? 'Assistant' : 'Head / Lead'} • {formatDate(pos.decidedAt || pos.submittedAt)}
                              </span>
                            </div>

                            {canManage && (
                              <button
                                type="button"
                                onClick={() =>
                                  setRelieveTarget({
                                    workerId: worker._id,
                                    workerName: worker.fullName,
                                    positionKey: pos.key,
                                    positionLabel,
                                  })
                                }
                                className="text-[11px] font-medium text-destructive hover:text-destructive/80 hover:underline px-2 py-1 rounded transition-colors"
                              >
                                Relieve
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer status */}
                <div className="mt-4 flex items-center justify-between pt-2 text-[11px] text-muted-foreground border-t border-border/30">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active Roster
                  </span>
                  <span>ID: {worker._id.slice(-6)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Relieve Confirmation Dialog */}
      <Dialog open={Boolean(relieveTarget)} onOpenChange={(open) => !open && setRelieveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Relieve Executive Appointment?</DialogTitle>
            <DialogDescription>
              Are you sure you want to relieve <strong>{relieveTarget?.workerName}</strong> of their appointment as{' '}
              <strong>{relieveTarget?.positionLabel}</strong>?
              <br />
              This will revoke their executive dashboard privileges for this office immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRelieveTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmRelieve}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Relieve Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
