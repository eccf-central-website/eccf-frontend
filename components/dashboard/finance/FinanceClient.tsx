'use client'

import React, { useState, useMemo } from 'react'
import FinanceStatsCards from '@/components/dashboard/finance/FinanceStatsCards'
import FinanceTable from '@/components/dashboard/finance/FinanceTable'
import RecordTransactionModal from '@/components/dashboard/finance/RecordTransactionModal'
import FinanceExportButton from '@/components/dashboard/finance/FinanceExportButton'
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
import type { FinanceRow } from '@/types'

interface FinanceClientProps {
  initialEntries: FinanceRow[]
}

export default function FinanceClient({ initialEntries }: FinanceClientProps) {
  const [entries, setEntries] = useState<FinanceRow[]>(initialEntries)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Income' | 'Expense'>('all')

  const totalIncome = useMemo(
    () => entries.filter((e) => e.type === 'Income').reduce((sum, e) => sum + e.amount, 0),
    [entries]
  )

  const totalExpense = useMemo(
    () => entries.filter((e) => e.type === 'Expense').reduce((sum, e) => sum + e.amount, 0),
    [entries]
  )

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        search === '' ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
        (e.flutterwaveRef && e.flutterwaveRef.toLowerCase().includes(search.toLowerCase()))

      const matchesType = typeFilter === 'all' || e.type === typeFilter

      return matchesSearch && matchesType
    })
  }, [entries, search, typeFilter])

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <FinanceStatsCards totalIncome={totalIncome} totalExpense={totalExpense} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 gap-2 items-center max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by category, note, or ref..."
              className="pl-9 bg-background"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val as 'all' | 'Income' | 'Expense')}
          >
            <SelectTrigger className="w-[130px] bg-background">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Income">Income (+)</SelectItem>
              <SelectItem value="Expense">Expense (-)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <FinanceExportButton entries={filteredEntries} />
          <Button onClick={() => setShowModal(true)} size="sm" className="shadow-xs">
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Record Transaction
          </Button>
        </div>
      </div>

      {/* Table */}
      <FinanceTable entries={filteredEntries} />

      {/* Modal */}
      {showModal && (
        <RecordTransactionModal
          onClose={() => setShowModal(false)}
          onSuccess={(newEntry) => {
            setShowModal(false)
            setEntries((prev) => [newEntry as FinanceRow, ...prev])
          }}
        />
      )}
    </div>
  )
}
