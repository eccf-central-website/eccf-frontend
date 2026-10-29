'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Shield,
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
  /** Date-only eyebrow rendered by the server, e.g. "29 October 2026". */
  today: string
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
    return d.toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Africa/Lagos',
    })
  } catch {
    return dateStr
  }
}

/** Roster rows must be live, approved appointments — never archived or rejected records. */
function approvedPositions(row: ExecutiveRow) {
  return (row.positions || []).filter((position) => position.status === 'approved')
}

export default function ExecutivesClient({
  initialExecutives,
  canManage = false,
  today,
}: ExecutivesClientProps) {
  const [executives, setExecutives] = useState<ExecutiveRow[]>(initialExecutives)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<CategoryTab>('all')

  // Keep local state in sync when server props refresh.
  React.useEffect(() => {
    setExecutives(initialExecutives)
  }, [initialExecutives])

  // Defensive filter: the data layer already scopes the query, but stale
  // props or a revoked appointment must never keep a leader on the roster.
  const roster = useMemo(
    () =>
      executives
        .map((row) => ({ ...row, positions: approvedPositions(row) }))
        .filter((row) => row.positions.length > 0),
    [executives]
  )

  // Count totals across all executives
  const { totalExcos, registeredCount, unregisteredCount, csgbCount, hallCount, teamCount } = useMemo(() => {
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

  // Filtered executives by search & category tab
  const filteredExecutives = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return roster.filter((worker) => {
      // Category filter: worker must have at least one position matching the active tab
      const matchesTab =
        activeTab === 'all'
          ? true
          : worker.positions.some((p) => p.kind === activeTab)

      if (!matchesTab) return false

      if (!q) return true

      // Search match across worker name, email, hall, and position titles
      const nameMatch = worker.fullName?.toLowerCase().includes(q)
      const emailMatch = worker.email?.toLowerCase().includes(q)
      const hallMatch = worker.hall?.toLowerCase().includes(q)
      const posMatch = worker.positions.some((p) => {
        const title = (p.office || p.csgbRoleTitle || p.hallName || p.teamTitle || p.teamName || '').toLowerCase()
        return title.includes(q)
      })

      return Boolean(nameMatch || emailMatch || hallMatch || posMatch)
    })
  }, [roster, activeTab, searchQuery])

  const tabClass = (tab: CategoryTab) =>
    cn(
      'flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors',
      activeTab === tab
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    )

  const countChipClass = (tab: CategoryTab) =>
    cn(
      'ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
      activeTab === tab
        ? 'bg-primary/10 text-primary'
        : 'bg-muted text-muted-foreground'
    )

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header — date-only eyebrow, clean title, primary 44px action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {today}
          </p>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Executive Council & Leadership Roster
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Approved leaders across CSGB, Hall Pastorate, and Ministry Teams. Reserved
            appointments activate automatically when the leader registers.
          </p>
        </div>

        {canManage && (
          <ExecutiveCsvImportDialog
            buttonLabel="Import Leadership Roster"
            className="min-h-11 bg-primary text-primary-foreground font-semibold shadow-sm transition-colors hover:bg-primary/90"
          />
        )}
      </div>

      {/* KPI Stats Cards — fixed-row anatomy */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="flex flex-col justify-between rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Total Leaders</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Crown className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{totalExcos}</p>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
            {registeredCount} registered
            {unregisteredCount > 0 && ` · ${unregisteredCount} awaiting`}
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">CSGB Board</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{csgbCount}</p>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">Governing board seats</p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Hall Pastors</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{hallCount}</p>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">Hall pastorate leads</p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Team Leads</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{teamCount}</p>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">Ministry team heads</p>
        </div>
      </div>

      {unregisteredCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl bg-secondary px-3.5 py-3 text-xs text-foreground">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1">
          <button type="button" onClick={() => setActiveTab('all')} className={tabClass('all')}>
            All Leadership
            <span className={countChipClass('all')}>{totalExcos}</span>
          </button>

          <button type="button" onClick={() => setActiveTab('csgb')} className={tabClass('csgb')}>
            CSGB Board
            <span className={countChipClass('csgb')}>{csgbCount}</span>
          </button>

          <button type="button" onClick={() => setActiveTab('hall')} className={tabClass('hall')}>
            Hall Pastors
            <span className={countChipClass('hall')}>{hallCount}</span>
          </button>

          <button type="button" onClick={() => setActiveTab('team')} className={tabClass('team')}>
            Team Leads
            <span className={countChipClass('team')}>{teamCount}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leader, office, hall..."
            className="h-11 rounded-xl bg-background pl-9 text-sm"
          />
        </div>
      </div>

      {/* Executives List */}
      {filteredExecutives.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-card p-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No executive leaders found</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {searchQuery
              ? `No executives match "${searchQuery}". Try clearing your search query.`
              : 'No approved executive appointments have been recorded for this category yet. Import an executive roster to get started.'}
          </p>
          {canManage && !searchQuery && (
            <div className="mt-4">
              <ExecutiveCsvImportDialog
                buttonLabel="Import Leadership Roster"
                className="min-h-11 bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/90"
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
              <div
                key={worker._id}
                className="group relative flex flex-col justify-between rounded-2xl bg-card p-5 transition-shadow hover:shadow-md"
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
                            worker.isRegistered ? 'ring-primary/20' : 'ring-[var(--brand-gold)]/30'
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground shadow-sm',
                            worker.isRegistered
                              ? 'bg-primary'
                              : 'bg-[var(--brand-gold)] text-[var(--brand-navy)]'
                          )}
                        >
                          {getInitials(worker.fullName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-sm font-semibold leading-tight text-foreground">
                            {worker.fullName}
                          </h4>
                          {!worker.isRegistered && (
                            <Badge className="gap-1 border-none bg-[var(--brand-gold)]/15 px-1.5 py-0 text-[10px] font-semibold text-[var(--brand-gold)]">
                              <Clock className="h-2.5 w-2.5" />
                              Unregistered
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {worker.email || (worker.isRegistered ? 'No email registered' : 'No email on the leadership sheet')}
                        </p>
                        {worker.hall && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground/80">{worker.hall}</p>
                        )}
                      </div>
                    </div>

                    {worker.isRegistered ? (
                      <Link
                        href={`/dashboard/workers?search=${encodeURIComponent(worker.fullName)}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        title="View workforce profile"
                        aria-label={`View ${worker.fullName}'s workforce profile`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--brand-gold)]/70"
                        title="Workforce profile unlocks after the leader registers"
                      >
                        <Clock className="h-4 w-4" />
                      </span>
                    )}
                  </div>

                  {/* Positions Held */}
                  <div className="mt-4 space-y-2 pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                            className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2"
                          >
                            <div className="flex min-w-0 flex-col">
                              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                {pos.kind === 'csgb' && (
                                  <Badge className="border-none bg-primary/10 px-1.5 py-0 text-[10px] text-primary">
                                    CSGB
                                  </Badge>
                                )}
                                {pos.kind === 'hall' && (
                                  <Badge className="border-none bg-primary/10 px-1.5 py-0 text-[10px] text-primary">
                                    Hall Pastor
                                  </Badge>
                                )}
                                {pos.kind === 'team' && (
                                  <Badge className="border-none bg-primary/10 px-1.5 py-0 text-[10px] text-primary">
                                    Team Lead
                                  </Badge>
                                )}
                                <span className="truncate text-xs font-semibold text-foreground">
                                  {positionLabel}
                                </span>
                              </div>

                              <span className="mt-0.5 text-[10px] text-muted-foreground">
                                {isAssistant ? 'Assistant' : 'Head / Lead'} ·{' '}
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
                <div className="mt-4 flex items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
                  {worker.isRegistered ? (
                    <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active Roster
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-medium text-[var(--brand-gold)]">
                      <Clock className="h-3.5 w-3.5" /> Unregistered · Awaiting registration
                    </span>
                  )}
                  <span className="shrink-0 font-mono">ID: {worker._id.slice(-6)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
