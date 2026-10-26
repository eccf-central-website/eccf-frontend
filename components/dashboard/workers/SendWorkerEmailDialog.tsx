'use client'

import * as React from 'react'
import { useState, useMemo, useTransition, useEffect } from 'react'
import {
  Mail,
  Send,
  Users,
  ShieldCheck,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Search,
} from 'lucide-react'
import type { WorkerRow, ECCFSession } from '@/types'
import type { TeamUnitOption } from '@/lib/dashboard/attendance-constants'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/dashboard/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { sendWorkerEmailAction, type EmailAudienceType } from '@/app/actions/worker-email-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'

interface SendWorkerEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: ECCFSession
  workers: WorkerRow[]
  teamOptions: TeamUnitOption[]
  preselectedWorker?: WorkerRow | null
  preselectedAudience?: EmailAudienceType
}

export default function SendWorkerEmailDialog({
  open,
  onOpenChange,
  session,
  workers,
  teamOptions,
  preselectedWorker,
  preselectedAudience,
}: SendWorkerEmailDialogProps) {
  const teamNames = teamOptions.map((option) => option.name)
  const isAdmin = session.role === 'admin'
  const [isPending, startTransition] = useTransition()

  // Form states
  const [audienceType, setAudienceType] = useState<EmailAudienceType>(() => {
    if (preselectedWorker) return 'specific_worker'
    if (preselectedAudience) return preselectedAudience
    return isAdmin ? 'all_workers' : 'team'
  })

  const [targetTeam, setTargetTeam] = useState<string>(() => {
    return session.team || teamNames[0] || ''
  })

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(() => {
    return preselectedWorker?._id || ''
  })

  const [workerSearch, setWorkerSearch] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  // Sync state when preselectedWorker or open status changes
  useEffect(() => {
    if (preselectedWorker) {
      setAudienceType('specific_worker')
      setSelectedWorkerId(preselectedWorker._id)
      setTargetTeam(preselectedWorker.team || session.team)
    } else if (open && !preselectedAudience) {
      if (!isAdmin) {
        setAudienceType('team')
        setTargetTeam(session.team)
      }
    }
  }, [preselectedWorker, open, preselectedAudience, isAdmin, session.team])

  // Filter eligible workers based on caller's role
  const eligibleWorkers = useMemo(() => {
    if (isAdmin) return workers
    // Non-admin can only target workers in their team(s)
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

  // Search filtered workers for the specific worker picker
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

  // Quick message template insertion
  function applyTemplate(tmplSubject: string, tmplBody: string) {
    setSubject(tmplSubject)
    setMessage(tmplBody)
  }

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
          onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 rounded-2xl bg-card border-0 shadow-2xl text-card-foreground">
        <DialogHeader className="pb-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-primary">
            <Mail className="h-4 w-4 shrink-0" />
            <span>Exco Communication Portal</span>
          </div>
          <DialogTitle className="font-serif text-2xl font-black text-foreground tracking-tight">
            Send Email to Workers
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isAdmin
              ? 'Broadcast fellowship-wide notifications, email all EXCOs, or message specific operational units and individuals.'
              : `Compose and dispatch official email updates to workers in ${session.team}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* ================================================================ */}
          {/* AUDIENCE SELECTOR                                                */}
          {/* ================================================================ */}
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase font-bold text-muted-foreground">
              Recipient Audience
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* CSGB Admin Options */}
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => setAudienceType('all_workers')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl text-left transition-all ${
                      audienceType === 'all_workers'
                        ? 'bg-primary/15 shadow-sm ring-2 ring-primary/40'
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Users className="h-4 w-4 shrink-0" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-foreground">All Workers</p>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        Fellowship-wide broadcast to all units
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudienceType('all_excos')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl text-left transition-all ${
                      audienceType === 'all_excos'
                        ? 'bg-purple-500/15 shadow-sm ring-2 ring-purple-500/40'
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-foreground">All EXCOs</p>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        Executive Council &amp; Unit Leads
                      </p>
                    </div>
                  </button>
                </>
              )}

              {/* Team Broadcast Option */}
              <button
                type="button"
                onClick={() => setAudienceType('team')}
                className={`flex items-start gap-3 p-3.5 rounded-xl text-left transition-all ${
                  audienceType === 'team'
                    ? 'bg-primary/15 shadow-sm ring-2 ring-primary/40'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                  <Users className="h-4 w-4 shrink-0" />
                </div>
                <div>
                  <p className="font-bold text-xs text-foreground">
                    {isAdmin ? 'Operational Team' : `All ${session.team} Members`}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {isAdmin
                      ? 'Broadcast to a specific department'
                      : `All active workers in your team`}
                  </p>
                </div>
              </button>

              {/* Specific Individual Worker Option */}
              <button
                type="button"
                onClick={() => setAudienceType('specific_worker')}
                className={`flex items-start gap-3 p-3.5 rounded-xl text-left transition-all ${
                  audienceType === 'specific_worker'
                    ? 'bg-primary/15 shadow-sm ring-2 ring-primary/40'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                  <User className="h-4 w-4 shrink-0" />
                </div>
                <div>
                  <p className="font-bold text-xs text-foreground">Specific Worker</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    Send direct message to one worker
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* CONDITIONAL CONTROLS (Team Picker / Worker Picker)               */}
          {/* ================================================================ */}
          {audienceType === 'team' && (
            <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/30">
              <Label className="text-xs font-bold text-foreground">Select Target Team</Label>
              {isAdmin ? (
                <Select value={targetTeam} onValueChange={setTargetTeam}>
                  <SelectTrigger className="h-10 bg-background border-input text-foreground text-sm">
                    <SelectValue placeholder="Choose a team..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {teamNames.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : session.teams && session.teams.length > 1 ? (
                <Select value={targetTeam} onValueChange={setTargetTeam}>
                  <SelectTrigger className="h-10 bg-background border-input text-foreground text-sm">
                    <SelectValue placeholder="Choose your team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {session.teams.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2.5 rounded-lg bg-background text-xs font-bold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-primary" />
                  <span>{session.team}</span>
                </div>
              )}
            </div>
          )}

          {audienceType === 'specific_worker' && (
            <div className="space-y-2 p-3.5 rounded-xl bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  Select Recipient Worker
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {eligibleWorkers.length} available
                </span>
              </div>

              {/* Worker Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter workers by name, team, or hall..."
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  className="pl-9 h-9 bg-background text-foreground text-xs rounded-lg border-input"
                />
              </div>

              {/* Worker Dropdown / List */}
              <div className="max-h-40 overflow-y-auto rounded-lg bg-card divide-y divide-border/50">
                {searchedWorkers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No matching workers found.
                  </div>
                ) : (
                  searchedWorkers.map((w) => {
                    const isSelected = selectedWorkerId === w._id
                    const hasEmail = Boolean(w.email)
                    return (
                      <button
                        key={w._id}
                        type="button"
                        onClick={() => setSelectedWorkerId(w._id)}
                        className={`w-full flex items-center justify-between p-2.5 text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-primary/10 text-primary font-bold'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-[10px] text-foreground">
                            {w.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{w.fullName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {w.team || 'No team'} • {w.hall || 'No hall'}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {hasEmail ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
                              Ready
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-medium">
                              No email
                            </span>
                          )}
                          {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {selectedWorkerObj && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-xs text-primary">
                  <User className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>
                    Selected: <strong>{selectedWorkerObj.fullName}</strong> ({selectedWorkerObj.team})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* SUBJECT INPUT                                                    */}
          {/* ================================================================ */}
          <div className="space-y-1.5">
            <Label htmlFor="email-subject" className="text-xs font-bold text-foreground">
              Subject
            </Label>
            <Input
              id="email-subject"
              type="text"
              placeholder="e.g., Important Rehearsal Schedule for Sunday Service"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-11 rounded-xl bg-background border-input text-foreground text-sm"
              maxLength={200}
            />
          </div>

          {/* ================================================================ */}
          {/* QUICK TEMPLATES PILLS                                            */}
          {/* ================================================================ */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 shrink-0 text-amber-500" />
              <span className="font-semibold text-foreground">Quick Templates:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    'Upcoming Team Meeting & Review',
                    'Dear Worker,\n\nGrace and peace to you in the name of our Lord Jesus Christ.\n\nPlease be reminded of our upcoming team review and prayer session this week. Your presence and dedication are deeply appreciated.\n\nTime: 4:30 PM\nVenue: Fellowship Chapel\n\nRemain blessed in His service!'
                  )
                }
                className="px-2.5 py-1 rounded-lg text-xs bg-muted hover:bg-accent text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Team Meeting
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    'Sunday Service Roster & Preparation',
                    'Dear Brethren,\n\nWe thank God for the privilege to serve in His sanctuary this coming Sunday.\n\nKindly note your reporting time is 07:30 AM sharp for pre-service prayers and readiness check. Let us come prepared in the spirit.\n\nGod bless you abundantly!'
                  )
                }
                className="px-2.5 py-1 rounded-lg text-xs bg-muted hover:bg-accent text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Sunday Roster
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    'Fellowship Welfare & Academic Check-in',
                    'Beloved Worker,\n\nJust checking in on your welfare, spiritual walk, and academic progress this semester. If there is any need or prayer request you would like the leadership to stand in faith with you for, please reach out to us.\n\nYou are valued and prayed for constantly.'
                  )
                }
                className="px-2.5 py-1 rounded-lg text-xs bg-muted hover:bg-accent text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Welfare Check-in
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* MESSAGE BODY TEXTAREA                                            */}
          {/* ================================================================ */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-message" className="text-xs font-bold text-foreground">
                Message Body
              </Label>
              <span className="text-[11px] font-mono text-muted-foreground">
                {message.length} characters
              </span>
            </div>
            <textarea
              id="email-message"
              rows={6}
              placeholder="Write your official message to the workers here. Paragraphs will be cleanly formatted in the email..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-input bg-background p-3.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
            />
          </div>

          {/* ================================================================ */}
          {/* ESTIMATED RECIPIENTS BANNER                                      */}
          {/* ================================================================ */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
              <span>
                Audience scope: <strong className="text-foreground">{audienceType.replace('_', ' ').toUpperCase()}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <span>Recipients:</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                {estimatedRecipientCount}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span>Sender:</span>
            <strong className="text-foreground">{session.role === 'admin' ? 'CSGB Admin' : session.team}</strong>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-border text-foreground hover:bg-accent text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending || estimatedRecipientCount === 0}
              onClick={handleSend}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs px-5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 shrink-0 mr-2 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 shrink-0 mr-2" />
                  Send Mail ({estimatedRecipientCount})
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
