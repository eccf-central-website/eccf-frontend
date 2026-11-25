'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  HeartHandshake,
  Phone,
  User,
} from 'lucide-react'
import type { WelfareRequestRow } from '@/types'
import { lagosDaysBetween } from '@/lib/dashboard/dates'
import {
  formatCount,
  formatDate,
  formatRelativeDay,
  toDateTimeAttr,
} from '@/lib/dashboard/format'
import { Button } from '@/components/dashboard/ui/button'
import { ConfirmDialog } from '@/components/dashboard/ui/confirm-dialog'
import {
  DataToolbar,
  type ActiveFilterChip,
} from '@/components/dashboard/ui/data-toolbar'
import { KpiStrip, type KpiStripItem } from '@/components/dashboard/ui/kpi-strip'
import { RecordSheet } from '@/components/dashboard/ui/record-sheet'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/dashboard/ui/tooltip'
import EmptyState from '@/components/dashboard/states/EmptyState'
import { resolveWelfareRequest } from '@/app/actions/welfare-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface WelfareClientProps {
  initialRequests: WelfareRequestRow[]
  onPendingCountChange?: (count: number) => void
  onTotalCountChange?: (count: number) => void
}

type StatusFilter = 'pending' | 'resolved' | 'all'

function isValidIso(iso?: string | null): iso is string {
  if (!iso) return false
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00Z`) : new Date(iso)
  return !Number.isNaN(parsed.getTime())
}

function safeFormatDate(iso?: string | null): string {
  if (!isValidIso(iso)) return iso || '—'
  return formatDate(iso)
}

function safeFormatRelativeDay(iso?: string | null): string {
  if (!isValidIso(iso)) return iso || '—'
  return formatRelativeDay(iso)
}

function isUrgentCase(req: WelfareRequestRow): boolean {
  if (req.status !== 'Pending') return false
  if (isValidIso(req.dateSubmitted) && lagosDaysBetween(req.dateSubmitted) >= 3) {
    return true
  }
  const text = req.requestDetails.toLowerCase()
  return (
    text.includes('hospital') ||
    text.includes('medical') ||
    text.includes('emergency') ||
    text.includes('admission') ||
    text.includes('clinic')
  )
}

function CareRequestStatusBadge({ req }: { req: WelfareRequestRow }) {
  if (req.status === 'Resolved') {
    return <StatusBadge variant="success">Resolved</StatusBadge>
  }

  if (isUrgentCase(req)) {
    return (
      <StatusBadge
        variant="destructive"
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
      >
        Urgent
      </StatusBadge>
    )
  }

  return (
    <StatusBadge variant="warning" icon={<Clock className="h-3.5 w-3.5" />}>
      Pending attention
    </StatusBadge>
  )
}

export default function WelfareClient({
  initialRequests,
  onPendingCountChange,
  onTotalCountChange,
}: WelfareClientProps) {
  const [requests, setRequests] = useState<WelfareRequestRow[]>(initialRequests)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    initialRequests.some((r) => r.status === 'Pending') ? 'pending' : 'all'
  )
  const [selectedRequest, setSelectedRequest] = useState<WelfareRequestRow | null>(null)
  const [confirmResolveOpen, setConfirmResolveOpen] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    setRequests(initialRequests)
  }, [initialRequests])

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'Pending').length,
    [requests]
  )
  const resolvedCount = useMemo(
    () => requests.filter((r) => r.status === 'Resolved').length,
    [requests]
  )

  useEffect(() => {
    onPendingCountChange?.(pendingCount)
  }, [pendingCount, onPendingCountChange])

  useEffect(() => {
    onTotalCountChange?.(requests.length)
  }, [requests.length, onTotalCountChange])

  const filteredRequests = useMemo(() => {
    const query = search.toLowerCase().trim()
    return requests
      .filter((req) => {
        const matchesSearch =
          query === '' ||
          req.name.toLowerCase().includes(query) ||
          req.requestDetails.toLowerCase().includes(query) ||
          Boolean(req.phoneNumber?.toLowerCase().includes(query))

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'pending' && req.status === 'Pending') ||
          (statusFilter === 'resolved' && req.status === 'Resolved')

        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'Pending' ? -1 : 1
        }
        return new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime()
      })
  }, [requests, search, statusFilter])

  async function handleResolve(id: string) {
    setResolvingId(id)
    try {
      const res = await resolveWelfareRequest(id)
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: 'Resolved' as const } : r))
        )
        setSelectedRequest((prev) =>
          prev && prev._id === id ? { ...prev, status: 'Resolved' as const } : prev
        )
        setConfirmResolveOpen(false)
        setSelectedRequest(null)
        toast.success('Welfare request marked as resolved.')
      } else {
        toast.error(res.error || 'Failed to update request.')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setResolvingId(null)
    }
  }

  async function copyPhoneNumber(phone: string, id: string) {
    try {
      await navigator.clipboard.writeText(phone)
      setCopiedId(id)
      toast.success(`Copied ${phone} to clipboard`)
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current))
      }, 2000)
    } catch {
      toast.error('Unable to copy phone number.')
    }
  }

  const kpiItems: KpiStripItem[] = [
    {
      id: 'pending',
      label: 'Pending attention',
      value: formatCount(pendingCount),
      rawValue: pendingCount,
      caption: pendingCount > 0 ? 'Awaiting pastoral care' : 'All requests addressed',
      icon: <AlertCircle />,
      tone: pendingCount > 0 ? 'warning' : 'neutral',
      onClick: () => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending'),
      active: statusFilter === 'pending',
      ariaLabel: `Filter to ${pendingCount} pending care requests`,
    },
    {
      id: 'resolved',
      label: 'Resolved',
      value: formatCount(resolvedCount),
      rawValue: resolvedCount,
      caption:
        requests.length > 0
          ? `${Math.round((resolvedCount / requests.length) * 100)}% closed`
          : 'No requests yet',
      icon: <CheckCircle2 />,
      tone: 'success',
      onClick: () => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved'),
      active: statusFilter === 'resolved',
      ariaLabel: `Filter to ${resolvedCount} resolved care requests`,
    },
    {
      id: 'total',
      label: 'Total requests',
      value: formatCount(requests.length),
      rawValue: requests.length,
      caption: 'All logged care cases',
      icon: <HeartHandshake />,
      tone: 'primary',
      onClick: () => setStatusFilter('all'),
      active: statusFilter === 'all',
      ariaLabel: `Show all ${requests.length} care requests`,
    },
  ]

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'resolved', label: 'Resolved', count: resolvedCount },
    { key: 'all', label: 'All', count: requests.length },
  ]

  const activeFilters: ActiveFilterChip[] = []
  if (statusFilter !== 'all') {
    activeFilters.push({
      id: 'status',
      label: 'Status',
      value: statusFilter === 'pending' ? 'Pending' : 'Resolved',
      onRemove: () => setStatusFilter('all'),
    })
  }

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  const renderEmptyState = () => {
    if (requests.length === 0) {
      return (
        <EmptyState
          variant="nothing-yet"
          title="No welfare requests yet"
          description="Care requests submitted through the Connect page will appear here for follow-up."
          icon={<HeartHandshake />}
        />
      )
    }

    if (statusFilter === 'pending' && !search.trim() && resolvedCount > 0) {
      return (
        <EmptyState
          variant="nothing-yet"
          title="No pending requests"
          description="Every care request has been followed up and closed."
          icon={<CheckCircle2 />}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatusFilter('resolved')}
              className="min-h-11 md:min-h-10"
            >
              View resolved ({formatCount(resolvedCount)})
            </Button>
          }
        />
      )
    }

    return (
      <EmptyState
        variant="no-results"
        title="No matching care requests"
        description="Try clearing your search query or switching status filters."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={handleResetFilters}
            className="min-h-11 md:min-h-10"
          >
            Clear filters
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <KpiStrip items={kpiItems} ariaLabel="Care requests summary" />

      {/* Segmented Status Tabs + Toolbar */}
      <div className="space-y-4">
        <div
          role="group"
          aria-label="Filter care requests by status"
          className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-[var(--radius-control)] bg-card p-1 shadow-sm"
        >
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-[calc(var(--radius-control)-2px)] px-3.5 py-2 text-sm font-medium transition-colors [touch-action:manipulation] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card md:min-h-10',
                  active
                    ? 'bg-surface-raised text-foreground ring-1 ring-inset ring-primary/35'
                    : 'text-muted-foreground hover:bg-surface-raised/60 hover:text-foreground'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'inline-flex min-w-6 items-center justify-center rounded-[var(--radius-pill)] px-1.5 py-0.5 text-[13px] font-medium leading-none tabular-nums',
                    active
                      ? 'bg-primary/15 text-accent-foreground dark:text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {formatCount(tab.count)}
                </span>
              </button>
            )
          })}
        </div>

        <DataToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchLabel="Search care requests"
          searchPlaceholder="Search name, phone, or request details…"
          activeFilters={activeFilters}
          onResetFilters={handleResetFilters}
          meta={`${formatCount(filteredRequests.length)} of ${formatCount(requests.length)} requests`}
        />
      </div>

      <h2 className="sr-only">Care requests queue</h2>

      {filteredRequests.length === 0 ? (
        renderEmptyState()
      ) : (
        <ul className="space-y-3">
          {filteredRequests.map((req) => (
            <li key={req._id}>
              <article className="rounded-[var(--radius-card)] bg-card p-4 shadow-sm transition-colors hover:bg-surface-raised/40 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="inline-flex items-center gap-2 font-sans text-base font-semibold leading-snug text-foreground">
                        <User
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span>{req.name}</span>
                      </h3>

                      <CareRequestStatusBadge req={req} />

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            tabIndex={0}
                            className="inline-flex cursor-default items-center gap-1.5 rounded-sm text-[13px] text-muted-foreground underline decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <time
                              dateTime={
                                isValidIso(req.dateSubmitted)
                                  ? toDateTimeAttr(req.dateSubmitted)
                                  : undefined
                              }
                              title={safeFormatDate(req.dateSubmitted)}
                            >
                              {safeFormatRelativeDay(req.dateSubmitted)}
                            </time>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{safeFormatDate(req.dateSubmitted)}</TooltipContent>
                      </Tooltip>
                    </div>

                    <p className="line-clamp-2 max-w-[75ch] text-sm leading-relaxed text-foreground/90 [text-wrap:pretty]">
                      {req.requestDetails}
                    </p>

                    {req.canViewContact && (
                      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          {req.phoneNumber ? (
                            <span className="font-medium tabular-nums text-foreground">
                              {req.phoneNumber}
                            </span>
                          ) : (
                            'No phone number'
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 sm:self-center">
                    <Button
                      type="button"
                      variant={req.status === 'Pending' ? 'default' : 'outline'}
                      onClick={() => setSelectedRequest(req)}
                      className="min-h-11 w-full px-4 sm:w-auto"
                    >
                      Open case
                    </Button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {/* Care Request Detail RecordSheet */}
      <RecordSheet
        open={Boolean(selectedRequest)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null)
            setConfirmResolveOpen(false)
          }
        }}
        title={selectedRequest?.name ?? 'Care request'}
        description={
          selectedRequest
            ? `Submitted ${safeFormatDate(selectedRequest.dateSubmitted)} (${safeFormatRelativeDay(selectedRequest.dateSubmitted)})`
            : undefined
        }
        headerExtra={
          selectedRequest ? <CareRequestStatusBadge req={selectedRequest} /> : undefined
        }
        footer={
          selectedRequest ? (
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedRequest(null)}
                className="min-h-11 w-full sm:w-auto md:min-h-10"
              >
                Close
              </Button>
              {selectedRequest.status === 'Pending' && (
                <Button
                  type="button"
                  onClick={() => setConfirmResolveOpen(true)}
                  className="min-h-11 w-full sm:w-auto md:min-h-10"
                >
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Mark resolved</span>
                </Button>
              )}
            </div>
          ) : undefined
        }
      >
        {selectedRequest && (
          <div className="space-y-5">
            {/* Full Care Request */}
            <section aria-labelledby="care-request-detail-heading" className="space-y-2">
              <h3
                id="care-request-detail-heading"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Request details
              </h3>
              <div className="rounded-[var(--radius-card)] bg-surface-raised p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground [text-wrap:pretty]">
                  {selectedRequest.requestDetails}
                </p>
              </div>
            </section>

            {/* Contact Details (RBAC-gated) */}
            <section aria-labelledby="care-contact-heading" className="space-y-2">
              <h3
                id="care-contact-heading"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Contact details
              </h3>
              <div className="rounded-[var(--radius-card)] bg-surface-raised p-4">
                {selectedRequest.canViewContact ? (
                  selectedRequest.phoneNumber ? (
                    <div className="space-y-3">
                      <p className="select-all text-base font-semibold tabular-nums text-foreground">
                        {selectedRequest.phoneNumber}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${selectedRequest.phoneNumber.replace(/[^\d+]/g, '')}`}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors [touch-action:manipulation] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card md:min-h-10"
                        >
                          <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>Call requester</span>
                        </a>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            copyPhoneNumber(selectedRequest.phoneNumber!, selectedRequest._id)
                          }
                          className="min-h-11 gap-2 md:min-h-10"
                        >
                          {copiedId === selectedRequest._id ? (
                            <>
                              <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                              <span>Copy phone</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No phone number</p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Contact phone is restricted to CSGB officers and the Welfare &amp; Medical team.
                  </p>
                )}
              </div>
            </section>

            {/* Case Metadata */}
            <dl className="divide-y divide-border/40 rounded-[var(--radius-card)] bg-surface-raised px-4 py-1 text-sm">
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="font-medium text-foreground">
                  <time
                    dateTime={
                      isValidIso(selectedRequest.dateSubmitted)
                        ? toDateTimeAttr(selectedRequest.dateSubmitted)
                        : undefined
                    }
                  >
                    {safeFormatDate(selectedRequest.dateSubmitted)}
                  </time>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium text-foreground">{selectedRequest.status}</dd>
              </div>
            </dl>
          </div>
        )}
      </RecordSheet>

      <ConfirmDialog
        open={confirmResolveOpen}
        onOpenChange={setConfirmResolveOpen}
        tone="primary"
        title={
          selectedRequest
            ? `Resolve care request from ${selectedRequest.name}?`
            : 'Resolve care request?'
        }
        description="Confirm that pastoral care or assistance has been coordinated and this request can be closed."
        effectSummary="This case will move to Resolved with your name and timestamp recorded."
        confirmLabel="Mark resolved"
        loading={Boolean(resolvingId)}
        loadingLabel="Resolving…"
        onConfirm={() => {
          if (selectedRequest) {
            return handleResolve(selectedRequest._id)
          }
        }}
      />
    </div>
  )
}
