'use client'

import React, { useState, useMemo } from 'react'
import type { WelfareLedgerRow } from '@/types'
import WelfareStatsCards from './WelfareStatsCards'
import WelfareLedgerTable from './WelfareLedgerTable'
import WelfareLedgerExportButton from './WelfareLedgerExportButton'
import RecordWelfareTransactionModal from './RecordWelfareTransactionModal'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { PlusCircle, Search } from 'lucide-react'

interface WelfareLedgerClientProps {
  initialEntries: WelfareLedgerRow[]
}

/**
 * Recomputes running balances chronologically (oldest to newest), then returns newest first.
 */
function recalculateRunningBalances(list: WelfareLedgerRow[]): WelfareLedgerRow[] {
  // Sort ascending by date & createdAt
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

  // Return newest first
  return computed.reverse()
}

export default function WelfareLedgerClient({ initialEntries }: WelfareLedgerClientProps) {
  const [entries, setEntries] = useState<WelfareLedgerRow[]>(() =>
    recalculateRunningBalances(initialEntries)
  )
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Credit' | 'Debit'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Overall financial position of the Welfare Purse
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

    // Available purse balance = (Total Credits - Bank Charges on Credits) - (Total Debits + Bank Charges on Debits)
    // which equals latest running balance if transactions exist, else credit - debit - charges
    const balance = entries.length > 0 ? entries[0].runningBalance : credit - debit - charges

    return {
      totalCredit: credit,
      totalDebit: debit,
      totalBankCharges: charges,
      currentBalance: balance,
    }
  }, [entries])

  // Extract unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>()
    entries.forEach((e) => {
      if (e.category) set.add(e.category)
    })
    return Array.from(set).sort()
  }, [entries])

  // Filtered rows for table & export
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
    setEntries((prev) => recalculateRunningBalances(prev.filter((e) => e._id !== deletedId)))
  }

  return (
    <div className="space-y-6">
      {/* Financial Position Stats Cards */}
      <WelfareStatsCards
        currentBalance={currentBalance}
        totalCredit={totalCredit}
        totalDebit={totalDebit}
        totalBankCharges={totalBankCharges}
      />

      {/* Toolbar: Search, Type filter, Category filter, Export, Add Transaction */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, recipient, ref, or category..."
              className="pl-9 h-11 rounded-xl bg-background text-xs sm:text-sm"
            />
          </div>

          {/* Type Filter */}
          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val as 'all' | 'Credit' | 'Debit')}
          >
            <SelectTrigger className="w-[140px] h-11 rounded-xl bg-background text-xs sm:text-sm">
              <SelectValue placeholder="All Flows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Flows</SelectItem>
              <SelectItem value="Credit">Credits (+)</SelectItem>
              <SelectItem value="Debit">Debits (-)</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          {uniqueCategories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] h-11 rounded-xl bg-background text-xs sm:text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <WelfareLedgerExportButton entries={filteredEntries} />
          <Button
            onClick={() => setShowModal(true)}
            className="min-h-[44px] px-4 rounded-xl shadow-xs font-semibold text-xs sm:text-sm"
          >
            <PlusCircle className="mr-1.5 h-4 w-4 shrink-0" />
            Record Transaction
          </Button>
        </div>
      </div>

      {/* Ledger Table */}
      <WelfareLedgerTable entries={filteredEntries} onDeleteEntry={handleDeleteEntry} />

      {/* Modal for recording transactions */}
      {showModal && (
        <RecordWelfareTransactionModal
          onClose={() => setShowModal(false)}
          onSuccess={handleAddEntry}
        />
      )}
    </div>
  )
}
