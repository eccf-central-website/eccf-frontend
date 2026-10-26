'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DoorClosed,
  Eye,
  GraduationCap,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import type { ECCFSession, FirstTimerRow } from '@/types'
import { isHallScoped, isOutreachLeader } from '@/lib/dashboard/rbac'
import { Badge } from '@/components/dashboard/ui/badge'
import { Button } from '@/components/dashboard/ui/button'
import { Card, CardContent } from '@/components/dashboard/ui/card'
import { Input } from '@/components/dashboard/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { toast } from 'sonner'
import { toggleFirstTimerFollowUpAction } from '@/app/actions/first-timer-actions'

interface FirstTimersTableProps {
  rows: FirstTimerRow[]
  session: ECCFSession
}

function cleanNigerianPhone(phone?: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('234') && digits.length >= 13) return digits
  if (digits.startsWith('0') && digits.length >= 11) return `234${digits.slice(1)}`
  return digits
}

export default function FirstTimersTable({ rows, session }: FirstTimersTableProps) {
  const [localRows, setLocalRows] = useState<FirstTimerRow[]>(rows)
  const [searchQuery, setSearchQuery] = useState('')
  const [hallFilter, setHallFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'followed_up'>('all')
  const [selectedVisitor, setSelectedVisitor] = useState<FirstTimerRow | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null)
  const [notesInput, setNotesInput] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  const isHallRep = isHallScoped(session.role)
  const isOutreach = isOutreachLeader(session)

  // Sync rows from server when refreshed
  useEffect(() => {
    setLocalRows(rows)
  }, [rows])

  // Sync notes when opening modal
  useEffect(() => {
    setNotesInput(selectedVisitor?.followUpNotes || '')
  }, [selectedVisitor])

  // Extract unique halls for filtering (Admins & Outreach Leads)
  const availableHalls = useMemo(() => {
    const halls = new Set<string>()
    localRows.forEach((r) => {
      if (r.hall && r.hall.trim()) halls.add(r.hall.trim())
    })
    return Array.from(halls).sort()
  }, [localRows])

  // Stat counts
  const totalCount = localRows.length
  const pendingCount = useMemo(() => localRows.filter((r) => !r.followedUp).length, [localRows])
  const followedUpCount = useMemo(() => localRows.filter((r) => r.followedUp).length, [localRows])

  const filteredRows = useMemo(() => {
    return localRows.filter((row) => {
      // Follow-up status filter
      if (statusFilter === 'pending' && row.followedUp) return false
      if (statusFilter === 'followed_up' && !row.followedUp) return false

      // Hall filter
      if (!isHallRep && hallFilter !== 'all') {
        if (!row.hall || row.hall.toLowerCase() !== hallFilter.toLowerCase()) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = row.fullName.toLowerCase().includes(q)
        const matchHall = (row.hall || '').toLowerCase().includes(q)
        const matchRoom = (row.roomNumber || '').toLowerCase().includes(q)
        const matchDept = (row.department || '').toLowerCase().includes(q)
        const matchLevel = (row.level || '').toLowerCase().includes(q)
        const matchPhone = (row.phoneNumber || '').toLowerCase().includes(q)
        const matchNotes = (row.followUpNotes || '').toLowerCase().includes(q)
        const matchFollowedBy = (row.followedUpBy || '').toLowerCase().includes(q)
        if (
          !matchName &&
          !matchHall &&
          !matchRoom &&
          !matchDept &&
          !matchLevel &&
          !matchPhone &&
          !matchNotes &&
          !matchFollowedBy
        ) {
          return false
        }
      }

      return true
    })
  }, [localRows, isHallRep, hallFilter, statusFilter, searchQuery])

  const copyPhoneNumber = (phone: string, id: string) => {
    if (!phone) return
    navigator.clipboard.writeText(phone)
    setCopiedId(id)
    toast.success(`Copied ${phone} to clipboard`)
    setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current))
    }, 2000)
  }

  const buildWhatsAppLink = (visitor: FirstTimerRow) => {
    const phone = cleanNigerianPhone(visitor.phoneNumber)
    if (!phone) return '#'
    const firstName = visitor.firstName?.trim() || visitor.fullName.split(' ')[0] || visitor.fullName
    const senderIdentity = isHallRep
      ? `your ${session.hall || 'hall'} representative`
      : 'the Outreach & Follow-up Team'

    const greeting = `Hello ${firstName}, greetings in Christ! This is ${senderIdentity} from Evangelical Christian Campus Fellowship (ECCF). We were truly delighted to connect with you during fellowship! We're checking in to see how you are settling into ${visitor.hall ? visitor.hall : 'campus'} and how your studies are going. Please let us know if there is anything you need or if you have any prayer points. God bless you richly!`

    return `https://wa.me/${phone}?text=${encodeURIComponent(greeting)}`
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  // Toggle follow-up status
  const handleToggleFollowUp = async (visitor: FirstTimerRow, nextStatus: boolean, customNotes?: string) => {
    setIsUpdatingId(visitor._id)
    const prevRows = [...localRows]
    const nowIso = new Date().toISOString()
    const leaderIdentifier = session.name
      ? `${session.name} (${session.excoPosition || session.role})`
      : session.excoPosition || session.role

    // Optimistically update local state
    setLocalRows((prev) =>
      prev.map((r) =>
        r._id === visitor._id
          ? {
              ...r,
              followedUp: nextStatus,
              followedUpAt: nextStatus ? nowIso : undefined,
              followedUpBy: nextStatus ? leaderIdentifier : undefined,
              followUpNotes: customNotes !== undefined ? customNotes : r.followUpNotes,
            }
          : r
      )
    )

    if (selectedVisitor?._id === visitor._id) {
      setSelectedVisitor((prev) =>
        prev
          ? {
              ...prev,
              followedUp: nextStatus,
              followedUpAt: nextStatus ? nowIso : undefined,
              followedUpBy: nextStatus ? leaderIdentifier : undefined,
              followUpNotes: customNotes !== undefined ? customNotes : prev.followUpNotes,
            }
          : null
      )
    }

    try {
      const res = await toggleFirstTimerFollowUpAction({
        firstTimerId: visitor._id,
        followedUp: nextStatus,
        notes: customNotes,
      })

      if (res.ok) {
        toast.success(
          nextStatus
            ? `Marked ${visitor.fullName} as followed up!`
            : `Marked ${visitor.fullName} as awaiting follow-up.`
        )
      } else {
        setLocalRows(prevRows)
        toast.error(res.error || 'Failed to update follow-up status.')
      }
    } catch {
      setLocalRows(prevRows)
      toast.error('An unexpected error occurred while updating status.')
    } finally {
      setIsUpdatingId(null)
    }
  }

  // Save notes in detail modal
  const handleSaveNotes = async () => {
    if (!selectedVisitor) return
    setIsSavingNotes(true)

    try {
      const res = await toggleFirstTimerFollowUpAction({
        firstTimerId: selectedVisitor._id,
        followedUp: Boolean(selectedVisitor.followedUp),
        notes: notesInput,
      })

      if (res.ok) {
        setLocalRows((prev) =>
          prev.map((r) =>
            r._id === selectedVisitor._id
              ? { ...r, followUpNotes: notesInput.trim() || undefined }
              : r
          )
        )
        setSelectedVisitor((prev) =>
          prev ? { ...prev, followUpNotes: notesInput.trim() || undefined } : null
        )
        toast.success('Follow-up remarks saved!')
      } else {
        toast.error(res.error || 'Failed to save remarks.')
      }
    } catch {
      toast.error('Failed to save remarks.')
    } finally {
      setIsSavingNotes(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total First-Timers */}
        <Card className="rounded-2xl border bg-card shadow-xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5 shrink-0" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isHallRep ? 'First-Timers in Hall' : 'Total First-Timers'}
              </p>
              <h3 className="text-2xl font-bold text-foreground">{totalCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Awaiting Follow-up */}
        <Card
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          className={`rounded-2xl border cursor-pointer transition-all hover:shadow-xs ${
            statusFilter === 'pending'
              ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30'
              : 'bg-card'
          }`}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5 shrink-0" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Awaiting Follow-up</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {pendingCount}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Followed Up */}
        <Card
          onClick={() => setStatusFilter(statusFilter === 'followed_up' ? 'all' : 'followed_up')}
          className={`rounded-2xl border cursor-pointer transition-all hover:shadow-xs ${
            statusFilter === 'followed_up'
              ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/30'
              : 'bg-card'
          }`}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Followed Up</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {followedUpCount}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Hostel Coverage */}
        <Card className="rounded-2xl border bg-card shadow-xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Building2 className="h-5 w-5 shrink-0" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Hostel Coverage</p>
              <h3 className="text-2xl font-bold text-foreground">
                {isHallRep ? (session.hall || 'Assigned Hall') : `${availableHalls.length} Halls`}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, department, hall, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as 'all' | 'pending' | 'followed_up')}
          >
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visitors ({totalCount})</SelectItem>
              <SelectItem value="pending">⏳ Awaiting ({pendingCount})</SelectItem>
              <SelectItem value="followed_up">✓ Followed Up ({followedUpCount})</SelectItem>
            </SelectContent>
          </Select>

          {/* Hall Filter (for Admins & Outreach) */}
          {!isHallRep ? (
            <Select value={hallFilter} onValueChange={setHallFilter}>
              <SelectTrigger className="w-[160px] rounded-xl">
                <SelectValue placeholder="All Halls" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Halls</SelectItem>
                {availableHalls.map((hall) => (
                  <SelectItem key={hall} value={hall}>
                    {hall}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className="border-primary/30 bg-primary/5 py-1.5 px-3 text-xs text-primary font-medium rounded-xl">
              <Building2 className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              Scoped to {session.hall || 'Your Hall'}
            </Badge>
          )}

          {isOutreach && (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 py-1.5 px-3 text-xs font-medium rounded-xl">
              <UserCheck className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              Outreach Coordinator
            </Badge>
          )}
        </div>
      </div>

      {/* First-Timers Table (Desktop) */}
      <div className="hidden rounded-2xl bg-card shadow-xs overflow-hidden sm:block border">
        <Table aria-label="First-timers records">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Visitor &amp; Status</TableHead>
              <TableHead className="font-semibold">Campus Residence</TableHead>
              <TableHead className="font-semibold">Department &amp; Level</TableHead>
              <TableHead className="font-semibold">Date Visited</TableHead>
              <TableHead className="text-right font-semibold">Follow-up Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Users className="h-6 w-6 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground">No matching first-timers</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {searchQuery
                        ? 'Try clearing your search query or adjusting your filters.'
                        : statusFilter !== 'all'
                          ? `No visitors in ${statusFilter === 'pending' ? 'awaiting' : 'followed up'} status.`
                          : isHallRep
                            ? `No submissions found for ${session.hall || 'your hall'} yet.`
                            : 'Submissions from the Connect form will show up here.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row._id} className="transition-colors hover:bg-muted/30">
                  {/* Visitor Name, Phone & Status */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{row.fullName}</span>
                        {row.followedUp ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 px-1.5 py-0 text-[10px] font-semibold gap-1 inline-flex items-center"
                            title={row.followedUpBy ? `Followed up by ${row.followedUpBy}` : 'Followed up'}
                          >
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            Followed Up
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 px-1.5 py-0 text-[10px] font-medium gap-1 inline-flex items-center"
                          >
                            <Clock className="h-3 w-3 shrink-0" />
                            Awaiting
                          </Badge>
                        )}
                      </div>

                      {row.phoneNumber ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{row.phoneNumber}</span>
                          <button
                            type="button"
                            onClick={() => copyPhoneNumber(row.phoneNumber!, row._id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy phone number"
                            aria-label={`Copy phone number for ${row.fullName}`}
                          >
                            {copiedId === row._id ? (
                              <Check className="h-3 w-3 shrink-0 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 shrink-0" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No phone recorded</span>
                      )}

                      {row.followedUp && row.followedUpBy && (
                        <span className="text-[11px] text-muted-foreground">
                          Followed up by <span className="font-medium text-foreground">{row.followedUpBy}</span>
                          {row.followedUpAt && ` • ${formatDateTime(row.followedUpAt)}`}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Hostel & Room */}
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-medium text-foreground">
                        {row.hall || 'Off-Campus / Unassigned'}
                      </span>
                      {row.roomNumber && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <DoorClosed className="h-3 w-3 shrink-0" />
                          {row.roomNumber}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Department & Level */}
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="text-foreground">{row.department || '—'}</span>
                      {row.level && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <GraduationCap className="h-3 w-3 shrink-0" />
                          {row.level} Level
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Date Visited */}
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                      <span>{formatDate(row.dateVisited)}</span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Mark Followed Up Button */}
                      <Button
                        size="sm"
                        variant={row.followedUp ? 'ghost' : 'outline'}
                        className={
                          row.followedUp
                            ? 'h-8 px-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5'
                            : 'h-8 px-2.5 text-xs border-emerald-600/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1.5 font-medium'
                        }
                        disabled={isUpdatingId === row._id}
                        onClick={() => handleToggleFollowUp(row, !row.followedUp)}
                        title={row.followedUp ? 'Click to mark as awaiting follow-up' : 'Click to mark as followed up'}
                      >
                        {isUpdatingId === row._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : row.followedUp ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Followed Up</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Mark Followed Up</span>
                          </>
                        )}
                      </Button>

                      {row.phoneNumber ? (
                        <>
                          <a
                            href={buildWhatsAppLink(row)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 px-2.5 text-xs font-medium text-white shadow-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                            title="Open WhatsApp chat with pre-filled pastoral greeting"
                          >
                            <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                            WhatsApp
                          </a>

                          <a
                            href={`tel:${row.phoneNumber}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title={`Call ${row.fullName}`}
                            aria-label={`Call ${row.fullName}`}
                          >
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        </>
                      ) : null}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 shrink-0 p-0"
                        onClick={() => setSelectedVisitor(row)}
                        title="View visitor details and follow-up notes"
                        aria-label={`View details for ${row.fullName}`}
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* First-Timers Mobile Card List */}
      <div className="space-y-3 sm:hidden">
        {filteredRows.length === 0 ? (
          <Card className="rounded-2xl border">
            <CardContent className="p-8 text-center">
              <Users className="mx-auto h-8 w-8 shrink-0 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold text-foreground">No first-timers found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {statusFilter !== 'all'
                  ? `No visitors in ${statusFilter === 'pending' ? 'awaiting' : 'followed up'} status.`
                  : isHallRep
                    ? `No submissions for ${session.hall || 'your hall'}.`
                    : 'Submissions from the Connect form will show up here.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRows.map((row) => (
            <Card key={row._id} className="overflow-hidden border bg-card shadow-xs rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground text-base leading-tight">
                        {row.fullName}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Visited {formatDate(row.dateVisited)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {row.followedUp ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold gap-1 inline-flex items-center"
                      >
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        Followed Up
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 px-2 py-0.5 text-[10px] font-medium gap-1 inline-flex items-center"
                      >
                        <Clock className="h-3 w-3 shrink-0" />
                        Awaiting
                      </Badge>
                    )}
                    {row.hall && (
                      <span className="text-[11px] text-muted-foreground">
                        {row.hall}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl p-2.5 my-1">
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-muted-foreground/80">Room</span>
                    <span className="text-foreground font-medium">{row.roomNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-muted-foreground/80">Department</span>
                    <span className="text-foreground font-medium truncate block">{row.department || '—'} {row.level ? `(${row.level}L)` : ''}</span>
                  </div>
                </div>

                {row.followedUp && row.followedUpBy && (
                  <p className="text-[11px] text-muted-foreground">
                    Followed up by <span className="font-medium text-foreground">{row.followedUpBy}</span>
                  </p>
                )}

                {/* Mobile Action Buttons */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    {/* Mark Followed Up toggle */}
                    <Button
                      size="sm"
                      variant={row.followedUp ? 'secondary' : 'outline'}
                      className={`flex-1 h-9 text-xs gap-1.5 rounded-xl font-medium ${
                        row.followedUp
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          : 'border-emerald-600/30 text-emerald-600 dark:text-emerald-400'
                      }`}
                      disabled={isUpdatingId === row._id}
                      onClick={() => handleToggleFollowUp(row, !row.followedUp)}
                    >
                      {isUpdatingId === row._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : row.followedUp ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Followed Up
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Mark Followed Up
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs rounded-xl"
                      onClick={() => setSelectedVisitor(row)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Details
                    </Button>
                  </div>

                  {row.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <a
                        href={buildWhatsAppLink(row)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 text-xs font-medium text-white shadow-xs"
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" />
                        WhatsApp Follow-up
                      </a>

                      <a
                        href={`tel:${row.phoneNumber}`}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground"
                        aria-label={`Call ${row.fullName}`}
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                      </a>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 shrink-0 p-0 rounded-xl"
                        onClick={() => copyPhoneNumber(row.phoneNumber!, row._id)}
                        aria-label={`Copy phone number for ${row.fullName}`}
                      >
                        {copiedId === row._id ? (
                          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4 shrink-0" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Visitor Detail Modal */}
      <Dialog open={Boolean(selectedVisitor)} onOpenChange={(open) => !open && setSelectedVisitor(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedVisitor && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-6">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <UserPlus className="h-5 w-5 shrink-0 text-primary" />
                    {selectedVisitor.fullName}
                  </DialogTitle>
                </div>
                <DialogDescription>
                  First-timer profile and pastoral follow-up tracking.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                {/* Follow-up Status Card */}
                <div
                  className={`rounded-xl p-3 border ${
                    selectedVisitor.followedUp
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-950 dark:text-emerald-100'
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-950 dark:text-amber-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {selectedVisitor.followedUp ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-xs leading-none">
                          {selectedVisitor.followedUp ? 'Follow-up Completed' : 'Awaiting Follow-up'}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {selectedVisitor.followedUp
                            ? `Handled by ${selectedVisitor.followedUpBy || 'Leader'}`
                            : 'Reach out to visitor within 48 hours'}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={selectedVisitor.followedUp ? 'outline' : 'default'}
                      className="h-8 text-xs font-semibold rounded-lg"
                      disabled={isUpdatingId === selectedVisitor._id}
                      onClick={() => handleToggleFollowUp(selectedVisitor, !selectedVisitor.followedUp)}
                    >
                      {isUpdatingId === selectedVisitor._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : selectedVisitor.followedUp ? (
                        'Reopen Follow-up'
                      ) : (
                        'Mark as Followed Up'
                      )}
                    </Button>
                  </div>

                  {selectedVisitor.followedUp && selectedVisitor.followedUpAt && (
                    <p className="text-[10px] text-muted-foreground mt-2 border-t border-emerald-500/20 pt-1.5">
                      Completed on {formatDateTime(selectedVisitor.followedUpAt)}
                    </p>
                  )}
                </div>

                {/* Profile Fields */}
                <div className="rounded-xl bg-muted/50 p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Date Visited</span>
                    <span className="font-semibold text-foreground">{formatDate(selectedVisitor.dateVisited)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Hostel / Hall</span>
                    <span className="font-semibold text-foreground">{selectedVisitor.hall || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Room Number</span>
                    <span className="font-semibold text-foreground">{selectedVisitor.roomNumber || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-semibold text-foreground">{selectedVisitor.department || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-semibold text-foreground">{selectedVisitor.level ? `${selectedVisitor.level} Level` : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Phone Number</span>
                    <span className="font-semibold text-foreground">{selectedVisitor.phoneNumber || 'Not specified'}</span>
                  </div>
                </div>

                {/* Pastoral Follow-up Notes */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-foreground block">
                    Pastoral Follow-up Remarks &amp; Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Called and had prayer together; invited to Wednesday Bible study; connected with Hall Rep."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs rounded-lg"
                      disabled={isSavingNotes || notesInput === (selectedVisitor.followUpNotes || '')}
                      onClick={handleSaveNotes}
                    >
                      {isSavingNotes ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Saving...
                        </>
                      ) : (
                        'Save Notes'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Contact Actions */}
                {selectedVisitor.phoneNumber && (
                  <div className="flex flex-col gap-2 pt-2 border-t">
                    <a
                      href={buildWhatsAppLink(selectedVisitor)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-medium text-white shadow-xs transition-colors"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" />
                      Open WhatsApp Pastoral Message
                    </a>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${selectedVisitor.phoneNumber}`}
                        className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-input bg-background hover:bg-muted text-sm font-medium text-foreground transition-colors"
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        Call Visitor
                      </a>

                      <Button
                        variant="outline"
                        className="flex-1 gap-2 rounded-xl"
                        onClick={() => copyPhoneNumber(selectedVisitor.phoneNumber!, selectedVisitor._id)}
                      >
                        {copiedId === selectedVisitor._id ? (
                          <>
                            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 shrink-0" />
                            Copy Phone
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
