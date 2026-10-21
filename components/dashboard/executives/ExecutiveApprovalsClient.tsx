'use client'

/**
 * President Executive Approval Console Client — components/dashboard/executives/ExecutiveApprovalsClient.tsx
 *
 * Implements Phase 4 of Clerk Migration:
 * - Displays pending executive applications grouped by category:
 *   1. CSGB Central Student Governing Board Offices
 *   2. Hall Pastors & Assistants
 *   3. Ministry Team Leads & Assistants
 * - Shows applicant's name, email, hall, requested position, rank, and submission date.
 * - 1-tap Presidential approval and rejection with optimistic UI updates.
 */

import * as React from 'react'
import { useState, useMemo, useTransition } from 'react'
import {
  Shield,
  ShieldCheck,
  Building,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Loader2,
  Award,
} from 'lucide-react'
import type { PendingExecutiveApplication } from '@/types'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Badge } from '@/components/dashboard/ui/badge'
import {
  approveExecutivePosition,
  rejectExecutivePosition,
} from '@/app/actions/executive-approval-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'

interface ExecutiveApprovalsClientProps {
  applications: PendingExecutiveApplication[]
}

type CategoryFilter = 'all' | 'csgb' | 'hall' | 'team'

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Recently submitted'
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

export default function ExecutiveApprovalsClient({
  applications: initialApplications,
}: ExecutiveApprovalsClientProps) {
  const [applications, setApplications] = useState<PendingExecutiveApplication[]>(initialApplications)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [, startTransition] = useTransition()
  const [processingKey, setProcessingKey] = useState<string | null>(null)

  // Categorised applications
  const csgbApps = useMemo(
    () => applications.filter((app) => app.position.kind === 'csgb'),
    [applications]
  )
  const hallApps = useMemo(
    () => applications.filter((app) => app.position.kind === 'hall'),
    [applications]
  )
  const teamApps = useMemo(
    () => applications.filter((app) => app.position.kind === 'team'),
    [applications]
  )

  // Filtered by search & category tab
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      // Category filter
      if (categoryFilter !== 'all' && app.position.kind !== categoryFilter) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = app.fullName.toLowerCase().includes(q)
        const matchEmail = (app.email || '').toLowerCase().includes(q)
        const matchHall = (app.hall || '').toLowerCase().includes(q)
        const matchOffice = (app.position.office || '').toLowerCase().includes(q)
        const matchTeam = (app.position.teamName || '').toLowerCase().includes(q)
        const matchPosHall = (app.position.hall || '').toLowerCase().includes(q)

        if (!matchName && !matchEmail && !matchHall && !matchOffice && !matchTeam && !matchPosHall) {
          return false
        }
      }

      return true
    })
  }, [applications, categoryFilter, searchQuery])

  // Handle Approve Action
  function handleApprove(app: PendingExecutiveApplication) {
    const itemKey = `${app.workerId}:${app.position.key}`
    setProcessingKey(itemKey)

    startTransition(async () => {
      try {
        const res = await approveExecutivePosition(app.workerId, app.position.key)
        if (res.ok) {
          setApplications((prev) =>
            prev.filter(
              (item) => !(item.workerId === app.workerId && item.position.key === app.position.key)
            )
          )
          const posTitle =
            app.position.office ||
            (app.position.kind === 'hall'
              ? `${app.position.rank === 'assistant' ? 'Assistant ' : ''}Hall Pastor (${app.position.hall})`
              : `${app.position.rank === 'assistant' ? 'Assistant ' : ''}Lead (${app.position.teamName || 'Team'})`)
          toastSuccess(
            `Approved ${app.fullName} as ${posTitle}!${
              app.position.kind === 'team' ? ' Operational team membership verified.' : ''
            }`
          )
        } else {
          toastError(res.error || 'Failed to approve application.')
        }
      } catch {
        toastError('An unexpected network error occurred.')
      } finally {
        setProcessingKey(null)
      }
    })
  }

  // Handle Reject Action
  function handleReject(app: PendingExecutiveApplication) {
    const itemKey = `${app.workerId}:${app.position.key}`
    setProcessingKey(itemKey)

    startTransition(async () => {
      try {
        const res = await rejectExecutivePosition(app.workerId, app.position.key)
        if (res.ok) {
          setApplications((prev) =>
            prev.filter(
              (item) => !(item.workerId === app.workerId && item.position.key === app.position.key)
            )
          )
          toastSuccess(`Declined executive application for ${app.fullName}.`)
        } else {
          toastError(res.error || 'Failed to decline application.')
        }
      } catch {
        toastError('An unexpected network error occurred.')
      } finally {
        setProcessingKey(null)
      }
    })
  }

  // Render individual application card
  function renderApplicationCard(app: PendingExecutiveApplication) {
    const itemKey = `${app.workerId}:${app.position.key}`
    const isBusy = processingKey === itemKey
    const isAssistant = app.position.rank === 'assistant'

    let positionTitle = 'Executive Position'
    let categoryBadge = 'Leadership'
    let categoryBadgeClass = 'bg-primary/10 text-primary border-primary/20'

    if (app.position.kind === 'csgb') {
      positionTitle = app.position.office || 'CSGB Executive Officer'
      categoryBadge = 'CSGB Office'
      categoryBadgeClass = 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
    } else if (app.position.kind === 'hall') {
      positionTitle = `${isAssistant ? 'Assistant ' : ''}Hall Pastor (${app.position.hall || app.hall || 'Hall'})`
      categoryBadge = 'Hall Pastorate'
      categoryBadgeClass = 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
    } else if (app.position.kind === 'team') {
      positionTitle = `${isAssistant ? 'Assistant ' : ''}Team Lead (${app.position.teamName || 'Ministry Team'})`
      categoryBadge = 'Ministry Team'
      categoryBadgeClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
    }

    return (
      <div
        key={itemKey}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all duration-200"
      >
        {/* Applicant Profile & Position Info */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-serif font-black text-base overflow-hidden border border-border">
            {app.profileImageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={app.profileImageUrl}
                alt={app.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              app.fullName.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-base text-foreground truncate">{app.fullName}</span>
              <Badge variant="outline" className={`text-[10px] uppercase font-mono font-bold ${categoryBadgeClass}`}>
                {categoryBadge}
              </Badge>
              {app.position.rank && app.position.kind !== 'csgb' && (
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase font-mono ${
                    isAssistant
                      ? 'bg-muted text-muted-foreground border-border'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-bold'
                  }`}
                >
                  {isAssistant ? 'Assistant' : 'Lead'}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-semibold text-primary">{positionTitle}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Building className="h-3 w-3" />
                {app.hall || 'No Hall Assigned'}
              </span>
              {app.email && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 truncate max-w-[200px]" title={app.email}>
                    <Mail className="h-3 w-3" />
                    {app.email}
                  </span>
                </>
              )}
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono">
                <Clock className="h-3 w-3" />
                {formatDate(app.position.submittedAt || app.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
          <Button
            size="sm"
            disabled={isBusy}
            onClick={() => handleApprove(app)}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-1.5" />
            )}
            Approve Appointment
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={() => handleReject(app)}
            className="h-9 px-3 rounded-xl text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 text-xs font-bold"
          >
            <XCircle className="h-4 w-4 mr-1 sm:mr-0" />
            <span className="sm:hidden">Decline</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* PRESIDENTIAL CONSOLE HEADER                                          */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-primary">
              <Shield className="h-3.5 w-3.5" />
              Presidential Governance Chamber
            </span>
            {applications.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                <Clock className="h-3 w-3" />
                {applications.length} Pending Approval
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">
            Executive Appointments Console
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Sole presidential authority to confirm Executive Council appointments. Approving a Ministry Team Lead automatically grants verified membership on that team.
          </p>
        </div>

        {/* Category Stat Counters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-card border border-border shadow-xs text-center min-w-[75px]">
            <span className="block text-[10px] font-mono uppercase text-muted-foreground font-bold">Total</span>
            <span className="font-serif font-black text-lg text-foreground">{applications.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/25 shadow-xs text-center min-w-[75px]">
            <span className="block text-[10px] font-mono uppercase text-purple-600 dark:text-purple-400 font-bold">CSGB</span>
            <span className="font-serif font-black text-lg text-purple-700 dark:text-purple-300">{csgbApps.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-sky-500/10 border border-sky-500/25 shadow-xs text-center min-w-[75px]">
            <span className="block text-[10px] font-mono uppercase text-sky-600 dark:text-sky-400 font-bold">Halls</span>
            <span className="font-serif font-black text-lg text-sky-700 dark:text-sky-300">{hallApps.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 shadow-xs text-center min-w-[75px]">
            <span className="block text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 font-bold">Teams</span>
            <span className="font-serif font-black text-lg text-amber-700 dark:text-amber-300">{teamApps.length}</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* FILTER & SEARCH BAR                                                  */}
      {/* ==================================================================== */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search applicants by name, email, hall, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-muted/40 border-input focus:bg-background text-sm text-foreground"
            />
          </div>

          {/* Quick Clear Button */}
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="h-11 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Clear Search
            </Button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border">
          <span className="text-xs font-mono font-bold text-muted-foreground uppercase mr-1">Category:</span>
          {[
            { id: 'all', label: `All Applications (${applications.length})`, icon: Shield },
            { id: 'csgb', label: `CSGB Offices (${csgbApps.length})`, icon: Award },
            { id: 'hall', label: `Hall Pastors & Assistants (${hallApps.length})`, icon: Building },
            { id: 'team', label: `Ministry Team Leads & Assistants (${teamApps.length})`, icon: Users },
          ].map((tab) => {
            const isActive = categoryFilter === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id as CategoryFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* APPLICATIONS LIST / GROUPED SECTIONS                                 */}
      {/* ==================================================================== */}
      {filteredApps.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="font-serif text-lg font-bold text-foreground">
            {applications.length === 0
              ? 'All Executive Appointments Clear'
              : 'No Applications Match Filter'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
            {applications.length === 0
              ? 'There are no pending executive applications awaiting Presidential review at this time. New applications from workers will appear here immediately.'
              : 'Try clearing your search terms or selecting a different category filter above.'}
          </p>
        </div>
      ) : categoryFilter === 'all' ? (
        // Render Grouped by Category when "All" is active
        <div className="space-y-6">
          {/* Category 1: CSGB Central Student Governing Board */}
          {csgbApps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    <Award className="h-4 w-4" />
                  </div>
                  <h2 className="font-serif font-bold text-lg text-foreground">
                    CSGB Central Student Governing Board Offices
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {csgbApps.length} Candidate{csgbApps.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3">
                {csgbApps.map(renderApplicationCard)}
              </div>
            </div>
          )}

          {/* Category 2: Hall Pastors & Assistants */}
          {hallApps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
                    <Building className="h-4 w-4" />
                  </div>
                  <h2 className="font-serif font-bold text-lg text-foreground">
                    Hall Pastors &amp; Assistant Pastors
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {hallApps.length} Candidate{hallApps.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3">
                {hallApps.map(renderApplicationCard)}
              </div>
            </div>
          )}

          {/* Category 3: Ministry Team Leads & Assistants */}
          {teamApps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <h2 className="font-serif font-bold text-lg text-foreground">
                    Ministry Team Leads &amp; Assistant Leads
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {teamApps.length} Candidate{teamApps.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3">
                {teamApps.map(renderApplicationCard)}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Render Single Filtered Category
        <div className="space-y-3">
          {filteredApps.map(renderApplicationCard)}
        </div>
      )}
    </div>
  )
}
