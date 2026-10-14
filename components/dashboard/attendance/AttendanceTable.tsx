'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import { Calendar, Eye, Search, UserCheck, Users } from 'lucide-react'
import type { AttendanceRow, ECCFSession } from '@/types'
import { Badge } from '@/components/dashboard/ui/badge'
import { Button } from '@/components/dashboard/ui/button'
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
import { FELLOWSHIP_TEAMS, SERVICE_TYPES } from '@/lib/dashboard/attendance-constants'

interface AttendanceTableProps {
  rows: AttendanceRow[]
  session: ECCFSession
}

export default function AttendanceTable({ rows, session }: AttendanceTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [activeAttendeeRecord, setActiveAttendeeRecord] = useState<AttendanceRow | null>(null)

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Type filter
      if (typeFilter !== 'all' && row.serviceType !== typeFilter) return false

      // Team filter (if admin or general view)
      if (teamFilter !== 'all') {
        const rowTeam = row.teamName?.toLowerCase() || ''
        const target = teamFilter.toLowerCase()
        if (!rowTeam.includes(target) && !target.includes(rowTeam)) return false
      }

      // Search query (matches title, serviceType, or teamName)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = row.meetingTitle?.toLowerCase().includes(q)
        const matchService = row.serviceType.toLowerCase().includes(q)
        const matchTeam = row.teamName?.toLowerCase().includes(q)
        const matchLoggedBy = (row.loggedBy?.fullName || '').toLowerCase().includes(q)
        if (!matchTitle && !matchService && !matchTeam && !matchLoggedBy) return false
      }

      return true
    })
  }, [rows, typeFilter, teamFilter, searchQuery])

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

  const getServiceBadgeVariant = (type: string) => {
    switch (type) {
      case 'Sunday Service':
        return 'default'
      case 'Team Meeting':
        return 'secondary'
      case 'Wednesday Bible Study':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search meetings, topics, or logger..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Service Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] text-xs h-9">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meeting Types</SelectItem>
              {SERVICE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Team Filter (Admin only) */}
          {session.role === 'admin' && (
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-[140px] text-xs h-9">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {FELLOWSHIP_TEAMS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(typeFilter !== 'all' || teamFilter !== 'all' || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs"
              onClick={() => {
                setTypeFilter('all')
                setTeamFilter('all')
                setSearchQuery('')
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Meeting & Topic</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Attendance</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead className="w-[100px] text-right">Roster</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                  No attendance records found matching your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row._id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatDate(row.date)}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getServiceBadgeVariant(row.serviceType)} className="text-[10px] px-1.5 py-0">
                          {row.serviceType}
                        </Badge>
                      </div>
                      {row.meetingTitle ? (
                        <p className="text-xs font-semibold text-foreground line-clamp-1">
                          {row.meetingTitle}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Standard meeting</p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {row.teamName ? (
                      <Badge variant="outline" className="text-xs font-normal">
                        {row.teamName}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">General Fellowship</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="inline-flex flex-col items-end">
                      <span className="font-semibold text-sm text-foreground">
                        {row.totalCount}
                      </span>
                      {row.attendeeCount > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {row.attendeeCount} registered
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate max-w-[140px]">
                        {row.loggedBy?.fullName || 'Exco Member'}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs text-primary hover:text-primary"
                      onClick={() => setActiveAttendeeRecord(row)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Roster</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Attendee Roster Detail Modal */}
      <Dialog
        open={Boolean(activeAttendeeRecord)}
        onOpenChange={(open) => !open && setActiveAttendeeRecord(null)}
      >
        <DialogContent className="max-h-[85vh] w-full max-w-lg overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              <DialogTitle className="font-serif text-lg">
                Meeting Attendance Roster
              </DialogTitle>
            </div>
            <DialogDescription>
              {activeAttendeeRecord?.serviceType}
              {activeAttendeeRecord?.meetingTitle ? ` — ${activeAttendeeRecord.meetingTitle}` : ''}
              {' · '}
              {activeAttendeeRecord?.date && formatDate(activeAttendeeRecord.date)}
            </DialogDescription>
          </DialogHeader>

          {activeAttendeeRecord && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Operational Team: </span>
                  <span className="font-medium text-foreground">
                    {activeAttendeeRecord.teamName || 'All Fellowship'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Present: </span>
                  <span className="font-bold text-primary">
                    {activeAttendeeRecord.totalCount} Attendees
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Ticked Registered Workers ({activeAttendeeRecord.attendees?.length || activeAttendeeRecord.attendeeCount || 0})
                </h4>

                {activeAttendeeRecord.attendees && activeAttendeeRecord.attendees.length > 0 ? (
                  <div className="divide-y rounded-md border bg-card max-h-60 overflow-y-auto">
                    {activeAttendeeRecord.attendees.map((worker, i) => (
                      <div key={worker._id || i} className="flex items-center justify-between p-2.5 text-xs">
                        <span className="font-medium text-foreground">{worker.fullName}</span>
                        {worker.teams && worker.teams.length > 0 ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {worker.teams.join(', ')}
                          </Badge>
                        ) : worker.team ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {worker.team}
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Individual worker attendee references were not saved on this entry, or record was logged as aggregate headcount ({activeAttendeeRecord.totalCount} attendees).
                  </div>
                )}
              </div>

              {activeAttendeeRecord.loggedBy?.fullName && (
                <div className="text-[11px] text-muted-foreground text-right italic">
                  Attribution: Recorded by {activeAttendeeRecord.loggedBy.fullName}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
