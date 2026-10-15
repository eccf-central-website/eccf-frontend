'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
  Building2,
  Calendar,
  Check,
  Copy,
  DoorClosed,
  Eye,
  GraduationCap,
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
  const [searchQuery, setSearchQuery] = useState('')
  const [hallFilter, setHallFilter] = useState('all')
  const [selectedVisitor, setSelectedVisitor] = useState<FirstTimerRow | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const isHallRep = isHallScoped(session.role)
  const isOutreach = isOutreachLeader(session)

  // Extract unique halls for filtering (Admins & Outreach Leads)
  const availableHalls = useMemo(() => {
    const halls = new Set<string>()
    rows.forEach((r) => {
      if (r.hall && r.hall.trim()) halls.add(r.hall.trim())
    })
    return Array.from(halls).sort()
  }, [rows])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
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
        if (!matchName && !matchHall && !matchRoom && !matchDept && !matchLevel && !matchPhone) {
          return false
        }
      }

      return true
    })
  }, [rows, isHallRep, hallFilter, searchQuery])

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

  return (
    <div className="space-y-6">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isHallRep ? 'First-Timers in Hall' : 'Total First-Timers'}
              </p>
              <h3 className="text-2xl font-bold text-foreground">{rows.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Ready for WhatsApp</p>
              <h3 className="text-2xl font-bold text-foreground">
                {rows.filter((r) => Boolean(r.phoneNumber)).length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Building2 className="h-5 w-5" />
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, department, hall, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isHallRep ? (
            <Select value={hallFilter} onValueChange={setHallFilter}>
              <SelectTrigger className="w-[170px]">
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
            <Badge variant="outline" className="border-primary/30 bg-primary/5 py-1.5 px-3 text-xs text-primary font-medium">
              <Building2 className="mr-1.5 h-3.5 w-3.5" />
              Scoped to {session.hall || 'Your Hall'}
            </Badge>
          )}

          {isOutreach && (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 py-1.5 px-3 text-xs font-medium">
              <UserCheck className="mr-1.5 h-3.5 w-3.5" />
              Outreach Coordinator
            </Badge>
          )}
        </div>
      </div>

      {/* First-Timers Table (Desktop) */}
      <div className="hidden rounded-lg border bg-card sm:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Visitor</TableHead>
              <TableHead className="font-semibold">Campus Residence</TableHead>
              <TableHead className="font-semibold">Department & Level</TableHead>
              <TableHead className="font-semibold">Date Visited</TableHead>
              <TableHead className="text-right font-semibold">Follow-up Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground">No matching first-timers</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {searchQuery
                        ? 'Try clearing your search query or adjusting your filters.'
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
                  {/* Visitor Name & Details */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{row.fullName}</span>
                      {row.phoneNumber ? (
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{row.phoneNumber}</span>
                          <button
                            type="button"
                            onClick={() => copyPhoneNumber(row.phoneNumber!, row._id)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Copy phone number"
                            aria-label={`Copy phone number for ${row.fullName}`}
                          >
                            {copiedId === row._id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No phone recorded</span>
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
                          <DoorClosed className="h-3 w-3" />
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
                          <GraduationCap className="h-3 w-3" />
                          {row.level} Level
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Date Visited */}
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                      <span>{formatDate(row.dateVisited)}</span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {row.phoneNumber ? (
                        <>
                          <a
                            href={buildWhatsAppLink(row)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 px-2.5 text-xs font-medium text-white shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                            title="Open WhatsApp chat with pre-filled pastoral greeting"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>

                          <a
                            href={`tel:${row.phoneNumber}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title={`Call ${row.fullName}`}
                            aria-label={`Call ${row.fullName}`}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        </>
                      ) : null}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedVisitor(row)}
                        title="View visitor details"
                        aria-label={`View details for ${row.fullName}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
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
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold text-foreground">No first-timers found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isHallRep
                  ? `No submissions for ${session.hall || 'your hall'}.`
                  : 'Submissions from the Connect form will show up here.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRows.map((row) => (
            <Card key={row._id} className="overflow-hidden border border-border shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-foreground text-base leading-tight">
                      {row.fullName}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Visited {formatDate(row.dateVisited)}
                    </p>
                  </div>
                  {row.hall && (
                    <Badge variant="outline" className="shrink-0 text-xs font-normal">
                      {row.hall}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-y py-2.5">
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-muted-foreground/80">Room</span>
                    <span className="text-foreground font-medium">{row.roomNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-muted-foreground/80">Department</span>
                    <span className="text-foreground font-medium truncate block">{row.department || '—'} {row.level ? `(${row.level}L)` : ''}</span>
                  </div>
                </div>

                {/* Mobile Follow-up Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {row.phoneNumber ? (
                    <>
                      <a
                        href={buildWhatsAppLink(row)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 text-xs font-medium text-white shadow-sm"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp Follow-up
                      </a>

                      <a
                        href={`tel:${row.phoneNumber}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-muted text-muted-foreground"
                        aria-label={`Call ${row.fullName}`}
                      >
                        <Phone className="h-4 w-4" />
                      </a>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 p-0"
                        onClick={() => copyPhoneNumber(row.phoneNumber!, row._id)}
                        aria-label={`Copy phone number for ${row.fullName}`}
                      >
                        {copiedId === row._id ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No phone contact provided</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Visitor Detail Modal */}
      <Dialog open={Boolean(selectedVisitor)} onOpenChange={(open) => !open && setSelectedVisitor(null)}>
        <DialogContent className="max-w-md">
          {selectedVisitor && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  {selectedVisitor.fullName}
                </DialogTitle>
                <DialogDescription>
                  First-timer profile and pastoral follow-up contact details.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
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

                {selectedVisitor.phoneNumber && (
                  <div className="flex flex-col gap-2 pt-2">
                    <a
                      href={buildWhatsAppLink(selectedVisitor)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-sm font-medium text-white shadow transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Open WhatsApp Pastoral Message
                    </a>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${selectedVisitor.phoneNumber}`}
                        className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-muted text-sm font-medium text-foreground transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        Call Visitor
                      </a>

                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => copyPhoneNumber(selectedVisitor.phoneNumber!, selectedVisitor._id)}
                      >
                        {copiedId === selectedVisitor._id ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
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
