'use client'

import React, { useEffect, useId, useMemo, useState } from 'react'
import { PlusCircle } from 'lucide-react'
import type { WelfareLedgerRow } from '@/types'
import { formatCount } from '@/lib/dashboard/format'
import WelfareStatsCards from './WelfareStatsCards'
import WelfareLedgerTable from './WelfareLedgerTable'
import WelfareLedgerExportButton from './WelfareLedgerExportButton'
import RecordWelfareTransactionModal from './RecordWelfareTransactionModal'
import { Button } from '@/components/dashboard/ui/button'
import {
  DataToolbar,
  type ActiveFilterChip,
} from '@/components/dashboard/ui/data-toolbar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'

interface WelfareLedgerClientProps {
  initialEntries: WelfareLedgerRow[]
  onEntriesCountChange?: (count: number) => void
}

/**
 * Recomputes running balances chronologically (oldest to newest), then returns newest first.
 */
function recalculateRunningBalances(list: WelfareLedgerRow[]): WelfareLedgerRow[] {
  const sorted = [...list].sort((a, b) => {
    const da = new Date(a.date).getTime()
    const db = new Date(b.date).getTime()
    if (da !== db) return da - db
    const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return ca - cb
  })

  let running = 0
  const computed = sorted.map((entry) => {
    const amount = Number(entry.amount) || 0
    const charge = Number(entry.bankCharge) || 0
    if (entry.type === 'Credit') {
      running += amount - charge
    } else {
      running -= amount + charge
    }
    return {
      ...entry,
      runningBalance: running,
    }
  })

  return computed.reverse()
}

export default function WelfareLedgerClient({
  initialEntries,
  onEntriesCountChange,
}: WelfareLedgerClientProps) {
  const [entries, setEntries] = useState<WelfareLedgerRow[]>(() =>
    recalculateRunningBalances(initialEntries)
  )
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Credit' | 'Debit'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const mobileTypeId = useId()
  const mobileCategoryId = useId()

  useEffect(() => {
    setEntries(recalculateRunningBalances(initialEntries))
  }, [initialEntries])

  useEffect(() => {
    onEntriesCountChange?.(entries.length)
  }, [entries.length, onEntriesCountChange])

  const { totalCredit, totalDebit, totalBankCharges, currentBalance } = useMemo(() => {
    let credit = 0
    let debit = 0
    let charges = 0

    entries.forEach((e) => {
      const amt = Number(e.amount) || 0
      const chg = Number(e.bankCharge) || 0
      charges += chg
      if (e.type === 'Credit') {
        credit += amt
      } else {
        debit += amt
      }
    })

    const balance =
      entries.length > 0 ? entries[0].runningBalance : credit - debit - charges

    return {
      totalCredit: credit,
      totalDebit: debit,
      totalBankCharges: charges,
      currentBalance: balance,
    }
  }, [entries])

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>()
    entries.forEach((e) => {
      if (e.category) set.add(e.category)
    })
    return Array.from(set).sort()
  }, [entries])

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const term = search.toLowerCase().trim()
      const matchesSearch =
        term === '' ||
        e.description.toLowerCase().includes(term) ||
        (e.category && e.category.toLowerCase().includes(term)) ||
        (e.recipient && e.recipient.toLowerCase().includes(term)) ||
        (e.reference && e.reference.toLowerCase().includes(term)) ||
        (e.loggedByName && e.loggedByName.toLowerCase().includes(term))

      const matchesType = typeFilter === 'all' || e.type === typeFilter
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter

      return matchesSearch && matchesType && matchesCategory
    })
  }, [entries, search, typeFilter, categoryFilter])

  const handleAddEntry = (newEntry: WelfareLedgerRow) => {
    setShowModal(false)
    setEntries((prev) => recalculateRunningBalances([newEntry, ...prev]))
  }

  const handleDeleteEntry = (deletedId: string) => {
    setEntries((prev) =>
      recalculateRunningBalances(prev.filter((e) => e._id !== deletedId))
    )
  }

  const handleResetFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setCategoryFilter('all')
  }

  const activeFilters: ActiveFilterChip[] = []
  if (typeFilter !== 'all') {
    activeFilters.push({
      id: 'flow',
      label: 'Flow',
      value: typeFilter === 'Credit' ? 'Credits (+)' : 'Debits (-)',
      onRemove: () => setTypeFilter('all'),
    })
  }
  if (categoryFilter !== 'all') {
    activeFilters.push({
      id: 'category',
      label: 'Category',
      value: categoryFilter,
      onRemove: () => setCategoryFilter('all'),
    })
  }

  const hasActiveFilters =
    Boolean(search.trim()) || typeFilter !== 'all' || categoryFilter !== 'all'

  const desktopFilters = (
    <>
      <Select
        value={typeFilter}
        onValueChange={(val) => setTypeFilter(val as 'all' | 'Credit' | 'Debit')}
      >
        <SelectTrigger
          aria-label="Filter by transaction flow"
          className="w-[155px] bg-card"
        >
          <SelectValue placeholder="All flows" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All flows</SelectItem>
          <SelectItem value="Credit">Credits (+)</SelectItem>
          <SelectItem value="Debit">Debits (-)</SelectItem>
        </SelectContent>
      </Select>

      {uniqueCategories.length > 0 && (
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger
            aria-label="Filter by category"
            className="w-[210px] bg-card"
          >
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {uniqueCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </>
  )

  const mobileFilters = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor={mobileTypeId}
          className="block text-[13px] font-medium text-foreground"
        >
          Transaction flow
        </label>
        <Select
          value={typeFilter}
          onValueChange={(val) => setTypeFilter(val as 'all' | 'Credit' | 'Debit')}
        >
          <SelectTrigger
            id={mobileTypeId}
            aria-label="Filter by transaction flow"
            className="w-full"
          >
            <SelectValue placeholder="All flows" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All flows</SelectItem>
            <SelectItem value="Credit">Credits (+)</SelectItem>
            <SelectItem value="Debit">Debits (-)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {uniqueCategories.length > 0 && (
        <div className="space-y-1.5">
          <label
            htmlFor={mobileCategoryId}
            className="block text-[13px] font-medium text-foreground"
          >
            Category
          </label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger
              id={mobileCategoryId}
              aria-label="Filter by category"
              className="w-full"
            >
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {uniqueCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <WelfareStatsCards
        currentBalance={currentBalance}
        totalCredit={totalCredit}
        totalDebit={totalDebit}
        totalBankCharges={totalBankCharges}
      />

      <DataToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchLabel="Search welfare purse ledger"
        searchPlaceholder="Search description, beneficiary, ref, or category…"
        filters={desktopFilters}
        mobileFilters={mobileFilters}
        activeFilterCount={activeFilters.length}
        activeFilters={activeFilters}
        onResetFilters={handleResetFilters}
        filterSheetTitle="Filter ledger"
        filterSheetDescription="Narrow Welfare Purse entries by flow or category."
        actions={
          <>
            <WelfareLedgerExportButton entries={filteredEntries} />
            <Button
              type="button"
              onClick={() => setShowModal(true)}
              className="min-h-11 md:min-h-10"
            >
              <PlusCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Record transaction</span>
            </Button>
          </>
        }
        meta={`${formatCount(filteredEntries.length)} of ${formatCount(entries.length)} transactions`}
      />

      <h2 className="sr-only">Welfare purse transactions</h2>

      <WelfareLedgerTable
        entries={filteredEntries}
        onDeleteEntry={handleDeleteEntry}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      <RecordWelfareTransactionModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={handleAddEntry}
      />
    </div>
  )
}
