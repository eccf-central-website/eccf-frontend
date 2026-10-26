'use client'

import React, { useState } from 'react'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { recordWelfareLedgerEntry } from '@/app/actions/welfare-ledger-actions'
import { toast } from 'sonner'
import { ArrowDownLeft, ArrowUpRight, Loader2, PlusCircle, X } from 'lucide-react'
import type { WelfareLedgerCategory, WelfareLedgerRow, WelfareLedgerType } from '@/types'

const CATEGORIES: WelfareLedgerCategory[] = [
  'Central Finance Allocation',
  'Purse Donation / Voluntary Gift',
  'Food & Nutrition Support',
  'Medical / Healthcare Aid',
  'Academic / Textbook Support',
  'Emergency Transport Aid',
  'Hostel & Living Essentials',
  'Bank Charges / Stamp Duty',
  'Miscellaneous Care',
]

interface RecordWelfareTransactionModalProps {
  onClose: () => void
  onSuccess: (newEntry: WelfareLedgerRow) => void
}

export default function RecordWelfareTransactionModal({
  onClose,
  onSuccess,
}: RecordWelfareTransactionModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState<WelfareLedgerType>('Debit')
  const [amount, setAmount] = useState('')
  const [bankCharge, setBankCharge] = useState('0')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<WelfareLedgerCategory>('Food & Nutrition Support')
  const [recipient, setRecipient] = useState('')
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Please enter a valid positive amount.')
      return
    }

    const numericCharge = parseFloat(bankCharge) || 0
    if (numericCharge < 0) {
      toast.error('Bank charge cannot be negative.')
      return
    }

    if (!description.trim()) {
      toast.error('Please provide a description or purpose for this transaction.')
      return
    }

    setSubmitting(true)
    try {
      const res = await recordWelfareLedgerEntry({
        date,
        type,
        amount: numericAmount,
        bankCharge: numericCharge,
        description: description.trim(),
        category,
        recipient: recipient.trim() || undefined,
        reference: reference.trim() || undefined,
      })

      if (res.success && res.id) {
        toast.success(`Purse transaction recorded successfully.`)
        onSuccess({
          _id: res.id,
          date,
          type,
          amount: numericAmount,
          bankCharge: numericCharge,
          runningBalance: 0, // Parent component will recompute running balances accurately
          description: description.trim(),
          category,
          recipient: recipient.trim() || undefined,
          reference: reference.trim() || undefined,
          createdAt: new Date().toISOString(),
        })
      } else {
        toast.error(res.error || 'Failed to record transaction.')
      }
    } catch (err) {
      console.error(err)
      toast.error('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-welfare-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="space-y-0.5">
            <h2 id="record-welfare-title" className="text-lg font-bold tracking-tight text-foreground">
              Record Purse Transaction
            </h2>
            <p className="text-xs text-muted-foreground">
              Log an inflow (Credit) or assistance disbursement (Debit) for the Welfare Purse.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Transaction Type Radio Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Transaction Flow
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('Credit')
                  if (category === 'Food & Nutrition Support') {
                    setCategory('Central Finance Allocation')
                  }
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  type === 'Credit'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Credit (Inflow / Deposit)
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('Debit')
                  if (category === 'Central Finance Allocation' || category === 'Purse Donation / Voluntary Gift') {
                    setCategory('Food & Nutrition Support')
                  }
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  type === 'Debit'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                Debit (Outflow / Assistance)
              </button>
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs font-semibold">
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category *</Label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as WelfareLedgerCategory)}
              >
                <SelectTrigger className="h-10 rounded-xl text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount & Bank Charge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-semibold">
                Amount (NGN) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                  ₦
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 h-10 rounded-xl font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bankCharge" className="text-xs font-semibold">
                  Bank Charge (NGN)
                </Label>
                <div className="flex gap-1">
                  {['0', '26.88', '53.75'].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setBankCharge(quick)}
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted hover:bg-muted-foreground/10 text-muted-foreground font-mono"
                    >
                      ₦{quick}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                  ₦
                </span>
                <Input
                  id="bankCharge"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={bankCharge}
                  onChange={(e) => setBankCharge(e.target.value)}
                  className="pl-8 h-10 rounded-xl font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">
              Description / Purpose *
            </Label>
            <Input
              id="description"
              placeholder="e.g. Emergency medical care assistance for student at Health Centre"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 rounded-xl"
              required
            />
          </div>

          {/* Beneficiary & Reference (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="recipient" className="text-xs font-semibold text-muted-foreground">
                Beneficiary / Depositor (Optional)
              </Label>
              <Input
                id="recipient"
                placeholder="e.g. Brother Emmanuel / Alumnus Donor"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="h-10 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reference" className="text-xs font-semibold text-muted-foreground">
                Transfer Reference / Session ID
              </Label>
              <Input
                id="reference"
                placeholder="e.g. TRF-0091248 / Bank ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="h-10 rounded-xl font-mono text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl min-w-[140px] font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-1.5 h-4 w-4" />
                  Save Transaction
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
