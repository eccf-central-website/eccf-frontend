'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
  Calendar,
  Clock,
  Copy,
  Check,
  HeartHandshake,
  MessageSquareText,
  Search,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'
import type { PrayerRequest } from '@/types'
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
import { toast } from 'sonner'

interface PrayerRequestsFeedProps {
  requests: PrayerRequest[]
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

function getRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    if (diffMs < 0) return 'Just now'
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHour < 24) return `${diffHour}h ago`
    if (diffDay === 1) return 'Yesterday'
    if (diffDay < 7) return `${diffDay}d ago`
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`
    return `${Math.floor(diffDay / 30)}mo ago`
  } catch {
    return ''
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return (name[0] || 'A').toUpperCase()
}

export default function PrayerRequestsFeed({ requests }: PrayerRequestsFeedProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'named' | 'anonymous' | 'this_week'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // One week boundary for metrics and filtering
  const oneWeekAgo = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.getTime()
  }, [])

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = requests.length
    let thisWeek = 0
    let anonymous = 0
    let named = 0

    requests.forEach((r) => {
      const isAnon = !r.name || r.name.toLowerCase() === 'anonymous'
      if (isAnon) {
        anonymous++
      } else {
        named++
      }

      const reqDate = new Date(r.dateSubmitted).getTime()
      if (!isNaN(reqDate) && reqDate >= oneWeekAgo) {
        thisWeek++
      }
    })

    return { total, thisWeek, anonymous, named }
  }, [requests, oneWeekAgo])

  // Filtered and Sorted Requests
  const filteredRequests = useMemo(() => {
    return requests
      .filter((r) => {
        const isAnon = !r.name || r.name.toLowerCase() === 'anonymous'

        // Tab Filter
        if (activeTab === 'named' && isAnon) return false
        if (activeTab === 'anonymous' && !isAnon) return false
        if (activeTab === 'this_week') {
          const reqDate = new Date(r.dateSubmitted).getTime()
          if (isNaN(reqDate) || reqDate < oneWeekAgo) return false
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const nameMatch = (r.name || 'Anonymous').toLowerCase().includes(q)
          const requestMatch = (r.request || '').toLowerCase().includes(q)
          if (!nameMatch && !requestMatch) return false
        }

        return true
      })
      .sort((a, b) => {
        const dateA = new Date(a.dateSubmitted).getTime() || 0
        const dateB = new Date(b.dateSubmitted).getTime() || 0
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB
      })
  }, [requests, activeTab, searchQuery, sortBy, oneWeekAgo])

  const handleCopyRequest = (item: PrayerRequest) => {
    const submitter = item.name && item.name.toLowerCase() !== 'anonymous' ? item.name : 'Anonymous'
    const fullDate = formatFullDateTime(item.dateSubmitted)
    const textToCopy = `[ECCF Prayer Request]\nFrom: ${submitter}\nDate: ${fullDate}\n\n"${item.request}"`

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopiedId(item._id)
        toast.success('Prayer request copied to clipboard!')
        setTimeout(() => setCopiedId(null), 2500)
      })
      .catch(() => {
        toast.error('Failed to copy to clipboard')
      })
  }

  return (
    <div className="space-y-6">
      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Requests
              </p>
              <h3 className="text-2xl font-bold text-foreground">{metrics.total}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Received This Week
              </p>
              <h3 className="text-2xl font-bold text-foreground">{metrics.thisWeek}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Named vs Anonymous
              </p>
              <h3 className="text-xl font-bold text-foreground">
                {metrics.named}{' '}
                <span className="text-xs font-normal text-muted-foreground">named</span>
                {' · '}
                {metrics.anonymous}{' '}
                <span className="text-xs font-normal text-muted-foreground">anon</span>
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by submitter name or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({metrics.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('this_week')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === 'this_week'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              This Week ({metrics.thisWeek})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('named')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === 'named'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Named ({metrics.named})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('anonymous')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === 'anonymous'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Anon ({metrics.anonymous})
            </button>
          </div>

          {/* Sort Control */}
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as 'newest' | 'oldest')}>
            <SelectTrigger className="w-[130px] text-xs h-9">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || activeTab !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearchQuery('')
                setActiveTab('all')
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Requests Feed Cards */}
      {filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center shadow-sm">
          <HeartHandshake className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <h4 className="font-semibold text-foreground text-sm">No prayer requests found</h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `No requests match "${searchQuery}". Try adjusting your keywords or clearing the filter.`
              : 'There are no prayer requests in this filtered view.'}
          </p>
          {(searchQuery || activeTab !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs"
              onClick={() => {
                setSearchQuery('')
                setActiveTab('all')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((item) => {
            const isAnon = !item.name || item.name.toLowerCase() === 'anonymous'
            const relativeTime = getRelativeTime(item.dateSubmitted)
            const fullDateTime = formatFullDateTime(item.dateSubmitted)
            const isCopied = copiedId === item._id

            return (
              <Card
                key={item._id}
                className="overflow-hidden border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Card Header: Submitter + Timestamp */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                      {isAnon ? (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Shield className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                          {getInitials(item.name || '')}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {isAnon ? 'Anonymous Believer' : item.name}
                          </span>
                          {isAnon ? (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Anonymous
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary">
                              Named
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timestamp Section */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-center">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                      <span className="font-medium text-foreground/80">{fullDateTime}</span>
                      {relativeTime && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-2 py-0.5 bg-muted font-normal text-muted-foreground"
                        >
                          {relativeTime}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Prayer Request Body */}
                  <div className="relative rounded-lg border-l-4 border-primary/70 bg-muted/30 p-4 pl-4 sm:pl-5">
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {item.request}
                    </p>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary/70" />
                      <span>Intercessory Prayer Network</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyRequest(item)}
                      className={`h-8 gap-1.5 text-xs transition-colors ${
                        isCopied
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Request</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
