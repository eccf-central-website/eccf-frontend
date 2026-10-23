'use client'

import React, { useState } from 'react'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { recordFinanceEntry } from '@/app/actions/finance-actions'
import { toast } from 'sonner'
import { Loader2, PlusCircle, X } from 'lucide-react'
import type { FinanceCategory, FinanceType } from '@/types'

const CATEGORIES: FinanceCategory[] = [
  'Tithe',
  'Offering',
  'Project Levy',
  'Online Giving',
  'Welfare Disbursement',
  'Utility Expense',
  'Event Expense',
  'Miscellaneous',
]

interface RecordTransactionModalProps {
  onClose: () => void
  onSuccess: (newEntry: {
    _id: string
    transactionDate: string
    type: FinanceType
    amount: number
    category: FinanceCategory
    description?: string
  }) => void
}

export default function RecordTransactionModal({ onClose, onSuccess }: RecordTransactionModalProps) {
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [type, setType] = useState<FinanceType>('Income')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<FinanceCategory>('Tithe')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Please enter a valid positive amount.')
      return
    }

    setSubmitting(true)
    try {
      const res = await recordFinanceEntry({
        transactionDate,
        type,
        amount: numericAmount,
        category,
        description: description.trim() || undefined,
      })

      if (res.success && res.id) {
        toast.success('Transaction recorded successfully.')
        onSuccess({
          _id: res.id,
          transactionDate,
          type,
          amount: numericAmount,
          category,
          description: description.trim() || undefined,
        })
      } else {
        toast.error(res.error || 'Failed to save transaction.')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl space-y-5 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <PlusCircle className="h-5 w-5 shrink-0 text-primary" />
            Record Transaction
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5 shrink-0" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Date
              </label>
              <Input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="bg-card"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                Type
              </label>
              <Select value={type} onValueChange={(val) => setType(val as FinanceType)}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Income (+)</SelectItem>
                  <SelectItem value="Expense">Expense (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Category
            </label>
            <Select value={category} onValueChange={(val) => setCategory(val as FinanceCategory)}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Amount (NGN)
            </label>
            <Input
              type="number"
              step="any"
              min="1"
              required
              placeholder="e.g. 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-card font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
              Description / Notes (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Sunday Service thanksgiving offering"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-card"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Transaction'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
