'use client'

import * as React from 'react'
import { useState, useTransition, useMemo } from 'react'
import { ClipboardList, Loader2, Plus, Search, Users } from 'lucide-react'
import type { ECCFSession } from '@/types'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import { Badge } from '@/components/dashboard/ui/badge'
import { Checkbox } from '@/components/dashboard/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/dashboard/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { FELLOWSHIP_TEAMS, SERVICE_TYPES, type ServiceType } from '@/lib/dashboard/attendance-constants'
import { recordAttendanceAction } from '@/app/actions/attendance-actions'
import { toastFromResult } from '@/lib/dashboard/toast'

export interface AttendanceWorkerItem {
  _id: string
  fullName: string
  team: string
  hall: string
}

interface RecordAttendanceModalProps {
  session: ECCFSession
  availableWorkers: AttendanceWorkerItem[]
  onSuccess?: () => void
}

export default function RecordAttendanceModal({
  session,
  availableWorkers,
  onSuccess,
}: RecordAttendanceModalProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Form State
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [date, setDate] = useState(today)
  const [serviceType, setServiceType] = useState<ServiceType>(
    session.role === 'team_lead' ? 'Team Meeting' : 'Sunday Service'
  )
  const [meetingTitle, setMeetingTitle] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string>(
    session.role === 'team_lead' ? session.team : ''
  )
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Set<string>>(new Set())
  const [extraCount, setExtraCount] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter workers by selected team (if admin chose a team, or auto-scoped for team_lead)
  const filteredTeamWorkers = useMemo(() => {
    return availableWorkers.filter((w) => {
      if (session.role === 'team_lead') {
        return w.team.toLowerCase() === session.team.toLowerCase()
      }
      if (selectedTeam && selectedTeam !== 'all') {
        return w.team.toLowerCase().includes(selectedTeam.toLowerCase()) ||
               selectedTeam.toLowerCase().includes(w.team.toLowerCase())
      }
      return true
    })
  }, [availableWorkers, session, selectedTeam])

  // Search filtered workers inside checklist
  const visibleWorkers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return filteredTeamWorkers
    return filteredTeamWorkers.filter(
      (w) => w.fullName.toLowerCase().includes(q) || w.hall.toLowerCase().includes(q)
    )
  }, [filteredTeamWorkers, searchQuery])

  // Checkbox toggle helpers
  const toggleWorker = (id: string) => {
    setSelectedWorkerIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelectedWorkerIds((prev) => {
      const next = new Set(prev)
      visibleWorkers.forEach((w) => next.add(w._id))
      return next
    })
  }

  const deselectAllVisible = () => {
    setSelectedWorkerIds((prev) => {
      const next = new Set(prev)
      visibleWorkers.forEach((w) => next.delete(w._id))
      return next
    })
  }

  const totalHeadcount = selectedWorkerIds.size + Math.max(0, extraCount || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const result = await recordAttendanceAction({
        date,
        serviceType,
        meetingTitle: meetingTitle.trim() || undefined,
        teamName: session.role === 'team_lead' ? session.team : (selectedTeam || undefined),
        attendeeIds: Array.from(selectedWorkerIds),
        extraCount: Math.max(0, extraCount || 0),
      })

      if (toastFromResult(result, { success: 'Attendance recorded successfully!' })) {
        setOpen(false)
        setSelectedWorkerIds(new Set())
        setMeetingTitle('')
        setExtraCount(0)
        setSearchQuery('')
        onSuccess?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Record Attendance</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <ClipboardList className="h-5 w-5" />
            <DialogTitle className="font-serif text-xl">Record Meeting Attendance</DialogTitle>
          </div>
          <DialogDescription>
            {session.role === 'team_lead'
              ? `Take attendance for your ${session.team} team meeting. Tick off active workers below.`
              : 'Record headcount and tick off present workers for this service or meeting.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Top Form Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="att-date">Meeting Date</Label>
              <Input
                id="att-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="att-service">Service / Meeting Type</Label>
              <Select
                value={serviceType}
                onValueChange={(val) => setServiceType(val as ServiceType)}
              >
                <SelectTrigger id="att-service">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="att-title">Meeting Title / Topic (Optional)</Label>
              <Input
                id="att-title"
                placeholder="e.g. Weekly Rehearsal, Media Workshop"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Assigned Team</Label>
              {session.role === 'team_lead' ? (
                <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm">
                  <Badge variant="secondary" className="mr-2">
                    {session.team}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Locked to your team</span>
                </div>
              ) : (
                <Select
                  value={selectedTeam}
                  onValueChange={setSelectedTeam}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Team (or General)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">General / All Fellowship</SelectItem>
                    {FELLOWSHIP_TEAMS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Attendees Checklist Section */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Tick-Off Present Workers</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Tick each member present. Selected: {selectedWorkerIds.size} of {filteredTeamWorkers.length}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={selectAllVisible}
                  disabled={visibleWorkers.length === 0}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={deselectAllVisible}
                  disabled={selectedWorkerIds.size === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative mt-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search worker by name or hall..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Checklist items list */}
            <div className="mt-3 max-h-60 space-y-1.5 overflow-y-auto pr-1">
              {visibleWorkers.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No registered workers found matching your filter.
                </div>
              ) : (
                visibleWorkers.map((worker) => {
                  const isChecked = selectedWorkerIds.has(worker._id)
                  return (
                    <label
                      key={worker._id}
                      onClick={() => toggleWorker(worker._id)}
                      className={`flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors ${
                        isChecked
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleWorker(worker._id)}
                        />
                        <div className="truncate text-left">
                          <p className="truncate text-sm font-medium leading-none text-foreground">
                            {worker.fullName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {worker.team} · {worker.hall}
                          </p>
                        </div>
                      </div>
                      {isChecked && (
                        <Badge variant="default" className="text-[10px] h-5 px-1.5 bg-primary/80">
                          Present
                        </Badge>
                      )}
                    </label>
                  )
                })
              )}
            </div>
          </div>

          {/* Extra Guests / Visitors Count */}
          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2 rounded-lg border bg-muted/20 p-3">
            <div>
              <Label htmlFor="att-extra" className="text-sm font-medium">
                Guests / Non-Registered Attendees
              </Label>
              <p className="text-xs text-muted-foreground">
                First-time visitors or unregistered guests.
              </p>
            </div>
            <div>
              <Input
                id="att-extra"
                type="number"
                min="0"
                value={extraCount}
                onChange={(e) => setExtraCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="text-right font-medium"
              />
            </div>
          </div>

          {/* Live Headcount Summary Badge */}
          <div className="flex items-center justify-between rounded-md bg-accent/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Calculated Total Headcount:</span>
            <span className="font-semibold text-primary">
              {selectedWorkerIds.size} workers + {extraCount} guests = {totalHeadcount} total
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || totalHeadcount === 0}
              className="gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Save Attendance Record</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
