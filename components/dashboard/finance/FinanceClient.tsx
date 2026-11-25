'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle } from 'lucide-react'
import type { FinanceRow } from '@/types'
import { FELLOWSHIP_TIME_ZONE, lagosDate } from '@/lib/dashboard/dates'
import { formatCount, formatDate, formatNaira } from '@/lib/dashboard/format'
import { Button } from '@/components/dashboard/ui/button'
import { DataToolbar, type ActiveFilterChip } from '@/components/dashboard/ui/data-toolbar'
import { Label } from '@/components/dashboard/ui/label'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import FinanceStatsCards from '@/components/dashboard/finance/FinanceStatsCards'
import FinanceTable from '@/components/dashboard/finance/FinanceTable'
import RecordTransactionModal from '@/components/dashboard/finance/RecordTransactionModal'
import FinanceExportButton from '@/components/dashboard/finance/FinanceExportButton'

const monthHeadingFormat = new Intl.DateTimeFormat('en-NG', {
  month: 'long',
  year: 'numeric',
  timeZone: FELLOWSHIP_TIME_ZONE,
})

function formatMonthKey(monthKey: string): string {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return monthKey
  return monthHeadingFormat.format(new Date(`${monthKey}-15T12:00:00Z`))
}

interface FinanceClientProps {
  initialEntries: FinanceRow[]
  dateEyebrow?: string
  todayIso?: string
}

export default function FinanceClient({
  initialEntries,
  dateEyebrow,
  todayIso,
}: FinanceClientProps) {
  const router = useRouter()
  const resolvedTodayIso = todayIso ?? lagosDate()
  const resolvedDateEyebrow = dateEyebrow ?? formatDate(resolvedTodayIso)

  const [entries, setEntries] = useState<FinanceRow[]>(initialEntries)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Income' | 'Expense'>('all')
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  useEffect(() => {
    setEntries(initialEntries)
  }, [initialEntries])

  useEffect(() => {
    if (!highlightedId) return
    const timer = window.setTimeout(() => setHighlightedId(null), 3500)
    return () => window.clearTimeout(timer)
  }, [highlightedId])

  // Derive distinct YYYY-MM months from entries, newest first
  const monthOptions = useMemo(() => {
    const unique = new Set<string>()
    for (const entry of entries) {
      const key = entry.transactionDate?.slice(0, 7)
      if (key && /^\d{4}-\d{2}$/.test(key)) {
        unique.add(key)
      }
    }
    return Array.from(unique)
      .sort((a, b) => b.localeCompare(a))
      .map((value) => ({
        value,
        label: formatMonthKey(value),
      }))
  }, [entries])

  const monthLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const opt of monthOptions) {
      map.set(opt.value, opt.label)
    }
    return map
  }, [monthOptions])

  const selectedMonthLabel =
    monthFilter === 'all' ? undefined : (monthLabelMap.get(monthFilter) ?? monthFilter)

  // KPI strip respects month selection so leaders can inspect monthly position directly
  const monthScopedEntries = useMemo(() => {
    if (monthFilter === 'all') return entries
    return entries.filter((e) => e.transactionDate?.startsWith(monthFilter))
  }, [entries, monthFilter])

  const totalIncome = useMemo(
    () =>
      monthScopedEntries
        .filter((e) => e.type === 'Income')
        .reduce((sum, e) => sum + e.amount, 0),
    [monthScopedEntries]
  )

  const totalExpense = useMemo(
    () =>
      monthScopedEntries
        .filter((e) => e.type === 'Expense')
        .reduce((sum, e) => sum + e.amount, 0),
    [monthScopedEntries]
  )

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((e) => {
      const matchesMonth =
        monthFilter === 'all' || e.transactionDate?.startsWith(monthFilter)
      if (!matchesMonth) return false

      const matchesType = typeFilter === 'all' || e.type === typeFilter
      if (!matchesType) return false

      if (!q) return true
      return (
        e.category.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.flutterwaveRef && e.flutterwaveRef.toLowerCase().includes(q)) ||
        formatDate(e.transactionDate).toLowerCase().includes(q)
      )
    })
  }, [entries, search, typeFilter, monthFilter])

  const filteredNet = useMemo(
    () =>
      filteredEntries.reduce(
        (sum, e) => sum + (e.type === 'Income' ? e.amount : -e.amount),
        0
      ),
    [filteredEntries]
  )

  const hasActiveFilters =
    typeFilter !== 'all' || monthFilter !== 'all' || search.trim().length > 0

  const resetFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setMonthFilter('all')
  }

  const activeFilters: ActiveFilterChip[] = []
  if (typeFilter !== 'all') {
    activeFilters.push({
      id: 'type',
      label: 'Type',
      value: typeFilter,
      onRemove: () => setTypeFilter('all'),
    })
  }
  if (monthFilter !== 'all') {
    activeFilters.push({
      id: 'month',
      label: 'Month',
      value: selectedMonthLabel ?? monthFilter,
      onRemove: () => setMonthFilter('all'),
    })
  }
  if (search.trim()) {
    activeFilters.push({
      id: 'search',
      label: 'Search',
      value: search.trim(),
      onRemove: () => setSearch(''),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={resolvedDateEyebrow}
        title="Finance"
        description="Income, expenses, and the monthly position."
        secondaryActions={<FinanceExportButton entries={filteredEntries} />}
        primaryAction={
          <Button
            type="button"
            onClick={() => setShowModal(true)}
            className="min-h-11 h-11 w-full gap-2 px-4 font-semibold sm:w-auto"
          >
            <PlusCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Record transaction</span>
          </Button>
        }
      />

      <FinanceStatsCards
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        periodLabel={selectedMonthLabel}
      />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-sans text-lg font-semibold tracking-tight text-foreground">
            Ledger entries
          </h2>
          <p className="text-sm text-muted-foreground">
            Filter offerings, tithes, online giving, and fellowship disbursements.
          </p>
        </div>

        <DataToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchLabel="Search finance transactions"
          searchPlaceholder="Search category, description, or reference…"
          filterSheetTitle="Filter finance ledger"
          activeFilterCount={activeFilters.length}
          activeFilters={activeFilters}
          onResetFilters={resetFilters}
          filters={
            <>
              <Select
                value={typeFilter}
                onValueChange={(val) => setTypeFilter(val as 'all' | 'Income' | 'Expense')}
              >
                <SelectTrigger
                  aria-label="Filter by transaction type"
                  className="w-[165px] bg-card"
                >
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="Income">Income (+)</SelectItem>
                  <SelectItem value="Expense">Expense (-)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger
                  aria-label="Filter by month"
                  className="w-[190px] bg-card"
                >
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetFilters}
                  className="min-h-11 px-3 text-sm md:min-h-10"
                >
                  Reset
                </Button>
              )}
            </>
          }
          mobileFilters={
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile-finance-type" className="text-sm font-medium">
                  Transaction type
                </Label>
                <Select
                  value={typeFilter}
                  onValueChange={(val) => setTypeFilter(val as 'all' | 'Income' | 'Expense')}
                >
                  <SelectTrigger
                    id="mobile-finance-type"
                    aria-label="Filter by transaction type"
                  >
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="Income">Income (+)</SelectItem>
                    <SelectItem value="Expense">Expense (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-finance-month" className="text-sm font-medium">
                  Month
                </Label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger
                    id="mobile-finance-month"
                    aria-label="Filter by month"
                  >
                    <SelectValue placeholder="All months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All months</SelectItem>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
          meta={
            <span>
              Showing {formatCount(filteredEntries.length)} of {formatCount(entries.length)}{' '}
              {entries.length === 1 ? 'entry' : 'entries'} · Net {formatNaira(filteredNet)}
            </span>
          }
        />

        <FinanceTable
          entries={filteredEntries}
          highlightedId={highlightedId}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          onRecordClick={() => setShowModal(true)}
        />
      </section>

      <RecordTransactionModal
        open={showModal}
        onOpenChange={setShowModal}
        todayIso={resolvedTodayIso}
        onSuccess={(newEntry) => {
          setShowModal(false)
          setEntries((prev) => [
            newEntry as FinanceRow,
            ...prev.filter((item) => item._id !== newEntry._id),
          ])
          setHighlightedId(newEntry._id)
          router.refresh()
        }}
      />
    </div>
  )
}
