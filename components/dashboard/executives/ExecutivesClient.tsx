'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Shield,
  ShieldCheck,
  Building,
  Users,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Crown,
} from 'lucide-react'
import type { ExecutiveRow } from '@/types'
import { Input } from '@/components/dashboard/ui/input'
import { Badge } from '@/components/dashboard/ui/badge'
import ExecutiveCsvImportDialog from '@/components/dashboard/workers/ExecutiveCsvImportDialog'
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

  // Keep local state in sync when server props refresh
  React.useEffect(() => {
    setExecutives(initialExecutives)
  }, [initialExecutives])

  // Count totals across all executives
  const { totalExcos, registeredCount, unregisteredCount, csgbCount, hallCount, teamCount } = useMemo(() => {
    let csgb = 0
    let hall = 0
    let team = 0
    let registered = 0

    for (const ex of executives) {
      if (ex.isRegistered) registered++
      for (const p of ex.positions || []) {
        if (p.kind === 'csgb') csgb++
        else if (p.kind === 'hall') hall++
        else if (p.kind === 'team') team++
      }
    }

    return {
      totalExcos: executives.length,
      registeredCount: registered,
      unregisteredCount: executives.length - registered,
      csgbCount: csgb,
      hallCount: hall,
      teamCount: team,
    }
  }, [executives])

  // Filtered executives by search & category tab
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
                Manage appointed leaders across CSGB, Hall Pastorate, and Ministry Teams. Reserved appointments activate automatically when the leader registers.
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
              <p className="text-[10px] text-muted-foreground">
                {registeredCount} registered
                {unregisteredCount > 0 && ` · ${unregisteredCount} awaiting`}
              </p>
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

      {unregisteredCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3 text-xs text-amber-800 dark:text-amber-300">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-relaxed">
            <span className="font-semibold">
              {unregisteredCount} appointed leader{unregisteredCount === 1 ? ' has' : 's have'} not registered yet.
            </span>{' '}
            Their role is reserved. Dashboard access activates automatically the moment they register as a worker on{' '}
            <span className="font-mono">/register</span>.
          </p>
        </div>
      )}

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
                          className={cn(
                            'h-11 w-11 rounded-full object-cover ring-2',
                            worker.isRegistered ? 'ring-purple-500/20' : 'ring-amber-500/25'
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            'flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm',
                            worker.isRegistered
                              ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                              : 'bg-gradient-to-br from-amber-500 to-orange-600'
                          )}
                        >
                          {getInitials(worker.fullName)}
                        </div>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-sm font-semibold text-foreground leading-tight">
                            {worker.fullName}
                          </h4>
                          {!worker.isRegistered && (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none text-[10px] px-1.5 py-0 gap-1 font-semibold">
                              <Clock className="h-2.5 w-2.5" />
                              Unregistered
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {worker.email || (worker.isRegistered ? 'No email registered' : 'No email on the leadership sheet')}
                        </p>
                        {worker.hall && (
                          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                            {worker.hall} {worker.roomNumber ? `• Rm ${worker.roomNumber}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {worker.isRegistered ? (
                      <Link
                        href={`/dashboard/workers?search=${encodeURIComponent(worker.fullName)}`}
                        className="rounded-lg p-1.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
                        title="View workforce profile"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span
                        className="rounded-lg p-1.5 text-amber-600/70 dark:text-amber-400/70"
                        title="Workforce profile unlocks after the leader registers"
                      >
                        <Clock className="h-4 w-4" />
                      </span>
                    )}
                  </div>

                  {/* Positions Held */}
                  <div className="mt-4 space-y-2 pt-3">
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
                                {isAssistant ? 'Assistant' : 'Head / Lead'} •{' '}
                                {worker.isRegistered
                                  ? formatDate(pos.decidedAt || pos.submittedAt)
                                  : `Reserved ${formatDate(worker.importedAt || pos.submittedAt)}`}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer status */}
                <div className="mt-4 flex items-center justify-between pt-2 text-[11px] text-muted-foreground border-t border-border/30">
                  {worker.isRegistered ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active Roster
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                      <Clock className="h-3.5 w-3.5" /> Unregistered · Awaiting registration
                    </span>
                  )}
                  <span>ID: {worker._id.slice(-6)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
