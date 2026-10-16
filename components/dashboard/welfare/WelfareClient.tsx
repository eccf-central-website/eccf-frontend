'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
  CheckCircle2,
  Clock,
  HeartHandshake,
  Search,
  Check,
  AlertCircle,
  Loader2,
  User,
} from 'lucide-react'
import type { SafeWelfareRequest } from '@/types'
import { Badge } from '@/components/dashboard/ui/badge'
import { Button } from '@/components/dashboard/ui/button'
import { Card, CardContent } from '@/components/dashboard/ui/card'
import { Input } from '@/components/dashboard/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { resolveWelfareRequest } from '@/app/actions/welfare-actions'
import { toast } from 'sonner'

interface WelfareClientProps {
  initialRequests: SafeWelfareRequest[]
}

function formatFullDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return dateStr
  }
}

export default function WelfareClient({ initialRequests }: WelfareClientProps) {
  const [requests, setRequests] = useState<SafeWelfareRequest[]>(initialRequests)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all')
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'Pending').length,
    [requests]
  )
  const resolvedCount = useMemo(
    () => requests.filter((r) => r.status === 'Resolved').length,
    [requests]
  )

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        search === '' ||
        req.name.toLowerCase().includes(search.toLowerCase()) ||
        req.requestDetails.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && req.status === 'Pending') ||
        (statusFilter === 'resolved' && req.status === 'Resolved')

      return matchesSearch && matchesStatus
    })
  }, [requests, search, statusFilter])

  async function handleResolve(id: string) {
    setResolvingId(id)
    try {
      const res = await resolveWelfareRequest(id)
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: 'Resolved' as const } : r))
        )
        toast.success('Welfare request marked as resolved.')
      } else {
        toast.error(res.error || 'Failed to update request.')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-xs border-border/80">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Requests
              </span>
              <HeartHandshake className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {requests.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-amber-200/60 bg-amber-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                Pending Attention
              </span>
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-amber-700">
                {pendingCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-emerald-200/60 bg-emerald-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                Resolved
              </span>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-emerald-700">
                {resolvedCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name or request details..."
            className="pl-9 bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as 'all' | 'pending' | 'resolved')}
          >
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending Only</SelectItem>
              <SelectItem value="resolved">Resolved Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Welfare Requests Feed */}
      {filteredRequests.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No welfare requests match your filter.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((req) => (
            <Card
              key={req._id}
              className={`transition-all shadow-xs ${
                req.status === 'Pending'
                  ? 'border-l-4 border-l-amber-500 bg-white'
                  : 'border-l-4 border-l-emerald-500 bg-stone-50/50'
              }`}
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5 font-bold text-base text-foreground">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{req.name}</span>
                      </div>
                      <Badge
                        variant={req.status === 'Pending' ? 'outline' : 'secondary'}
                        className={
                          req.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }
                      >
                        {req.status === 'Pending' ? 'Pending Attention' : 'Resolved'}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatFullDateTime(req.dateSubmitted)}
                      </span>
                    </div>

                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                      {req.requestDetails}
                    </p>
                  </div>

                  {req.status === 'Pending' && (
                    <div className="shrink-0 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleResolve(req._id)}
                        disabled={resolvingId === req._id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        {resolvingId === req._id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Marking...
                          </>
                        ) : (
                          <>
                            <Check className="mr-1.5 h-4 w-4" />
                            Mark Resolved
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
