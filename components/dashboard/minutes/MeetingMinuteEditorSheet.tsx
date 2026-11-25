'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Calendar,
  CheckSquare,
  Clock,
  FolderOpen,
  ListChecks,
  Loader2,
  MapPin,
  Pin,
  Plus,
  Send,
  Sparkles,
  Tag,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react'
import {
  createMeetingMinute,
  updateMeetingMinute,
} from '@/app/actions/meeting-minutes-actions'
import { Button } from '@/components/dashboard/ui/button'
import { Checkbox } from '@/components/dashboard/ui/checkbox'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import { RecordSheet } from '@/components/dashboard/ui/record-sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import { lagosDate } from '@/lib/dashboard/dates'
import { toastError, toastSuccess } from '@/lib/dashboard/toast'
import { cn } from '@/lib/utils'
import type {
  MeetingMinute,
  MeetingMinuteActionItem,
  MeetingMinuteType,
} from '@/types'

export const MEETING_MINUTE_TYPES: readonly MeetingMinuteType[] = [
  'CSGB',
  'General EXCO',
  'Emergency',
  'Retreat & Planning',
  'Committee',
]

const DEFAULT_FOLDERS = [
  '2026/2027 Session',
  '2025/2026 Session',
  'Academic & Outreach',
  'CSGB Governance',
]

interface DraftActionItem {
  _key: string
  task: string
  owner: string
  dueDate: string
  status: 'open' | 'done'
}

interface MeetingMinuteEditorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  minute?: MeetingMinute | null
  existingFolders?: string[]
  recorderDefaultName?: string
  onSaved: (saved: MeetingMinute) => void
}

function parseCommaList(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseLinesList(raw: string): string[] {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function makeEmptyActionItem(index: number): DraftActionItem {
  return {
    _key: `draft-ai-${Date.now()}-${index}`,
    task: '',
    owner: '',
    dueDate: '',
    status: 'open',
  }
}

export default function MeetingMinuteEditorSheet({
  open,
  onOpenChange,
  minute,
  existingFolders = [],
  recorderDefaultName = '',
  onSaved,
}: MeetingMinuteEditorSheetProps) {
  const isEditing = Boolean(minute?._id)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingType, setMeetingType] = useState<string>('CSGB')
  const [folder, setFolder] = useState('2026/2027 Session')
  const [venue, setVenue] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [chairperson, setChairperson] = useState('')
  const [recorderName, setRecorderName] = useState('')
  const [attendeesText, setAttendeesText] = useState('')
  const [absenteesText, setAbsenteesText] = useState('')
  const [agendaText, setAgendaText] = useState('')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [decisionsText, setDecisionsText] = useState('')
  const [actionItems, setActionItems] = useState<DraftActionItem[]>([])
  const [tagsText, setTagsText] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [isPostedToExcos, setIsPostedToExcos] = useState(false)

  const [titleError, setTitleError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const folderSuggestions = useMemo(() => {
    const merged = new Set<string>([...DEFAULT_FOLDERS, ...existingFolders])
    return Array.from(merged).filter(Boolean).sort((a, b) => b.localeCompare(a))
  }, [existingFolders])

  useEffect(() => {
    if (!open) return
    const today = lagosDate()
    setTitleError(null)
    setDateError(null)
    setFormError(null)

    if (minute) {
      setTitle(minute.title || '')
      setMeetingDate(minute.meetingDate || today)
      setMeetingType(minute.meetingType || 'CSGB')
      setFolder(minute.folder || '2026/2027 Session')
      setVenue(minute.venue || '')
      setStartTime(minute.startTime || '')
      setEndTime(minute.endTime || '')
      setChairperson(minute.chairperson || '')
      setRecorderName(minute.recorderName || recorderDefaultName || '')
      setAttendeesText((minute.attendees || []).join(', '))
      setAbsenteesText((minute.absentees || []).join(', '))
      setAgendaText((minute.agenda || []).join('\n'))
      setSummary(minute.summary || '')
      setBody(minute.body || '')
      setDecisionsText((minute.decisions || []).join('\n'))
      setActionItems(
        (minute.actionItems || []).map((item, idx) => ({
          _key: item._key || `ai-${idx}-${Date.now()}`,
          task: item.task || '',
          owner: item.owner || '',
          dueDate: item.dueDate || '',
          status: item.status === 'done' ? 'done' : 'open',
        }))
      )
      setTagsText((minute.tags || []).join(', '))
      setIsPinned(Boolean(minute.isPinned))
      setIsPostedToExcos(Boolean(minute.isPostedToExcos))
    } else {
      setTitle('')
      setMeetingDate(today)
      setMeetingType('CSGB')
      setFolder('2026/2027 Session')
      setVenue('ECCF Secretariat')
      setStartTime('04:00 PM')
      setEndTime('')
      setChairperson('')
      setRecorderName(recorderDefaultName || '')
      setAttendeesText('')
      setAbsenteesText('')
      setAgendaText('')
      setSummary('')
      setBody('')
      setDecisionsText('')
      setActionItems([])
      setTagsText('')
      setIsPinned(false)
      setIsPostedToExcos(false)
    }
  }, [minute, open, recorderDefaultName])

  const applyTemplate = (template: 'csgb' | 'exco' | 'emergency') => {
    const today = lagosDate()
    setMeetingDate((prev) => prev || today)
    setFolder((prev) => prev || '2026/2027 Session')
    setTitleError(null)
    setFormError(null)

    if (template === 'csgb') {
      setTitle('CSGB Weekly Spiritual Oversight & Governance Meeting')
      setMeetingType('CSGB')
      setVenue('ECCF Secretariat, Room 2')
      setStartTime('06:00 PM')
      setEndTime('07:45 PM')
      setAgendaText(
        [
          'Opening prayer, worship & spiritual charge',
          'Review of previous CSGB action items',
          'Executive leadership & team accountability updates',
          'Welfare, pastoral care & hostel oversight',
          'Upcoming fellowship services and decisions',
        ].join('\n')
      )
      setSummary(
        'CSGB prayer and governance session covering team accountability, pastoral care follow-up, and upcoming service coordination.'
      )
      setBody(
        '1. Opening Prayer & Charge:\nThe meeting opened with focused intercession for students, campus peace, and spiritual hunger across all halls.\n\n2. Operational & Team Review:\nReviewed progress across ministry teams and verified follow-up metrics.\n\n3. Pastoral & Welfare Care:\nConfirmed support actions and prayer assignments.'
      )
      setDecisionsText(
        'Review action item progress at the next CSGB check-in.'
      )
      setTagsText('csgb, governance, prayer')
      setIsPostedToExcos(false)
    } else if (template === 'exco') {
      setTitle('General EXCO Assembly & Ministry Coordination')
      setMeetingType('General EXCO')
      setVenue('NLT 5, Faculty of Law, ESUI')
      setStartTime('04:00 PM')
      setEndTime('06:00 PM')
      setAgendaText(
        [
          'Opening prayer and charge from the President',
          'Confirmation of previous EXCO minutes',
          'Ministry team and Hall Pastor reports',
          'Upcoming fellowship programmes & financial stewardship',
          'Action items and closing benediction',
        ].join('\n')
      )
      setSummary(
        'Monthly General EXCO assembly aligning ministry teams, hall pastors, and upcoming campus fellowship programmes.'
      )
      setBody(
        '1. Opening Exhortation:\nAll executives were reminded of faithful stewardship and timely reporting.\n\n2. Ministry Team & Hall Reports:\nTeam Coordinators and Hall Pastors shared attendance highlights, first-timer follow-up progress, and upcoming needs.\n\n3. Stewardship & Logistics:\nReviewed venue schedules and upcoming programme budgets.'
      )
      setDecisionsText(
        'Every ministry team to submit programme readiness updates by Thursday.'
      )
      setTagsText('general-exco, coordination, all-teams')
      setIsPostedToExcos(true)
    } else {
      setTitle('CSGB Emergency Briefing & Rapid Response')
      setMeetingType('Emergency')
      setVenue('ECCF Secretariat (Urgent Session)')
      setStartTime('07:30 PM')
      setEndTime('08:30 PM')
      setAgendaText(
        [
          'Urgent situation briefing and prayer',
          'Immediate response and welfare/pastoral delegation',
          'Next check-in timeline and accountability owners',
        ].join('\n')
      )
      setSummary(
        'Urgent CSGB briefing convened to coordinate immediate fellowship response and delegation.'
      )
      setBody(
        '1. Situation Brief:\nOutlined urgent matter requiring swift CSGB leadership coordination.\n\n2. Delegation & Response:\nAssigned immediate point persons and support resources.'
      )
      setDecisionsText(
        'Convene follow-up review within 48 hours to confirm resolution.'
      )
      setTagsText('emergency, urgent, csgb')
      setIsPostedToExcos(false)
    }
  }

  const handleAddActionItem = () => {
    setActionItems((prev) => [...prev, makeEmptyActionItem(prev.length)])
  }

  const handleUpdateActionItem = (
    index: number,
    patch: Partial<DraftActionItem>
  ) => {
    setActionItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    )
  }

  const handleRemoveActionItem = (index: number) => {
    setActionItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedTitle = title.trim()
    let hasError = false

    if (trimmedTitle.length < 3) {
      setTitleError('Please enter a meeting title of at least 3 characters.')
      hasError = true
    } else {
      setTitleError(null)
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(meetingDate.trim())) {
      setDateError('Please choose a valid meeting date.')
      hasError = true
    } else {
      setDateError(null)
    }

    if (hasError) {
      setFormError('Please review the highlighted fields before saving.')
      titleInputRef.current?.focus()
      return
    }

    setFormError(null)
    setIsSubmitting(true)

    const payloadActionItems: MeetingMinuteActionItem[] = actionItems
      .filter((item) => item.task.trim().length > 0)
      .map((item) => ({
        _key: item._key,
        task: item.task.trim(),
        owner: item.owner.trim() || undefined,
        dueDate: item.dueDate.trim() || undefined,
        status: item.status,
      }))

    const payload = {
      title: trimmedTitle,
      meetingDate: meetingDate.trim(),
      meetingType,
      folder: folder.trim() || '2026/2027 Session',
      venue: venue.trim() || undefined,
      startTime: startTime.trim() || undefined,
      endTime: endTime.trim() || undefined,
      chairperson: chairperson.trim() || undefined,
      recorderName: recorderName.trim() || undefined,
      attendees: parseCommaList(attendeesText),
      absentees: parseCommaList(absenteesText),
      agenda: parseLinesList(agendaText),
      summary: summary.trim() || undefined,
      body: body.trim() || undefined,
      decisions: parseLinesList(decisionsText),
      actionItems: payloadActionItems,
      tags: parseCommaList(tagsText),
      isPinned,
      isPostedToExcos,
    }

    try {
      const result =
        isEditing && minute?._id
          ? await updateMeetingMinute({ _id: minute._id, ...payload })
          : await createMeetingMinute(payload)

      if (!result.ok) {
        setFormError(result.error)
        toastError(result.error)
        return
      }

      toastSuccess(
        isEditing
          ? 'Meeting minute updated.'
          : result.data.isPostedToExcos
            ? 'Meeting minute created and posted to EXCOs.'
            : 'Saved as CSGB-only draft.'
      )
      onSaved(result.data)
      onOpenChange(false)
    } catch {
      const msg = 'An unexpected error occurred while saving the meeting minute.'
      setFormError(msg)
      toastError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RecordSheet
      open={open}
      onOpenChange={(next) => {
        if (!isSubmitting) onOpenChange(next)
      }}
      className="sm:max-w-2xl"
      headerExtra={
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge variant={isPostedToExcos ? 'success' : 'warning'}>
            {isPostedToExcos ? 'Posted to EXCOs' : 'CSGB Draft'}
          </StatusBadge>
          {isPinned && (
            <StatusBadge variant="gold" icon={<Pin className="h-3.5 w-3.5" />}>
              Pinned
            </StatusBadge>
          )}
        </div>
      }
      title={isEditing ? 'Edit meeting minute' : 'Write meeting minute'}
      description={
        isEditing
          ? 'Update minutes, action items, folder organization, or EXCO visibility.'
          : 'Record CSGB or General EXCO minutes. Drafts stay private to CSGB until posted.'
      }
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="min-h-11 w-full sm:w-auto md:min-h-10"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="meeting-minute-editor-form"
            disabled={isSubmitting}
            aria-busy={isSubmitting || undefined}
            className="min-h-11 w-full gap-2 sm:w-auto md:min-h-10"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <span>Saving…</span>
              </>
            ) : isEditing ? (
              <span>Save changes</span>
            ) : isPostedToExcos ? (
              <span>Create &amp; post to EXCOs</span>
            ) : (
              <span>Save CSGB draft</span>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {!isEditing && (
          <div className="rounded-[var(--radius-card)] bg-surface-raised p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                <span>Quick templates:</span>
              </span>
              <button
                type="button"
                onClick={() => applyTemplate('csgb')}
                disabled={isSubmitting}
                className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-card px-3.5 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10"
              >
                CSGB Session
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('exco')}
                disabled={isSubmitting}
                className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-card px-3.5 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10"
              >
                General EXCO
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('emergency')}
                disabled={isSubmitting}
                className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-card px-3.5 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10"
              >
                Emergency Briefing
              </button>
            </div>
          </div>
        )}

        {formError && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-[var(--radius-control)] bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          >
            {formError}
          </div>
        )}

        <form
          id="meeting-minute-editor-form"
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5"
        >
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="minute-title" className="text-sm font-semibold text-foreground">
              Meeting Title <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              ref={titleInputRef}
              id="minute-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (titleError) setTitleError(null)
              }}
              placeholder="e.g. CSGB Weekly Prayer & Secretariat Review"
              required
              aria-invalid={Boolean(titleError)}
              aria-describedby={titleError ? 'minute-title-error' : undefined}
              disabled={isSubmitting}
              className="bg-background font-medium"
            />
            {titleError && (
              <p id="minute-title-error" className="text-[13px] font-medium text-destructive">
                {titleError}
              </p>
            )}
          </div>

          {/* Date & Meeting Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="minute-date"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>
                  Meeting Date <span aria-hidden="true" className="text-destructive">*</span>
                </span>
              </Label>
              <Input
                id="minute-date"
                type="date"
                value={meetingDate}
                onChange={(e) => {
                  setMeetingDate(e.target.value)
                  if (dateError) setDateError(null)
                }}
                required
                aria-invalid={Boolean(dateError)}
                aria-describedby={dateError ? 'minute-date-error' : undefined}
                disabled={isSubmitting}
                className="bg-background tabular-nums"
              />
              {dateError && (
                <p id="minute-date-error" className="text-[13px] font-medium text-destructive">
                  {dateError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="minute-type-trigger"
                className="text-sm font-semibold text-foreground"
              >
                Meeting Type <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Select
                value={meetingType}
                onValueChange={setMeetingType}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="minute-type-trigger"
                  aria-label="Meeting type"
                  className="w-full bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_MINUTE_TYPES.map((typeOption) => (
                    <SelectItem key={typeOption} value={typeOption}>
                      {typeOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Folder & Venue */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="minute-folder"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <FolderOpen
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>Folder / Session</span>
              </Label>
              <Input
                id="minute-folder"
                list="minute-folder-suggestions"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="e.g. 2026/2027 Session"
                aria-describedby="minute-folder-hint"
                disabled={isSubmitting}
                className="bg-background"
              />
              <datalist id="minute-folder-suggestions">
                {folderSuggestions.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
              <p id="minute-folder-hint" className="text-[13px] text-muted-foreground">
                Pick an existing folder or type a new folder name.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="minute-venue"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>Venue</span>
              </Label>
              <Input
                id="minute-venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. ECCF Secretariat or NLT 5"
                disabled={isSubmitting}
                className="bg-background"
              />
            </div>
          </div>

          {/* Start & End Times */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="minute-start-time"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>Start Time</span>
              </Label>
              <Input
                id="minute-start-time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="e.g. 04:00 PM"
                disabled={isSubmitting}
                className="bg-background tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="minute-end-time"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>End Time</span>
              </Label>
              <Input
                id="minute-end-time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="e.g. 06:15 PM"
                disabled={isSubmitting}
                className="bg-background tabular-nums"
              />
            </div>
          </div>

          {/* Chairperson & Recorder */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="minute-chairperson"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <UserCheck
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>Chairperson</span>
              </Label>
              <Input
                id="minute-chairperson"
                value={chairperson}
                onChange={(e) => setChairperson(e.target.value)}
                placeholder="e.g. President / Presiding Officer"
                disabled={isSubmitting}
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="minute-recorder"
                className="text-sm font-semibold text-foreground"
              >
                Recorder / Secretary
              </Label>
              <Input
                id="minute-recorder"
                value={recorderName}
                onChange={(e) => setRecorderName(e.target.value)}
                placeholder="e.g. General Secretary"
                disabled={isSubmitting}
                className="bg-background"
              />
            </div>
          </div>

          {/* Attendees & Absentees */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="minute-attendees"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>Attendees</span>
              </Label>
              <textarea
                id="minute-attendees"
                rows={2}
                value={attendeesText}
                onChange={(e) => setAttendeesText(e.target.value)}
                placeholder="Comma or line separated names"
                aria-describedby="minute-attendees-hint"
                disabled={isSubmitting}
                className="w-full resize-y rounded-[var(--radius-control)] border border-input bg-background p-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
              <p id="minute-attendees-hint" className="text-[13px] text-muted-foreground">
                Separate names with commas or new lines.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="minute-absentees" className="text-sm font-semibold text-foreground">
                Absentees (Optional)
              </Label>
              <textarea
                id="minute-absentees"
                rows={2}
                value={absenteesText}
                onChange={(e) => setAbsenteesText(e.target.value)}
                placeholder="Comma or line separated names"
                disabled={isSubmitting}
                className="w-full resize-y rounded-[var(--radius-control)] border border-input bg-background p-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-1.5">
            <Label htmlFor="minute-summary" className="text-sm font-semibold text-foreground">
              Executive Summary
            </Label>
            <textarea
              id="minute-summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Concise 1–3 sentence overview for quick EXCO scanning…"
              disabled={isSubmitting}
              className="w-full resize-y rounded-[var(--radius-control)] border border-input bg-background p-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          {/* Agenda */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label
                htmlFor="minute-agenda"
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <ListChecks
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>Agenda Items</span>
              </Label>
              <span className="text-[13px] text-muted-foreground">One item per line</span>
            </div>
            <textarea
              id="minute-agenda"
              rows={3}
              value={agendaText}
              onChange={(e) => setAgendaText(e.target.value)}
              placeholder={'Opening prayer and charge\nReview of previous action items\nMinistry team updates'}
              disabled={isSubmitting}
              className="w-full resize-y rounded-[var(--radius-control)] border border-input bg-background p-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          {/* Full Minutes Body */}
          <div className="space-y-1.5">
            <Label htmlFor="minute-body" className="text-sm font-semibold text-foreground">
              Full Minutes &amp; Proceedings
            </Label>
            <textarea
              id="minute-body"
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Record meeting discussions, ministry reports, spiritual charges, and key deliberations…"
              disabled={isSubmitting}
              className="w-full resize-y rounded-[var(--radius-control)] border border-input bg-background p-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          {/* Key Decisions */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="minute-decisions" className="text-sm font-semibold text-foreground">
                Key Decisions &amp; Resolutions
              </Label>
              <span className="text-[13px] text-muted-foreground">One decision per line</span>
            </div>
            <textarea
              id="minute-decisions"
              rows={3}
              value={decisionsText}
              onChange={(e) => setDecisionsText(e.target.value)}
              placeholder="List agreed resolutions and leadership decisions…"
              disabled={isSubmitting}
              className="w-full resize-y rounded-[var(--radius-control)] border border-input bg-background p-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          {/* Dynamic Action Items */}
          <fieldset className="space-y-3 rounded-[var(--radius-card)] bg-surface-raised p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <legend className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CheckSquare className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>Action Items ({actionItems.length})</span>
              </legend>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddActionItem}
                disabled={isSubmitting}
                className="min-h-11 gap-1.5 bg-card px-3 text-[13px] md:min-h-10"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Add action item</span>
              </Button>
            </div>

            {actionItems.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No action items added yet. Use “Add action item” to assign follow-up tasks with
                owners and due dates.
              </p>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item, idx) => (
                  <div
                    key={item._key}
                    className="space-y-3 rounded-[var(--radius-control)] bg-card p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-semibold text-muted-foreground tabular-nums">
                        Action #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 px-1 text-[13px] font-medium text-foreground md:min-h-10">
                          <Checkbox
                            checked={item.status === 'done'}
                            onCheckedChange={(checked) =>
                              handleUpdateActionItem(idx, {
                                status: checked ? 'done' : 'open',
                              })
                            }
                            aria-label={`Mark action item ${idx + 1} as done`}
                            disabled={isSubmitting}
                          />
                          <span>Done</span>
                        </label>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveActionItem(idx)}
                          disabled={isSubmitting}
                          aria-label={`Remove action item ${idx + 1}`}
                          className="h-11 w-11 text-destructive hover:bg-destructive/10 hover:text-destructive md:h-10 md:w-10"
                        >
                          <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`action-task-${item._key}`}
                        className="text-[13px] font-medium text-foreground"
                      >
                        Task
                      </Label>
                      <Input
                        id={`action-task-${item._key}`}
                        value={item.task}
                        onChange={(e) =>
                          handleUpdateActionItem(idx, { task: e.target.value })
                        }
                        placeholder="e.g. Circulate semester calendar to Hall Pastors"
                        disabled={isSubmitting}
                        className="bg-background"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor={`action-owner-${item._key}`}
                          className="text-[13px] font-medium text-foreground"
                        >
                          Owner / Team
                        </Label>
                        <Input
                          id={`action-owner-${item._key}`}
                          value={item.owner}
                          onChange={(e) =>
                            handleUpdateActionItem(idx, { owner: e.target.value })
                          }
                          placeholder="e.g. General Secretary"
                          disabled={isSubmitting}
                          className="bg-background"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor={`action-due-${item._key}`}
                          className="text-[13px] font-medium text-foreground"
                        >
                          Due Date
                        </Label>
                        <Input
                          id={`action-due-${item._key}`}
                          type="date"
                          value={item.dueDate}
                          onChange={(e) =>
                            handleUpdateActionItem(idx, { dueDate: e.target.value })
                          }
                          disabled={isSubmitting}
                          className="bg-background tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label
              htmlFor="minute-tags"
              className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
            >
              <Tag className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span>Tags (Optional)</span>
            </Label>
            <Input
              id="minute-tags"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="e.g. mobilization, budget, welfare"
              aria-describedby="minute-tags-hint"
              disabled={isSubmitting}
              className="bg-background"
            />
            <p id="minute-tags-hint" className="text-[13px] text-muted-foreground">
              Comma-separated keywords for quick searching.
            </p>
          </div>

          {/* Visibility & Pinning Controls */}
          <div className="space-y-3 rounded-[var(--radius-card)] bg-surface-raised p-4">
            <div className="flex min-h-11 items-center justify-between gap-4">
              <label
                htmlFor="minute-post-to-excos"
                className="flex flex-1 cursor-pointer items-center gap-3"
              >
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition-colors',
                    isPostedToExcos
                      ? 'bg-success/10 text-success'
                      : 'bg-warning/20 text-warning-foreground dark:bg-warning/15 dark:text-warning'
                  )}
                >
                  <Send className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    Post for EXCO view
                  </span>
                  <span className="block text-[13px] leading-snug text-muted-foreground">
                    {isPostedToExcos
                      ? 'Visible (read-only) to all EXCO members — Team Leads, Finance & Hall Pastors.'
                      : 'CSGB-only draft — hidden from non-CSGB executives until posted.'}
                  </span>
                </div>
              </label>
              <Checkbox
                id="minute-post-to-excos"
                checked={isPostedToExcos}
                onCheckedChange={(checked) => setIsPostedToExcos(Boolean(checked))}
                disabled={isSubmitting}
                className="h-5 w-5"
              />
            </div>

            <div className="flex min-h-11 items-center justify-between gap-4">
              <label
                htmlFor="minute-pin"
                className="flex flex-1 cursor-pointer items-center gap-3"
              >
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition-colors',
                    isPinned
                      ? 'bg-gold/20 text-gold-foreground dark:bg-gold/15 dark:text-gold'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Pin className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    Pin to top
                  </span>
                  <span className="block text-[13px] leading-snug text-muted-foreground">
                    Keep this minute anchored at the top of the minutes list.
                  </span>
                </div>
              </label>
              <Checkbox
                id="minute-pin"
                checked={isPinned}
                onCheckedChange={(checked) => setIsPinned(Boolean(checked))}
                disabled={isSubmitting}
                className="h-5 w-5"
              />
            </div>
          </div>
        </form>
      </div>
    </RecordSheet>
  )
}
