'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { FinanceCategory, FinanceType } from '@/types'
import { recordFinanceEntry } from '@/app/actions/finance-actions'
import { lagosDate } from '@/lib/dashboard/dates'
import { toastError, toastSuccess } from '@/lib/dashboard/toast'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import { RecordSheet } from '@/components/dashboard/ui/record-sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'

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

export interface RecordTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  todayIso?: string
  onSuccess: (newEntry: {
    _id: string
    transactionDate: string
    type: FinanceType
    amount: number
    category: FinanceCategory
    description?: string
  }) => void
}

export default function RecordTransactionModal({
  open,
  onOpenChange,
  todayIso,
  onSuccess,
}: RecordTransactionModalProps) {
  const defaultDate = todayIso || lagosDate()
  const [transactionDate, setTransactionDate] = useState(defaultDate)
  const [type, setType] = useState<FinanceType>('Income')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<FinanceCategory>('Tithe')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const dateInputRef = useRef<HTMLInputElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setFormError(null)
    }
  }, [open])

  const resetForm = () => {
    setTransactionDate(todayIso || lagosDate())
    setType('Income')
    setAmount('')
    setCategory('Tithe')
    setDescription('')
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!transactionDate || !/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
      setFormError('Please select a valid transaction date.')
      dateInputRef.current?.focus()
      return
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter a valid positive amount in Naira.')
      amountInputRef.current?.focus()
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
        toastSuccess('Transaction recorded successfully.')
        onSuccess({
          _id: res.id,
          transactionDate,
          type,
          amount: numericAmount,
          category,
          description: description.trim() || undefined,
        })
        resetForm()
      } else {
        const message = res.error || 'Failed to save transaction.'
        setFormError(message)
        toastError(message)
      }
    } catch {
      const message = 'An unexpected error occurred while saving the transaction.'
      setFormError(message)
      toastError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <RecordSheet
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next)
      }}
      side="right"
      className="[&>button]:h-11 [&>button]:w-11"
      title="Record transaction"
      description="Add an inflow or disbursement entry to the fellowship finance ledger."
      footer={
        <div className="flex w-full items-center gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="min-h-11 flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="record-transaction-form"
            disabled={submitting}
            aria-busy={submitting || undefined}
            className="min-h-11 flex-1 font-semibold sm:flex-none"
          >
            {submitting ? (
              <>
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <span>Saving…</span>
              </>
            ) : (
              <span>Save transaction</span>
            )}
          </Button>
        </div>
      }
    >
      <form
        id="record-transaction-form"
        onSubmit={handleSubmit}
        className="space-y-5"
        noValidate
      >
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-[var(--radius-control)] bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tx-date" className="text-sm font-medium text-foreground">
              Transaction date
            </Label>
            <Input
              ref={dateInputRef}
              id="tx-date"
              name="transactionDate"
              type="date"
              required
              value={transactionDate}
              onChange={(e) => {
                setTransactionDate(e.target.value)
                setFormError(null)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-type" className="text-sm font-medium text-foreground">
              Type
            </Label>
            <Select
              value={type}
              onValueChange={(val) => setType(val as FinanceType)}
            >
              <SelectTrigger id="tx-type" aria-label="Transaction type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Income">Income (+)</SelectItem>
                <SelectItem value="Expense">Expense (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tx-category" className="text-sm font-medium text-foreground">
            Category
          </Label>
          <Select
            value={category}
            onValueChange={(val) => setCategory(val as FinanceCategory)}
          >
            <SelectTrigger id="tx-category" aria-label="Transaction category">
              <SelectValue placeholder="Select category" />
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

        <div className="space-y-2">
          <Label htmlFor="tx-amount" className="text-sm font-medium text-foreground">
            Amount (NGN)
          </Label>
          <Input
            ref={amountInputRef}
            id="tx-amount"
            name="amount"
            type="number"
            step="any"
            min="1"
            inputMode="decimal"
            required
            placeholder="e.g. 50000"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setFormError(null)
            }}
            className="font-sans text-lg font-semibold tabular-nums md:text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tx-description" className="text-sm font-medium text-foreground">
            Description{' '}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="tx-description"
            name="description"
            type="text"
            placeholder="e.g. Sunday service thanksgiving offering"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </RecordSheet>
  )
}
