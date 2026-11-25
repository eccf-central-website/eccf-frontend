'use client'

import * as React from 'react'
import { useEffect, useId, useMemo, useState, useTransition } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react'
import type { WorkerRow, ECCFSession } from '@/types'
import type { TeamUnitOption } from '@/lib/dashboard/attendance-constants'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import {
  sendWorkerEmailAction,
  type EmailAudienceType,
} from '@/app/actions/worker-email-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'
import { formatCount } from '@/lib/dashboard/format'
import { cn } from '@/lib/utils'

export interface EmailTemplate {
  id: string
  label: string
  subject: string
  body: string
}

export const QUICK_EMAIL_TEMPLATES: readonly EmailTemplate[] = [
  {
    id: 'team-meeting',
    label: 'Team Meeting',
    subject: 'Upcoming Team Meeting & Review',
    body: 'Dear Worker,\n\nGrace and peace to you in the name of our Lord Jesus Christ.\n\nPlease be reminded of our upcoming team review and prayer session this week. Your presence and dedication are deeply appreciated.\n\nTime: 4:30 PM\nVenue: Fellowship Chapel\n\nRemain blessed in His service!',
  },
  {
    id: 'sunday-roster',
    label: 'Sunday Roster',
    subject: 'Sunday Service Roster & Preparation',
    body: 'Dear Brethren,\n\nWe thank God for the privilege to serve in His sanctuary this coming Sunday.\n\nKindly note your reporting time is 07:30 AM sharp for pre-service prayers and readiness check. Let us come prepared in the spirit.\n\nGod bless you abundantly!',
  },
  {
    id: 'welfare-checkin',
    label: 'Welfare Check-in',
    subject: 'Fellowship Welfare & Academic Check-in',
    body: 'Beloved Worker,\n\nJust checking in on your welfare, spiritual walk, and academic progress this semester. If there is any need or prayer request you would like the leadership to stand in faith with you for, please reach out to us.\n\nYou are valued and prayed for constantly.',
  },
]

function normalizeTeamName(value?: string | null): string {
  return (value || '').toLowerCase().trim().replace(/\s+team$/, '')
}

function workerMatchesTeam(worker: WorkerRow, targetTeam: string): boolean {
  const normTarget = normalizeTeamName(targetTeam)
  if (!normTarget) return false
  if (normalizeTeamName(worker.team) === normTarget) return true
  return Boolean(
    worker.teams?.some((t) => normalizeTeamName(t) === normTarget)
  )
}

export function getEligibleEmailWorkers(
  workers: WorkerRow[],
  session: ECCFSession
): WorkerRow[] {
  if (session.role === 'admin') return workers
  const allowed = [session.team, ...(session.teams || []), session.leadingTeam]
    .filter(Boolean)
    .map((t) => normalizeTeamName(t))

  return workers.filter((w) => {
    const wt = normalizeTeamName(w.team)
    const matchPrimary = allowed.includes(wt)
    const matchSecondary = w.teams?.some((t) =>
      allowed.includes(normalizeTeamName(t))
    )
    return matchPrimary || matchSecondary
  })
}

export function getAudienceLabel(audienceType: EmailAudienceType): string {
  switch (audienceType) {
    case 'all_workers':
      return 'All Workers'
    case 'all_excos':
      return 'All EXCOs'
    case 'team':
      return 'Operational Team'
    case 'specific_worker':
      return 'Specific Worker'
  }
}

export interface WorkerEmailComposerProps {
  session: ECCFSession
  workers: WorkerRow[]
  teamOptions: TeamUnitOption[]
  preselectedWorker?: WorkerRow | null
  preselectedAudience?: EmailAudienceType
  /** Optional key/boolean to sync preselected props when a dialog re-opens. */
  syncKey?: boolean | string | number
  showTemplates?: boolean
  onCancel?: () => void
  onSuccess?: () => void
  className?: string
}

export function WorkerEmailComposer({
  session,
  workers,
  teamOptions,
  preselectedWorker,
  preselectedAudience,
  syncKey,
  showTemplates = true,
  onCancel,
  onSuccess,
  className,
}: WorkerEmailComposerProps) {
  const teamNames = useMemo(
    () => teamOptions.map((option) => option.name),
    [teamOptions]
  )
  const isAdmin = session.role === 'admin'
  const [isPending, startTransition] = useTransition()

  const audienceHeadingId = useId()
  const teamSelectId = useId()
  const workerSearchId = useId()
  const subjectId = useId()
  const messageId = useId()

  const defaultTeam = session.leadingTeam || session.team || teamNames[0] || ''

  const [audienceType, setAudienceType] = useState<EmailAudienceType>(() => {
    if (preselectedWorker) return 'specific_worker'
    if (preselectedAudience) return preselectedAudience
    return isAdmin ? 'all_workers' : 'team'
  })
  const [targetTeam, setTargetTeam] = useState<string>(
    preselectedWorker?.team || defaultTeam
  )
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(
    preselectedWorker?._id || ''
  )
  const [workerSearch, setWorkerSearch] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (preselectedWorker) {
      setAudienceType('specific_worker')
      setSelectedWorkerId(preselectedWorker._id)
      setTargetTeam(preselectedWorker.team || defaultTeam)
    } else if (preselectedAudience) {
      setAudienceType(preselectedAudience)
    } else if (!isAdmin) {
      setAudienceType('team')
      setTargetTeam(defaultTeam)
    }
  }, [preselectedWorker, preselectedAudience, syncKey, isAdmin, defaultTeam])

  const eligibleWorkers = useMemo(
    () => getEligibleEmailWorkers(workers, session),
    [workers, session]
  )

  const searchedWorkers = useMemo(() => {
    if (!workerSearch.trim()) return eligibleWorkers
    const q = workerSearch.toLowerCase().trim()
    return eligibleWorkers.filter(
      (w) =>
        w.fullName.toLowerCase().includes(q) ||
        (w.team && w.team.toLowerCase().includes(q)) ||
        (w.hall && w.hall.toLowerCase().includes(q))
    )
  }, [eligibleWorkers, workerSearch])

  const estimatedRecipientCount = useMemo(() => {
    if (audienceType === 'all_workers') {
      return workers.filter((w) => Boolean(w.email)).length
    }
    if (audienceType === 'all_excos') {
      return workers.filter(
        (w) =>
          Boolean(w.email) &&
          (Boolean(w.role) || Boolean(w.excoPosition) || w.isExcoApproved === true)
      ).length
    }
    if (audienceType === 'team') {
      return workers.filter(
        (w) => Boolean(w.email) && workerMatchesTeam(w, targetTeam)
      ).length
    }
    if (audienceType === 'specific_worker') {
      const target = eligibleWorkers.find((w) => w._id === selectedWorkerId)
      return target?.email ? 1 : 0
    }
    return 0
  }, [audienceType, targetTeam, selectedWorkerId, workers, eligibleWorkers])

  const selectedWorkerObj = useMemo(
    () => eligibleWorkers.find((w) => w._id === selectedWorkerId),
    [eligibleWorkers, selectedWorkerId]
  )

  const audienceOptions = useMemo(() => {
    const base: Array<{
      id: EmailAudienceType
      title: string
      description: string
      icon: React.ReactNode
    }> = []

    if (isAdmin) {
      base.push(
        {
          id: 'all_workers',
          title: `All Workers (${formatCount(workers.filter((w) => Boolean(w.email)).length)})`,
          description: 'Fellowship-wide broadcast to all units',
          icon: <Users className="h-4 w-4 shrink-0" aria-hidden="true" />,
        },
        {
          id: 'all_excos',
          title: 'All EXCOs',
          description: 'Executive Council & unit leads',
          icon: <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />,
        }
      )
    }

    base.push(
      {
        id: 'team',
        title: isAdmin ? 'Operational Team' : `All ${session.leadingTeam || session.team}`,
        description: isAdmin
          ? 'Broadcast to a specific department'
          : 'All active workers in your team',
        icon: <Users className="h-4 w-4 shrink-0" aria-hidden="true" />,
      },
      {
        id: 'specific_worker',
        title: 'Specific Worker',
        description: 'Direct email to one worker',
        icon: <User className="h-4 w-4 shrink-0" aria-hidden="true" />,
      }
    )

    return base
  }, [isAdmin, workers, session.leadingTeam, session.team])

  function applyTemplate(template: EmailTemplate) {
    setSubject(template.subject)
    setMessage(template.body)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!subject.trim()) {
      toastError('Please enter an email subject.')
      return
    }
    if (!message.trim() || message.trim().length < 5) {
      toastError('Please enter a message of at least 5 characters.')
      return
    }
    if (audienceType === 'specific_worker' && !selectedWorkerId) {
      toastError('Please select a specific recipient worker.')
      return
    }

    startTransition(async () => {
      try {
        const res = await sendWorkerEmailAction({
          audienceType,
          targetTeam: audienceType === 'team' ? targetTeam : undefined,
          workerId: audienceType === 'specific_worker' ? selectedWorkerId : undefined,
          subject: subject.trim(),
          message: message.trim(),
        })

        if (res.ok) {
          toastSuccess(res.data.message)
          setSubject('')
          setMessage('')
          onSuccess?.()
        } else {
          toastError(res.error || 'Failed to dispatch email.')
        }
      } catch (err) {
        console.error('Send email error:', err)
        toastError('A network error occurred while dispatching the email.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-5', className)}>
      {/* Audience selector */}
      <div className="space-y-2">
        <span
          id={audienceHeadingId}
          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Target Recipient Audience
        </span>
        <div
          role="radiogroup"
          aria-labelledby={audienceHeadingId}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {audienceOptions.map((option) => {
            const isSelected = audienceType === option.id
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setAudienceType(option.id)}
                className={cn(
                  'flex min-h-11 items-start gap-3 rounded-[var(--radius-control)] p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                  isSelected
                    ? 'bg-primary/10 text-foreground ring-1 ring-inset ring-primary/40'
                    : 'bg-surface-raised text-foreground hover:bg-muted/70'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground'
                  )}
                >
                  {option.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground leading-snug">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted-foreground leading-snug">
                    {option.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Team Picker */}
      {audienceType === 'team' && (
        <div className="space-y-2 rounded-[var(--radius-control)] bg-surface-raised p-4">
          {isAdmin ? (
            <div className="space-y-1.5 sm:max-w-xs">
              <Label
                htmlFor={teamSelectId}
                className="text-[13px] font-semibold text-foreground"
              >
                Select Department
              </Label>
              <Select value={targetTeam} onValueChange={setTargetTeam}>
                <SelectTrigger
                  id={teamSelectId}
                  aria-label="Select target operational team"
                  className="min-h-11 md:min-h-10 bg-card text-sm"
                >
                  <SelectValue placeholder="Choose a team…" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {teamNames.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : session.teams && session.teams.length > 1 ? (
            <div className="space-y-1.5 sm:max-w-xs">
              <Label
                htmlFor={teamSelectId}
                className="text-[13px] font-semibold text-foreground"
              >
                Select Your Team
              </Label>
              <Select value={targetTeam} onValueChange={setTargetTeam}>
                <SelectTrigger
                  id={teamSelectId}
                  aria-label="Select target operational team"
                  className="min-h-11 md:min-h-10 bg-card text-sm"
                >
                  <SelectValue placeholder="Choose your team…" />
                </SelectTrigger>
                <SelectContent>
                  {session.teams.filter(Boolean).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>Target team: {session.leadingTeam || session.team}</span>
            </div>
          )}
        </div>
      )}

      {/* Specific Worker Picker */}
      {audienceType === 'specific_worker' && (
        <div className="space-y-3 rounded-[var(--radius-control)] bg-surface-raised p-4">
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor={workerSearchId}
              className="text-[13px] font-semibold text-foreground"
            >
              Select Recipient Worker
            </Label>
            <span className="text-[13px] text-muted-foreground tabular-nums">
              {formatCount(eligibleWorkers.length)} available
            </span>
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id={workerSearchId}
              type="text"
              placeholder="Search worker by name, team, or hall…"
              value={workerSearch}
              onChange={(e) => setWorkerSearch(e.target.value)}
              enterKeyHint="search"
              className="pl-9 bg-card min-h-11 md:min-h-10 text-sm"
            />
          </div>

          <div
            role="listbox"
            aria-label="Eligible workers"
            className="max-h-48 overflow-y-auto rounded-[var(--radius-control)] bg-card p-1 space-y-1"
          >
            {searchedWorkers.length === 0 ? (
              <p className="p-4 text-center text-[13px] text-muted-foreground">
                No matching workers found.
              </p>
            ) : (
              searchedWorkers.map((w) => {
                const isSelected = selectedWorkerId === w._id
                const hasEmail = Boolean(w.email)
                return (
                  <button
                    key={w._id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => setSelectedWorkerId(w._id)}
                    className={cn(
                      'w-full min-h-11 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSelected
                        ? 'bg-primary/10 text-accent-foreground dark:text-primary font-semibold'
                        : 'hover:bg-muted/60 text-foreground'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{w.fullName}</p>
                      <p className="truncate text-[13px] text-muted-foreground">
                        {w.team || 'Unassigned'} · {w.hall || 'No hall'}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {hasEmail ? (
                        <StatusBadge variant="success" dot>
                          Ready
                        </StatusBadge>
                      ) : (
                        <StatusBadge variant="destructive" dot>
                          No email
                        </StatusBadge>
                      )}
                      {isSelected && (
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {selectedWorkerObj && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[13px] text-accent-foreground dark:text-primary">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Selected: <strong>{selectedWorkerObj.fullName}</strong> (
                  {selectedWorkerObj.team || 'Unassigned'})
                </span>
              </span>
              {!selectedWorkerObj.email && (
                <span className="font-semibold text-destructive">
                  Missing email address
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Templates */}
      {showTemplates && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Sparkles
              className="h-4 w-4 shrink-0 text-gold-foreground dark:text-gold"
              aria-hidden="true"
            />
            <span className="font-semibold text-foreground">Quick Templates</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_EMAIL_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                type="button"
                variant="outline"
                onClick={() => applyTemplate(template)}
                className="min-h-11 md:min-h-10 px-3.5 text-[13px] font-medium"
              >
                {template.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Subject */}
      <div className="space-y-1.5">
        <Label
          htmlFor={subjectId}
          className="text-[13px] font-semibold text-foreground"
        >
          Subject
        </Label>
        <Input
          id={subjectId}
          name="subject"
          type="text"
          placeholder="e.g. Schedule Update for Fellowship Encounter"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          required
          className="min-h-11 md:min-h-10 bg-background text-sm"
        />
      </div>

      {/* Message Body */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label
            htmlFor={messageId}
            className="text-[13px] font-semibold text-foreground"
          >
            Message Body
          </Label>
          <span className="text-[13px] text-muted-foreground tabular-nums">
            {formatCount(message.length)} characters
          </span>
        </div>
        <textarea
          id={messageId}
          name="message"
          rows={5}
          placeholder="Write your official announcement or instructions to workers here…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={5}
          className="w-full rounded-[var(--radius-control)] border border-input bg-background p-3.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-y"
        />
      </div>

      {/* Recipient summary & Actions */}
      <div className="flex flex-col gap-3 rounded-[var(--radius-control)] bg-surface-raised p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          <AlertCircle
            className="h-4 w-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span>
            Scope:{' '}
            <strong className="text-foreground">
              {getAudienceLabel(audienceType)}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Recipients:{' '}
            <strong className="text-foreground tabular-nums">
              {formatCount(estimatedRecipientCount)}
            </strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onCancel}
              className="min-h-11 md:min-h-10"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending || estimatedRecipientCount === 0}
            aria-busy={isPending || undefined}
            className="min-h-11 md:min-h-10 px-5 font-semibold"
          >
            {isPending ? (
              <>
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <span>Sending…</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="tabular-nums">
                  Send Mail ({formatCount(estimatedRecipientCount)})
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

interface SendWorkerEmailCardProps {
  session: ECCFSession
  workers: WorkerRow[]
  teamOptions: TeamUnitOption[]
  defaultExpanded?: boolean
  hideHeader?: boolean
  className?: string
}

export default function SendWorkerEmailCard({
  session,
  workers,
  teamOptions,
  defaultExpanded = true,
  hideHeader = false,
  className = '',
}: SendWorkerEmailCardProps) {
  const isAdmin = session.role === 'admin'
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] bg-card p-5 shadow-sm sm:p-6',
        className
      )}
    >
      {!hideHeader && (
        <div className="flex items-center justify-between gap-3 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-primary/10 text-accent-foreground dark:text-primary">
              <Mail className="h-5 w-5 shrink-0" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Workforce Communications
              </p>
              <h2 className="font-sans text-lg font-semibold text-foreground leading-snug truncate">
                {isAdmin
                  ? 'Compose Fellowship Email'
                  : `Compose Email to ${session.leadingTeam || session.team}`}
              </h2>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className="min-h-11 md:min-h-10 shrink-0 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <span>{isExpanded ? 'Collapse' : 'Compose'}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
          </Button>
        </div>
      )}

      {isExpanded && (
        <WorkerEmailComposer
          session={session}
          workers={workers}
          teamOptions={teamOptions}
        />
      )}
    </div>
  )
}
