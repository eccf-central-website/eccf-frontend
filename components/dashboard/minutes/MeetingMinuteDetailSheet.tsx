'use client'

import React, { useState } from 'react'
import {
  Archive,
  ArchiveRestore,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Edit,
  EyeOff,
  FolderOpen,
  Loader2,
  Lock,
  MapPin,
  Pin,
  Printer,
  Send,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react'
import { Button } from '@/components/dashboard/ui/button'
import { Checkbox } from '@/components/dashboard/ui/checkbox'
import { RecordSheet } from '@/components/dashboard/ui/record-sheet'
import { Separator } from '@/components/dashboard/ui/separator'
import { StatusBadge, type StatusBadgeVariant } from '@/components/dashboard/ui/status-badge'
import {
  formatCount,
  formatDate,
  formatRelativeDay,
  toDateTimeAttr,
} from '@/lib/dashboard/format'
import { toastError, toastSuccess } from '@/lib/dashboard/toast'
import { cn } from '@/lib/utils'
import type { MeetingMinute, MeetingMinuteActionItem } from '@/types'

export const MEETING_TYPE_VARIANT: Record<string, StatusBadgeVariant> = {
  CSGB: 'primary',
  'General EXCO': 'success',
  Emergency: 'destructive',
  'Retreat & Planning': 'gold',
  Committee: 'info',
}

function isValidIso(dateStr?: string): dateStr is string {
  if (!dateStr) return false
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return true
  return !Number.isNaN(new Date(dateStr).getTime())
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildMarkdownSummary(minute: MeetingMinute): string {
  const lines: string[] = []
  lines.push(`# ${minute.title}`)
  lines.push('')
  const dateDisplay = isValidIso(minute.meetingDate)
    ? formatDate(minute.meetingDate)
    : minute.meetingDate || 'Date not recorded'
  const timeRange = [minute.startTime, minute.endTime].filter(Boolean).join(' – ')
  lines.push(`- **Type:** ${minute.meetingType}`)
  lines.push(`- **Date:** ${dateDisplay}${timeRange ? ` (${timeRange})` : ''}`)
  if (minute.folder) lines.push(`- **Folder:** ${minute.folder}`)
  if (minute.venue) lines.push(`- **Venue:** ${minute.venue}`)
  if (minute.chairperson) lines.push(`- **Chairperson:** ${minute.chairperson}`)
  if (minute.recorderName) lines.push(`- **Recorder:** ${minute.recorderName}`)
  lines.push(
    `- **Status:** ${minute.archived ? 'Archived' : minute.isPostedToExcos ? 'Posted to EXCOs' : 'CSGB Draft'}`
  )

  if (minute.attendees && minute.attendees.length > 0) {
    lines.push(`- **Attendees (${minute.attendees.length}):** ${minute.attendees.join(', ')}`)
  }
  if (minute.absentees && minute.absentees.length > 0) {
    lines.push(`- **Absentees:** ${minute.absentees.join(', ')}`)
  }

  if (minute.summary) {
    lines.push('', '## Executive Summary', minute.summary)
  }

  if (minute.agenda && minute.agenda.length > 0) {
    lines.push('', '## Agenda')
    minute.agenda.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item}`)
    })
  }

  if (minute.body) {
    lines.push('', '## Minutes & Proceedings', minute.body)
  }

  if (minute.decisions && minute.decisions.length > 0) {
    lines.push('', '## Key Decisions & Resolutions')
    minute.decisions.forEach((decision) => {
      lines.push(`- ${decision}`)
    })
  }

  if (minute.actionItems && minute.actionItems.length > 0) {
    lines.push('', '## Action Items')
    minute.actionItems.forEach((ai) => {
      const check = ai.status === 'done' ? 'x' : ' '
      const meta = [ai.owner, ai.dueDate ? `Due ${ai.dueDate}` : ''].filter(Boolean).join(' · ')
      lines.push(`- [${check}] ${ai.task}${meta ? ` (${meta})` : ''}`)
    })
  }

  return lines.join('\n')
}

function openPrintView(minute: MeetingMinute) {
  if (typeof window === 'undefined') return
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=880,height=720')
  if (!popup) {
    window.print()
    return
  }

  const dateDisplay = isValidIso(minute.meetingDate)
    ? formatDate(minute.meetingDate)
    : minute.meetingDate || 'Date not recorded'
  const timeRange = [minute.startTime, minute.endTime].filter(Boolean).join(' – ')
  const attendeesHtml =
    minute.attendees && minute.attendees.length > 0
      ? `<p><strong>Attendees (${minute.attendees.length}):</strong> ${escapeHtml(
          minute.attendees.join(', ')
        )}</p>`
      : ''
  const absenteesHtml =
    minute.absentees && minute.absentees.length > 0
      ? `<p><strong>Absentees:</strong> ${escapeHtml(minute.absentees.join(', '))}</p>`
      : ''
  const agendaHtml =
    minute.agenda && minute.agenda.length > 0
      ? `<h2>Agenda</h2><ol>${minute.agenda
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')}</ol>`
      : ''
  const summaryHtml = minute.summary
    ? `<h2>Executive Summary</h2><p>${escapeHtml(minute.summary)}</p>`
    : ''
  const bodyHtml = minute.body
    ? `<h2>Minutes &amp; Proceedings</h2><div class="body-copy">${escapeHtml(minute.body)}</div>`
    : ''
  const decisionsHtml =
    minute.decisions && minute.decisions.length > 0
      ? `<h2>Key Decisions &amp; Resolutions</h2><ul>${minute.decisions
          .map((d) => `<li>${escapeHtml(d)}</li>`)
          .join('')}</ul>`
      : ''
  const actionItemsHtml =
    minute.actionItems && minute.actionItems.length > 0
      ? `<h2>Action Items</h2><ul>${minute.actionItems
          .map((ai) => {
            const state = ai.status === 'done' ? '[Done]' : '[Open]'
            const meta = [ai.owner, ai.dueDate].filter(Boolean).join(' · ')
            return `<li><strong>${state}</strong> ${escapeHtml(ai.task)}${
              meta ? ` <em>(${escapeHtml(meta)})</em>` : ''
            }</li>`
          })
          .join('')}</ul>`
      : ''

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(minute.title)} — ECCF Meeting Minutes</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #111827; margin: 2rem auto; max-width: 740px; padding: 0 1rem; line-height: 1.6; }
    .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #4b5563; margin-bottom: 0.25rem; }
    h1 { font-size: 1.75rem; margin: 0 0 0.75rem; line-height: 1.25; }
    h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25rem; margin-top: 1.5rem; }
    .meta { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.875rem 1rem; font-size: 0.925rem; margin-bottom: 1.25rem; }
    .meta p { margin: 0.25rem 0; }
    .body-copy { white-space: pre-wrap; }
    ul, ol { padding-left: 1.25rem; }
    li { margin-bottom: 0.35rem; }
    @media print { body { margin: 0.5in; } }
  </style>
</head>
<body>
  <div class="eyebrow">ECCF Secretariat · ${escapeHtml(minute.meetingType)}${
    minute.folder ? ` · ${escapeHtml(minute.folder)}` : ''
  }</div>
  <h1>${escapeHtml(minute.title)}</h1>
  <div class="meta">
    <p><strong>Date:</strong> ${escapeHtml(dateDisplay)}${
    timeRange ? ` &middot; ${escapeHtml(timeRange)}` : ''
  }</p>
    ${minute.venue ? `<p><strong>Venue:</strong> ${escapeHtml(minute.venue)}</p>` : ''}
    ${
      minute.chairperson
        ? `<p><strong>Chairperson:</strong> ${escapeHtml(minute.chairperson)}</p>`
        : ''
    }
    ${
      minute.recorderName
        ? `<p><strong>Recorder:</strong> ${escapeHtml(minute.recorderName)}</p>`
        : ''
    }
    ${attendeesHtml}
    ${absenteesHtml}
  </div>
  ${summaryHtml}
  ${agendaHtml}
  ${bodyHtml}
  ${decisionsHtml}
  ${actionItemsHtml}
</body>
</html>`

  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  popup.focus()
  popup.print()
}

interface MeetingMinuteDetailSheetProps {
  minute: MeetingMinute | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canManage: boolean
  busyAction?: {
    visibilityId?: string | null
    pinId?: string | null
    archiveId?: string | null
    actionItemKey?: string | null
  }
  onEdit: (minute: MeetingMinute) => void
  onToggleVisibility: (minute: MeetingMinute) => void
  onTogglePin: (minute: MeetingMinute) => void
  onToggleArchive: (minute: MeetingMinute) => void
  onToggleActionItem: (
    minute: MeetingMinute,
    item: MeetingMinuteActionItem,
    index: number
  ) => void
  onRequestDelete: (minute: MeetingMinute) => void
}

export default function MeetingMinuteDetailSheet({
  minute,
  open,
  onOpenChange,
  canManage,
  busyAction,
  onEdit,
  onToggleVisibility,
  onTogglePin,
  onToggleArchive,
  onToggleActionItem,
  onRequestDelete,
}: MeetingMinuteDetailSheetProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!minute) return
    try {
      await navigator.clipboard.writeText(buildMarkdownSummary(minute))
      setCopied(true)
      toastSuccess('Minutes summary copied to clipboard.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toastError('Could not copy to clipboard.')
    }
  }

  const isPinned = Boolean(minute?.isPinned)
  const isPosted = Boolean(minute?.isPostedToExcos)
  const isArchived = Boolean(minute?.archived)
  const isVisibilityBusy = Boolean(minute && busyAction?.visibilityId === minute._id)
  const isPinBusy = Boolean(minute && busyAction?.pinId === minute._id)
  const isArchiveBusy = Boolean(minute && busyAction?.archiveId === minute._id)

  const actionItems = minute?.actionItems ?? []
  const doneCount = actionItems.filter((item) => item.status === 'done').length

  return (
    <RecordSheet
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-2xl"
      headerExtra={
        minute && (
          <div className="flex flex-wrap items-center gap-1.5">
            {isPinned && (
              <StatusBadge variant="gold" icon={<Pin className="h-3.5 w-3.5" />}>
                Pinned
              </StatusBadge>
            )}
            {isArchived ? (
              <StatusBadge variant="neutral">Archived</StatusBadge>
            ) : isPosted ? (
              <StatusBadge variant="success">Posted to EXCOs</StatusBadge>
            ) : (
              <StatusBadge variant="warning">CSGB Draft</StatusBadge>
            )}
            <StatusBadge
              variant={MEETING_TYPE_VARIANT[minute.meetingType] ?? 'neutral'}
              dot
            >
              {minute.meetingType}
            </StatusBadge>
            {!canManage && <StatusBadge variant="info">Read-only</StatusBadge>}
          </div>
        )
      }
      title={minute?.title ?? 'Meeting minute'}
      description={
        minute ? (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            {isValidIso(minute.meetingDate) && (
              <time
                dateTime={toDateTimeAttr(minute.meetingDate)}
                className="tabular-nums"
              >
                {formatDate(minute.meetingDate)}
              </time>
            )}
            {(minute.startTime || minute.endTime) && (
              <span className="tabular-nums">
                · {[minute.startTime, minute.endTime].filter(Boolean).join(' – ')}
              </span>
            )}
            {minute.folder && <span>· {minute.folder}</span>}
          </span>
        ) : undefined
      }
      footer={
        minute &&
        (canManage ? (
          <div className="flex w-full flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onEdit(minute)}
                  className="min-h-11 gap-1.5 md:min-h-10"
                >
                  <Edit className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Edit</span>
                </Button>

                <Button
                  type="button"
                  variant={isPosted ? 'outline' : 'default'}
                  onClick={() => onToggleVisibility(minute)}
                  disabled={isVisibilityBusy}
                  aria-busy={isVisibilityBusy || undefined}
                  className="min-h-11 gap-1.5 md:min-h-10"
                >
                  {isVisibilityBusy ? (
                    <Loader2
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  ) : isPosted ? (
                    <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{isPosted ? 'Move to CSGB Draft' : 'Post to EXCOs'}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onTogglePin(minute)}
                  disabled={isPinBusy || isArchived}
                  aria-pressed={isPinned}
                  className={cn(
                    'min-h-11 gap-1.5 md:min-h-10',
                    isPinned && 'bg-gold/15 text-gold-foreground dark:text-gold'
                  )}
                >
                  {isPinBusy ? (
                    <Loader2
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  ) : (
                    <Pin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onToggleArchive(minute)}
                  disabled={isArchiveBusy}
                  className="min-h-11 gap-1.5 md:min-h-10"
                >
                  {isArchiveBusy ? (
                    <Loader2
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  ) : isArchived ? (
                    <ArchiveRestore className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <Archive className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{isArchived ? 'Restore' : 'Archive'}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onRequestDelete(minute)}
                  className="min-h-11 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive md:min-h-10"
                >
                  <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Read-only · Posted by CSGB Secretariat</span>
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-h-11 w-full sm:w-auto md:min-h-10"
            >
              Close
            </Button>
          </div>
        ))
      }
    >
      {minute && (
        <div className="space-y-6">
          {/* Utility actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="min-h-11 gap-1.5 md:min-h-10"
            >
              {copied ? (
                <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{copied ? 'Copied summary' : 'Copy summary'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => openPrintView(minute)}
              className="min-h-11 gap-1.5 md:min-h-10"
            >
              <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Print view</span>
            </Button>
          </div>

          {/* Metadata Strip */}
          <dl className="grid grid-cols-1 gap-3.5 rounded-[var(--radius-card)] bg-surface-raised p-4 text-sm sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
                <FolderOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Folder / Session</span>
              </dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {minute.folder || 'Unfiled'}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Venue</span>
              </dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {minute.venue || 'Not specified'}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Meeting Date</span>
              </dt>
              <dd className="mt-0.5 font-medium text-foreground tabular-nums">
                {isValidIso(minute.meetingDate) ? (
                  <>
                    <time dateTime={toDateTimeAttr(minute.meetingDate)}>
                      {formatDate(minute.meetingDate)}
                    </time>
                    <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">
                      ({formatRelativeDay(minute.meetingDate)})
                    </span>
                  </>
                ) : (
                  'Not recorded'
                )}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Duration / Time</span>
              </dt>
              <dd className="mt-0.5 font-medium text-foreground tabular-nums">
                {minute.startTime || minute.endTime
                  ? [minute.startTime, minute.endTime].filter(Boolean).join(' – ')
                  : 'Not recorded'}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
                <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Chairperson</span>
              </dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {minute.chairperson || 'Not recorded'}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="text-[13px] font-medium text-muted-foreground">
                Recorder / Secretary
              </dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {minute.recorderName || minute.createdByName || 'CSGB Secretariat'}
              </dd>
            </div>

            {isPosted && (
              <div className="sm:col-span-2">
                <dt className="text-[13px] font-medium text-muted-foreground">
                  EXCO Publication
                </dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-foreground">
                  <StatusBadge variant="success">Visible to all EXCOs</StatusBadge>
                  {isValidIso(minute.postedAt) && (
                    <span className="text-muted-foreground tabular-nums">
                      Posted{' '}
                      <time dateTime={toDateTimeAttr(minute.postedAt)}>
                        {formatDate(minute.postedAt)}
                      </time>
                      {minute.postedBy ? ` by ${minute.postedBy}` : ''}
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>

          {/* Attendance */}
          {((minute.attendees && minute.attendees.length > 0) ||
            (minute.absentees && minute.absentees.length > 0)) && (
            <section aria-labelledby="minute-attendance-heading" className="space-y-3">
              <h3
                id="minute-attendance-heading"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Attendance</span>
              </h3>

              {minute.attendees && minute.attendees.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-foreground tabular-nums">
                    Present ({formatCount(minute.attendees.length)})
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {minute.attendees.map((person, idx) => (
                      <li
                        key={`${person}-${idx}`}
                        className="rounded-[var(--radius-pill)] bg-surface-raised px-3 py-1 text-[13px] font-medium text-foreground"
                      >
                        {person}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {minute.absentees && minute.absentees.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-muted-foreground tabular-nums">
                    Absent / Excused ({formatCount(minute.absentees.length)})
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {minute.absentees.map((person, idx) => (
                      <li
                        key={`${person}-${idx}`}
                        className="rounded-[var(--radius-pill)] bg-muted px-3 py-1 text-[13px] text-muted-foreground"
                      >
                        {person}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Executive Summary */}
          {minute.summary && (
            <section aria-labelledby="minute-summary-heading" className="space-y-2">
              <h3
                id="minute-summary-heading"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Executive Summary
              </h3>
              <p className="max-w-prose rounded-[var(--radius-card)] bg-accent/50 p-4 text-[15px] leading-[1.6] text-foreground [text-wrap:pretty]">
                {minute.summary}
              </p>
            </section>
          )}

          {/* Agenda */}
          {minute.agenda && minute.agenda.length > 0 && (
            <section aria-labelledby="minute-agenda-heading" className="space-y-2">
              <h3
                id="minute-agenda-heading"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Agenda ({formatCount(minute.agenda.length)})
              </h3>
              <ol className="list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-foreground">
                {minute.agenda.map((item, idx) => (
                  <li key={`${item}-${idx}`} className="[text-wrap:pretty]">
                    {item}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Full Minutes Body */}
          {minute.body && (
            <section aria-labelledby="minute-body-heading" className="space-y-2">
              <h3
                id="minute-body-heading"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Minutes &amp; Proceedings
              </h3>
              <div className="max-w-prose whitespace-pre-wrap text-[15px] leading-[1.65] text-foreground [text-wrap:pretty]">
                {minute.body}
              </div>
            </section>
          )}

          {/* Key Decisions */}
          {minute.decisions && minute.decisions.length > 0 && (
            <section aria-labelledby="minute-decisions-heading" className="space-y-2">
              <h3
                id="minute-decisions-heading"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Key Decisions &amp; Resolutions
              </h3>
              <ul className="space-y-2 rounded-[var(--radius-card)] bg-surface-raised p-4">
                {minute.decisions.map((decision, idx) => (
                  <li
                    key={`${decision}-${idx}`}
                    className="flex items-start gap-2.5 text-[15px] leading-relaxed text-foreground"
                  >
                    <CheckCircle2
                      className="mt-1 h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="[text-wrap:pretty]">{decision}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Action Items */}
          {actionItems.length > 0 && (
            <section aria-labelledby="minute-actions-heading" className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3
                  id="minute-actions-heading"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Action Items
                </h3>
                <span className="text-[13px] font-medium text-muted-foreground tabular-nums">
                  {formatCount(doneCount)} of {formatCount(actionItems.length)} completed
                </span>
              </div>

              <ul className="space-y-2">
                {actionItems.map((item, idx) => {
                  const itemId = item._key || String(idx)
                  const isDone = item.status === 'done'
                  const isItemBusy = busyAction?.actionItemKey === itemId

                  return (
                    <li
                      key={itemId}
                      className={cn(
                        'rounded-[var(--radius-card)] bg-surface-raised p-3.5 transition-colors',
                        isDone && 'opacity-85'
                      )}
                    >
                      {canManage ? (
                        <div className="flex items-start gap-3">
                          <label className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center md:min-h-10 md:min-w-10">
                            {isItemBusy ? (
                              <Loader2
                                className="h-4 w-4 animate-spin text-primary motion-reduce:animate-none"
                                aria-hidden="true"
                              />
                            ) : (
                              <Checkbox
                                checked={isDone}
                                onCheckedChange={() =>
                                  onToggleActionItem(minute, item, idx)
                                }
                                disabled={isItemBusy}
                                aria-label={`Mark action item "${item.task}" as ${
                                  isDone ? 'open' : 'done'
                                }`}
                                className="h-5 w-5"
                              />
                            )}
                          </label>

                          <div className="min-w-0 flex-1 space-y-1 pt-1">
                            <p
                              className={cn(
                                'text-sm font-medium leading-snug text-foreground [text-wrap:pretty]',
                                isDone && 'line-through text-muted-foreground'
                              )}
                            >
                              {item.task}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                              <StatusBadge variant={isDone ? 'success' : 'warning'}>
                                {isDone ? 'Done' : 'Open'}
                              </StatusBadge>
                              {item.owner && <span>Owner: {item.owner}</span>}
                              {isValidIso(item.dueDate) && (
                                <span className="tabular-nums">
                                  Due{' '}
                                  <time dateTime={toDateTimeAttr(item.dueDate)}>
                                    {formatDate(item.dueDate)}
                                  </time>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 shrink-0" aria-hidden="true">
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <Circle className="h-5 w-5 text-warning" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p
                              className={cn(
                                'text-sm font-medium leading-snug text-foreground [text-wrap:pretty]',
                                isDone && 'line-through text-muted-foreground'
                              )}
                            >
                              {item.task}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                              <StatusBadge variant={isDone ? 'success' : 'warning'}>
                                {isDone ? 'Done' : 'Open'}
                              </StatusBadge>
                              {item.owner && <span>Owner: {item.owner}</span>}
                              {isValidIso(item.dueDate) && (
                                <span className="tabular-nums">
                                  Due{' '}
                                  <time dateTime={toDateTimeAttr(item.dueDate)}>
                                    {formatDate(item.dueDate)}
                                  </time>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* Tags */}
          {minute.tags && minute.tags.length > 0 && (
            <section aria-labelledby="minute-tags-heading" className="space-y-2">
              <h3
                id="minute-tags-heading"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Tags
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {minute.tags.map((tag, idx) => (
                  <li
                    key={`${tag}-${idx}`}
                    className="rounded-[var(--radius-pill)] bg-muted px-3 py-1 text-[13px] font-medium text-muted-foreground"
                  >
                    #{tag}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Separator />

          {/* Audit Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted-foreground">
            <span>
              Recorded by{' '}
              <strong className="font-medium text-foreground">
                {minute.createdByName || minute.recorderName || 'CSGB Secretariat'}
              </strong>
            </span>
            {isValidIso(minute.updatedAt || minute._updatedAt) && (
              <span className="tabular-nums">
                Updated{' '}
                <time
                  dateTime={toDateTimeAttr((minute.updatedAt || minute._updatedAt)!)}
                >
                  {formatDate((minute.updatedAt || minute._updatedAt)!)}
                </time>
                {minute.updatedByName ? ` by ${minute.updatedByName}` : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </RecordSheet>
  )
}
