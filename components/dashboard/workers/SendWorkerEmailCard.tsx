'use client'

import * as React from 'react'
import { useState, useMemo, useTransition } from 'react'
import {
  Mail,
  Send,
  Users,
  ShieldCheck,
  User,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react'
import type { WorkerRow, ECCFSession } from '@/types'
import type { TeamUnitOption } from '@/lib/dashboard/attendance-constants'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { sendWorkerEmailAction, type EmailAudienceType } from '@/app/actions/worker-email-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'

interface SendWorkerEmailCardProps {
  session: ECCFSession
  workers: WorkerRow[]
  teamOptions: TeamUnitOption[]
  defaultExpanded?: boolean
  className?: string
}

export default function SendWorkerEmailCard({
  session,
  workers,
  teamOptions,
  defaultExpanded = true,
  className = '',
}: SendWorkerEmailCardProps) {
  const teamNames = teamOptions.map((option) => option.name)
  const isAdmin = session.role === 'admin'
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [audienceType, setAudienceType] = useState<EmailAudienceType>(
    isAdmin ? 'all_workers' : 'team'
  )
  const [targetTeam, setTargetTeam] = useState<string>(
    session.team || teamNames[0] || ''
  )
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('')
  const [workerSearch, setWorkerSearch] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  // Filter eligible workers based on caller role
  const eligibleWorkers = useMemo(() => {
    if (isAdmin) return workers
    const allowed = [session.team, ...(session.teams || []), session.leadingTeam]
      .filter(Boolean)
      .map((t) => (t || '').toLowerCase().trim().replace(/\s+team$/, ''))

    return workers.filter((w) => {
      const wt = (w.team || '').toLowerCase().trim().replace(/\s+team$/, '')
      const matchPrimary = allowed.includes(wt)
      const matchSecondary = w.teams?.some((t) =>
        allowed.includes((t || '').toLowerCase().trim().replace(/\s+team$/, ''))
      )
      return matchPrimary || matchSecondary
    })
  }, [workers, isAdmin, session.team, session.teams, session.leadingTeam])

  // Search filtered workers
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

  // Estimated recipient count based on in-memory workers
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
      const normTarget = (targetTeam || '').toLowerCase().trim().replace(/\s+team$/, '')
      return workers.filter((w) => {
        if (!w.email) return false
        const wt = (w.team || '').toLowerCase().trim().replace(/\s+team$/, '')
        if (wt === normTarget) return true
        return w.teams?.some(
          (t) => (t || '').toLowerCase().trim().replace(/\s+team$/, '') === normTarget
        )
      }).length
    }
    if (audienceType === 'specific_worker') {
      const target = eligibleWorkers.find((w) => w._id === selectedWorkerId)
      return target?.email ? 1 : 0
    }
    return 0
  }, [audienceType, targetTeam, selectedWorkerId, workers, eligibleWorkers])

  const selectedWorkerObj = useMemo(() => {
    return eligibleWorkers.find((w) => w._id === selectedWorkerId)
  }, [eligibleWorkers, selectedWorkerId])

  function handleSend() {
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
    <div
      className={`rounded-2xl border border-border bg-card p-5 shadow-xs transition-all ${className}`}
    >
      {/* Header bar with toggle */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Mail className="h-4 w-4 shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
                Workforce Email Dispatcher
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                Resend API
              </span>
            </div>
            <h3 className="font-serif font-bold text-lg text-foreground leading-tight truncate">
              {isAdmin ? 'Send Mails to Fellowship Workers' : `Send Mails to ${session.team}`}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span>{isExpanded ? 'Collapse' : 'Compose'}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-4">
          {/* ================================================================ */}
          {/* AUDIENCE SELECTOR PILLS                                          */}
          {/* ================================================================ */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Target Recipient Audience</Label>
            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => setAudienceType('all_workers')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      audienceType === 'all_workers'
                        ? 'bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20'
                        : 'bg-muted/40 border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>All Workers ({workers.filter((w) => Boolean(w.email)).length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudienceType('all_excos')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      audienceType === 'all_excos'
                        ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-500/20'
                        : 'bg-muted/40 border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>All EXCOs</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setAudienceType('team')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  audienceType === 'team'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-muted/40 border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>{isAdmin ? 'Specific Team' : `All ${session.team}`}</span>
              </button>

              <button
                type="button"
                onClick={() => setAudienceType('specific_worker')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  audienceType === 'specific_worker'
                    ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-muted/40 border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <User className="h-3.5 w-3.5 shrink-0" />
                <span>Specific Worker</span>
              </button>
            </div>
          </div>

          {/* Conditional Controls */}
          {audienceType === 'team' && isAdmin && (
            <div className="w-full sm:w-72">
              <Label className="text-xs font-bold text-foreground block mb-1">Select Department</Label>
              <Select value={targetTeam} onValueChange={setTargetTeam}>
                <SelectTrigger className="h-10 bg-background border-input text-foreground text-xs">
                  <SelectValue placeholder="Pick team..." />
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
          )}

          {audienceType === 'specific_worker' && (
            <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">Select Worker</Label>
                <span className="text-[11px] text-muted-foreground">{eligibleWorkers.length} workers eligible</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search worker by name..."
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  className="pl-9 h-9 bg-background text-foreground text-xs rounded-lg border-input"
                />
              </div>

              <div className="max-h-36 overflow-y-auto rounded-lg border border-border bg-card divide-y divide-border/60">
                {searchedWorkers.map((w) => {
                  const isSelected = selectedWorkerId === w._id
                  return (
                    <button
                      key={w._id}
                      type="button"
                      onClick={() => setSelectedWorkerId(w._id)}
                      className={`w-full flex items-center justify-between p-2 text-left text-xs transition-colors ${
                        isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="truncate">
                        <p className="truncate font-semibold">{w.fullName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{w.team} • {w.hall || 'No hall'}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  )
                })}
              </div>

              {selectedWorkerObj && (
                <p className="text-xs font-semibold text-primary">
                  Target: {selectedWorkerObj.fullName} ({selectedWorkerObj.team})
                </p>
              )}
            </div>
          )}

          {/* Subject & Message Input Box */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="inline-subject" className="text-xs font-bold text-foreground block mb-1">
                Subject
              </Label>
              <Input
                id="inline-subject"
                type="text"
                placeholder="e.g. Schedule Update for Fellowship Encounter"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-10 rounded-xl bg-background border-input text-foreground text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="inline-message" className="text-xs font-bold text-foreground">
                  Message Content Box
                </Label>
                <span className="text-[11px] text-muted-foreground">{message.length} chars</span>
              </div>
              <textarea
                id="inline-message"
                rows={4}
                placeholder="Type your official announcement or instructions to workers here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Recipients:</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-bold">
                {estimatedRecipientCount}
              </span>
              <span className="text-muted-foreground text-[11px]">
                ({audienceType.replace('_', ' ').toUpperCase()})
              </span>
            </div>

            <Button
              type="button"
              disabled={isPending || estimatedRecipientCount === 0}
              onClick={handleSend}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs px-5 h-9"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 shrink-0 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 shrink-0 mr-1.5" />
                  Send Mail ({estimatedRecipientCount})
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
