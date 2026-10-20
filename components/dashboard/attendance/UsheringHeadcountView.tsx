'use client'

import * as React from 'react'
import { useState, useTransition, useMemo } from 'react'
import {
  Calendar,
  Users,
  BarChart3,
  CheckCircle2,
  Search,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Loader2,
  CalendarDays,
} from 'lucide-react'
import type { AttendanceRow, ECCFSession } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/dashboard/ui/card'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import { Badge } from '@/components/dashboard/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { GENERAL_SERVICE_TYPES, type GeneralServiceType } from '@/lib/dashboard/attendance-constants'
import { recordGeneralHeadcountAction } from '@/app/actions/attendance-actions'
import { toastFromResult } from '@/lib/dashboard/toast'

interface UsheringHeadcountViewProps {
  session: ECCFSession
  rows: AttendanceRow[]
  onSuccess?: () => void
}

export default function UsheringHeadcountView({
  rows,
  onSuccess,
}: UsheringHeadcountViewProps) {
  const [isPending, startTransition] = useTransition()

  // Headcount Logger Form State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [date, setDate] = useState(todayStr)
  const [serviceType, setServiceType] = useState<GeneralServiceType>('Sunday Service')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [totalCount, setTotalCount] = useState<string>('')
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [menCount, setMenCount] = useState<string>('')
  const [womenCount, setWomenCount] = useState<string>('')
  const [childrenCount, setChildrenCount] = useState<string>('')
  const [firstTimersCount, setFirstTimersCount] = useState<string>('')
  const [notes, setNotes] = useState('')

  // History Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [serviceFilter, setServiceFilter] = useState('all')

  // Filter general service rows (exclude team meetings)
  const generalRows = useMemo(() => {
    return rows.filter((r) => r.serviceType !== 'Team Meeting' && r.serviceType !== 'Exco Meeting')
  }, [rows])

  // Filtered rows for table
  const filteredRows = useMemo(() => {
    return generalRows.filter((row) => {
      if (serviceFilter !== 'all' && row.serviceType !== serviceFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = row.meetingTitle?.toLowerCase().includes(q)
        const matchService = row.serviceType.toLowerCase().includes(q)
        const matchNotes = row.notes?.toLowerCase().includes(q)
        const matchLoggedBy = (row.loggedBy?.fullName || '').toLowerCase().includes(q)
        if (!matchTitle && !matchService && !matchNotes && !matchLoggedBy) return false
      }

      return true
    })
  }, [generalRows, serviceFilter, searchQuery])

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalRecorded = generalRows.length
    const sundayServices = generalRows.filter((r) => r.serviceType === 'Sunday Service')
    const sundayAvg =
      sundayServices.length > 0
        ? Math.round(
            sundayServices.reduce((sum, r) => sum + (r.totalCount || 0), 0) / sundayServices.length
          )
        : 0
    const highestCount =
      generalRows.length > 0 ? Math.max(...generalRows.map((r) => r.totalCount || 0)) : 0
    const latestService = generalRows[0]

    return {
      totalRecorded,
      sundayAvg,
      highestCount,
      latestService,
    }
  }, [generalRows])

  // Preset Date Helper
  const setLastDayOfWeek = (dayIndex: number) => {
    // 0 = Sunday, 3 = Wednesday
    const d = new Date()
    const diff = (d.getDay() - dayIndex + 7) % 7
    d.setDate(d.getDate() - (diff === 0 ? 7 : diff))
    setDate(d.toISOString().split('T')[0])
  }

  // Breakdown Sum Calculation
  const breakdownSum =
    (parseInt(menCount, 10) || 0) +
    (parseInt(womenCount, 10) || 0) +
    (parseInt(childrenCount, 10) || 0) +
    (parseInt(firstTimersCount, 10) || 0)

  const applyBreakdownSum = () => {
    if (breakdownSum > 0) {
      setTotalCount(String(breakdownSum))
    }
  }

  // Adjust Total by delta (+10, +50, +100)
  const adjustTotal = (delta: number) => {
    const current = parseInt(totalCount, 10) || 0
    const nextVal = Math.max(0, current + delta)
    setTotalCount(String(nextVal))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const countNum = parseInt(totalCount, 10)
    if (!countNum || countNum <= 0) return

    startTransition(async () => {
      const result = await recordGeneralHeadcountAction({
        date,
        serviceType,
        meetingTitle: meetingTitle.trim() || undefined,
        totalCount: countNum,
        menCount: menCount ? parseInt(menCount, 10) : undefined,
        womenCount: womenCount ? parseInt(womenCount, 10) : undefined,
        childrenCount: childrenCount ? parseInt(childrenCount, 10) : undefined,
        firstTimersCount: firstTimersCount ? parseInt(firstTimersCount, 10) : undefined,
        notes: notes.trim() || undefined,
      })

      if (
        toastFromResult(result, {
          success: `${serviceType} headcount (${countNum}) recorded successfully!`,
        })
      ) {
        setTotalCount('')
        setMeetingTitle('')
        setMenCount('')
        setWomenCount('')
        setChildrenCount('')
        setFirstTimersCount('')
        setNotes('')
        setShowBreakdown(false)
        onSuccess?.()
      }
    })
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
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
      {/* Headcount Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Services Counted</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {metrics.totalRecorded}
              </span>
              <span className="text-xs text-muted-foreground">records</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Sunday Avg Count</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {metrics.sundayAvg.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">attendees</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Highest Peak</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
                {metrics.highestCount.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">peak</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Latest Service</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {metrics.latestService ? metrics.latestService.totalCount.toLocaleString() : '—'}
              </span>
              <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                {metrics.latestService ? `${metrics.latestService.serviceType} (${formatDate(metrics.latestService.date)})` : 'No logs yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Action Console: Fast Headcount Logger Card */}
      <Card className="border-primary/20 shadow-md bg-gradient-to-b from-card to-card/95">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-serif text-lg font-bold sm:text-xl">
                  Ushering Headcount Console
                </CardTitle>
                <CardDescription className="text-xs">
                  Fast numeric headcount logging for church services. No names or ticking required.
                </CardDescription>
              </div>
            </div>

            <Badge variant="outline" className="w-fit text-[11px] font-normal border-primary/30 text-primary">
              Ushering & CSGB Admin Authorized
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Date & Service Type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Date Input with Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="headcount-date" className="text-xs font-medium">
                    Service Date
                  </Label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDate(todayStr)}
                      className={`text-[10px] rounded px-1.5 py-0.5 transition-colors ${
                        date === todayStr
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setLastDayOfWeek(0)}
                      className="text-[10px] rounded px-1.5 py-0.5 bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      Last Sun
                    </button>
                    <button
                      type="button"
                      onClick={() => setLastDayOfWeek(3)}
                      className="text-[10px] rounded px-1.5 py-0.5 bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      Last Wed
                    </button>
                  </div>
                </div>
                <Input
                  id="headcount-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 text-sm"
                  required
                />
              </div>

              {/* Service Type */}
              <div className="space-y-2">
                <Label htmlFor="headcount-type" className="text-xs font-medium">
                  Service Type
                </Label>
                <Select
                  value={serviceType}
                  onValueChange={(val) => setServiceType(val as GeneralServiceType)}
                >
                  <SelectTrigger id="headcount-type" className="h-10 text-sm">
                    <SelectValue placeholder="Select Service" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENERAL_SERVICE_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="text-xs sm:text-sm">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Service Title / Topic (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="headcount-title" className="text-xs font-medium">
                Service Theme / Special Programme Title{' '}
                <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="headcount-title"
                placeholder="e.g. Communion Service, Freshers Welcome Service, Thanksgiving"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="h-10 text-xs sm:text-sm"
              />
            </div>

            {/* Row 3: Total Headcount Input (Prominent & Large) */}
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label htmlFor="headcount-total" className="text-sm font-bold text-foreground">
                    Total Headcount Counted *
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Direct count from ushers tally sheets across all auditoriums & overflows.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Add:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium px-2.5 bg-background"
                    onClick={() => adjustTotal(10)}
                  >
                    +10
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium px-2.5 bg-background"
                    onClick={() => adjustTotal(50)}
                  >
                    +50
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium px-2.5 bg-background"
                    onClick={() => adjustTotal(100)}
                  >
                    +100
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    id="headcount-total"
                    type="number"
                    min="1"
                    placeholder="e.g. 450"
                    value={totalCount}
                    onChange={(e) => setTotalCount(e.target.value)}
                    className="h-14 text-2xl font-bold tracking-tight text-foreground bg-background px-4 border-primary/40 focus-visible:ring-primary"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
                    attendees
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Demographic Breakdown Accordion / Toggle */}
            <div className="rounded-lg border bg-card/60 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <button
                    type="button"
                    onClick={() => setShowBreakdown((prev) => !prev)}
                    className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary transition-colors text-left"
                  >
                    <Users className="h-4 w-4 text-primary" />
                    <span>Detailed Demographic Breakdown (Men, Women, Children, First-Timers)</span>
                    <Badge variant="secondary" className="text-[10px] ml-1">
                      {showBreakdown ? 'Hide' : 'Optional'}
                    </Badge>
                  </button>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    If usher sections separated the count by section.
                  </p>
                </div>

                {showBreakdown && breakdownSum > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary gap-1"
                    onClick={applyBreakdownSum}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Set Total ({breakdownSum})</span>
                  </Button>
                )}
              </div>

              {showBreakdown && (
                <div className="mt-4 space-y-3 pt-3 border-t">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="space-y-1">
                      <Label htmlFor="bc-men" className="text-xs text-muted-foreground">
                        Men (Brothers)
                      </Label>
                      <Input
                        id="bc-men"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={menCount}
                        onChange={(e) => setMenCount(e.target.value)}
                        className="h-9 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="bc-women" className="text-xs text-muted-foreground">
                        Women (Sisters)
                      </Label>
                      <Input
                        id="bc-women"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={womenCount}
                        onChange={(e) => setWomenCount(e.target.value)}
                        className="h-9 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="bc-children" className="text-xs text-muted-foreground">
                        Children / Teens
                      </Label>
                      <Input
                        id="bc-children"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={childrenCount}
                        onChange={(e) => setChildrenCount(e.target.value)}
                        className="h-9 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="bc-firsttimers" className="text-xs text-muted-foreground">
                        First-Timers
                      </Label>
                      <Input
                        id="bc-firsttimers"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={firstTimersCount}
                        onChange={(e) => setFirstTimersCount(e.target.value)}
                        className="h-9 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {breakdownSum > 0 && (
                    <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-muted/40 text-muted-foreground">
                      <span>Breakdown Sum: <strong className="text-foreground">{breakdownSum}</strong></span>
                      {totalCount && parseInt(totalCount, 10) !== breakdownSum && (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400">
                          Notice: Differs from Total Headcount ({totalCount}) by {Math.abs(parseInt(totalCount, 10) - breakdownSum)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Row 4: Notes / Narration (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="headcount-notes" className="text-xs font-medium">
                Ushering Notes / Special Observations{' '}
                <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="headcount-notes"
                placeholder="e.g. Overflow hall opened at 9:15am. Heavy rain during arrival."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-10 text-xs sm:text-sm"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={isPending || !totalCount || parseInt(totalCount, 10) <= 0}
                className="w-full gap-2 text-sm sm:text-base font-semibold h-12 shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Logging Headcount...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Log {serviceType} Attendance ({totalCount ? `${totalCount} Attendees` : '0'})</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Headcount History Ledger */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between shadow-sm">
          <div>
            <h3 className="font-serif text-base font-bold text-foreground">
              General Service Attendance History
            </h3>
            <p className="text-xs text-muted-foreground">
              Ushering logs for regular and special congregational services.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search date, notes, logger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[145px] text-xs h-9">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {GENERAL_SERVICE_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(serviceFilter !== 'all' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={() => {
                  setServiceFilter('all')
                  setSearchQuery('')
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead>Service / Programme</TableHead>
                <TableHead className="text-right">Total Headcount</TableHead>
                <TableHead className="hidden md:table-cell">Demographics</TableHead>
                <TableHead className="hidden lg:table-cell">Notes</TableHead>
                <TableHead className="text-right">Logged By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                    No general service headcount logs match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row._id} className="hover:bg-muted/20 transition-colors">
                    {/* Date */}
                    <TableCell className="font-medium text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{formatDate(row.date)}</span>
                      </div>
                    </TableCell>

                    {/* Service Type & Topic */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              row.serviceType === 'Sunday Service'
                                ? 'default'
                                : row.serviceType === 'Wednesday Bible Study'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {row.serviceType}
                          </Badge>
                        </div>
                        {row.meetingTitle ? (
                          <p className="text-xs font-semibold text-foreground line-clamp-1">
                            {row.meetingTitle}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Regular service</p>
                        )}
                      </div>
                    </TableCell>

                    {/* Headcount */}
                    <TableCell className="text-right">
                      <div className="inline-flex flex-col items-end">
                        <span className="font-bold text-base text-foreground">
                          {row.totalCount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">attendees</span>
                      </div>
                    </TableCell>

                    {/* Demographics Breakdown Pills */}
                    <TableCell className="hidden md:table-cell">
                      {row.menCount || row.womenCount || row.childrenCount || row.firstTimersCount ? (
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          {row.menCount !== undefined && (
                            <span className="rounded bg-sky-500/10 px-1.5 py-0.5 font-medium text-sky-700 dark:text-sky-300">
                              M: {row.menCount}
                            </span>
                          )}
                          {row.womenCount !== undefined && (
                            <span className="rounded bg-rose-500/10 px-1.5 py-0.5 font-medium text-rose-700 dark:text-rose-300">
                              W: {row.womenCount}
                            </span>
                          )}
                          {row.childrenCount !== undefined && (
                            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-medium text-amber-700 dark:text-amber-300">
                              C: {row.childrenCount}
                            </span>
                          )}
                          {row.firstTimersCount !== undefined && (
                            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
                              FT: {row.firstTimersCount}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Aggregate count</span>
                      )}
                    </TableCell>

                    {/* Notes */}
                    <TableCell className="hidden lg:table-cell max-w-[200px]">
                      {row.notes ? (
                        <p className="text-xs text-muted-foreground truncate" title={row.notes}>
                          {row.notes}
                        </p>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    {/* Logged By */}
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate max-w-[130px]">
                          {row.loggedBy?.fullName || 'Ushering Exco'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
