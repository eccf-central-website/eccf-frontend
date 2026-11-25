'use client'

import React, { useId, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Loader2, PlusCircle } from 'lucide-react'
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
import { recordWelfareLedgerEntry } from '@/app/actions/welfare-ledger-actions'
import { lagosDate } from '@/lib/dashboard/dates'
import { toast } from 'sonner'
import type { WelfareLedgerCategory, WelfareLedgerRow, WelfareLedgerType } from '@/types'
import { cn } from '@/lib/utils'

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
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
  onSuccess: (newEntry: WelfareLedgerRow) => void
}

export default function RecordWelfareTransactionModal({
  open = true,
  onOpenChange,
  onClose,
  onSuccess,
}: RecordWelfareTransactionModalProps) {
  const [date, setDate] = useState(() => lagosDate())
  const [type, setType] = useState<WelfareLedgerType>('Debit')
  const [amount, setAmount] = useState('')
  const [bankCharge, setBankCharge] = useState('0')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<WelfareLedgerCategory>('Food & Nutrition Support')
  const [recipient, setRecipient] = useState('')
  const [reference, setReference] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const formId = useId()
  const dateId = useId()
  const categoryId = useId()
  const amountId = useId()
  const bankChargeId = useId()
  const descriptionId = useId()
  const recipientId = useId()
  const referenceId = useId()

  const handleClose = () => {
    if (submitting) return
    setErrorMessage(null)
    onOpenChange?.(false)
    onClose?.()
  }

  const handleTypeSelect = (nextType: WelfareLedgerType) => {
    setType(nextType)
    if (nextType === 'Credit' && category === 'Food & Nutrition Support') {
      setCategory('Central Finance Allocation')
    } else if (
      nextType === 'Debit' &&
      (category === 'Central Finance Allocation' ||
        category === 'Purse Donation / Voluntary Gift')
    ) {
      setCategory('Food & Nutrition Support')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const numericAmount = parseFloat(amount)
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      const msg = 'Enter a positive amount in Naira.'
      setErrorMessage(msg)
      toast.error(msg)
      return
    }

    const numericCharge = parseFloat(bankCharge) || 0
    if (numericCharge < 0) {
      const msg = 'Bank charge cannot be negative.'
      setErrorMessage(msg)
      toast.error(msg)
      return
    }

    if (!description.trim()) {
      const msg = 'Provide a description or purpose for this transaction.'
      setErrorMessage(msg)
      toast.error(msg)
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
        toast.success('Purse transaction recorded.')
        onSuccess({
          _id: res.id,
          date,
          type,
          amount: numericAmount,
          bankCharge: numericCharge,
          runningBalance: 0, // Parent recalculates running balances chronologically
          description: description.trim(),
          category,
          recipient: recipient.trim() || undefined,
          reference: reference.trim() || undefined,
          createdAt: new Date().toISOString(),
        })
        setAmount('')
        setBankCharge('0')
        setDescription('')
        setRecipient('')
        setReference('')
        setErrorMessage(null)
      } else {
        const msg = res.error || 'Failed to record transaction.'
        setErrorMessage(msg)
        toast.error(msg)
      }
    } catch (err) {
      console.error(err)
      const msg = 'An unexpected error occurred while recording the transaction.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <RecordSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose()
        } else {
          onOpenChange?.(true)
        }
      }}
      title="Record purse transaction"
      description="Log an inflow (Credit) or student assistance disbursement (Debit) for the Welfare Purse."
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="min-h-11 w-full sm:w-auto md:min-h-10"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={submitting}
            aria-busy={submitting || undefined}
            className="min-h-11 w-full sm:w-auto md:min-h-10"
          >
            {submitting ? (
              <>
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <span>Recording…</span>
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Save transaction</span>
              </>
            )}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div
            role="alert"
            className="rounded-[var(--radius-control)] bg-destructive/10 px-3.5 py-3 text-sm font-medium text-destructive"
          >
            {errorMessage}
          </div>
        )}

        {/* Transaction Flow Selector */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">
            Transaction flow
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label
              className={cn(
                'flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card',
                type === 'Credit'
                  ? 'bg-success/10 text-success ring-1 ring-inset ring-success/40'
                  : 'bg-surface-raised text-muted-foreground hover:text-foreground'
              )}
            >
              <input
                type="radio"
                name="welfareTransactionFlow"
                value="Credit"
                checked={type === 'Credit'}
                onChange={() => handleTypeSelect('Credit')}
                className="sr-only"
              />
              <ArrowDownLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Credit (Inflow)</span>
            </label>

            <label
              className={cn(
                'flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card',
                type === 'Debit'
                  ? 'bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/40'
                  : 'bg-surface-raised text-muted-foreground hover:text-foreground'
              )}
            >
              <input
                type="radio"
                name="welfareTransactionFlow"
                value="Debit"
                checked={type === 'Debit'}
                onChange={() => handleTypeSelect('Debit')}
                className="sr-only"
              />
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Debit (Outflow)</span>
            </label>
          </div>
        </fieldset>

        {/* Date & Category */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={dateId} className="text-[13px] font-medium">
              Date *
            </Label>
            <Input
              id={dateId}
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={categoryId} className="text-[13px] font-medium">
              Category *
            </Label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as WelfareLedgerCategory)}
            >
              <SelectTrigger id={categoryId} aria-label="Category">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={amountId} className="text-[13px] font-medium">
              Amount (NGN) *
            </Label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm font-medium text-muted-foreground"
              >
                ₦
              </span>
              <Input
                id={amountId}
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  if (errorMessage) setErrorMessage(null)
                }}
                className="pl-8 font-sans tabular-nums"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={bankChargeId} className="text-[13px] font-medium">
              Bank charge (NGN)
            </Label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm font-medium text-muted-foreground"
              >
                ₦
              </span>
              <Input
                id={bankChargeId}
                name="bankCharge"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={bankCharge}
                onChange={(e) => setBankCharge(e.target.value)}
                className="pl-8 font-sans tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Quick Bank Fee Presets (Touch-safe >= 44px mobile / 40px desktop) */}
        <div className="space-y-1.5">
          <span className="block text-[13px] text-muted-foreground">
            Quick bank charge presets
          </span>
          <div className="flex flex-wrap gap-2">
            {['0', '26.88', '53.75'].map((quick) => {
              const selected = bankCharge === quick
              return (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setBankCharge(quick)}
                  aria-pressed={selected}
                  className={cn(
                    'inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-3.5 text-[13px] font-medium font-sans tabular-nums transition-colors [touch-action:manipulation] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card md:min-h-10',
                    selected
                      ? 'bg-primary/15 text-accent-foreground ring-1 ring-inset ring-primary/35 dark:text-primary'
                      : 'bg-surface-raised text-muted-foreground hover:text-foreground'
                  )}
                >
                  ₦{quick}
                </button>
              )
            })}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor={descriptionId} className="text-[13px] font-medium">
            Description / purpose *
          </Label>
          <Input
            id={descriptionId}
            name="description"
            placeholder="e.g. Emergency medical care support at Health Centre"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              if (errorMessage) setErrorMessage(null)
            }}
            required
          />
        </div>

        {/* Beneficiary & Reference */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={recipientId} className="text-[13px] font-medium">
              Beneficiary / depositor
            </Label>
            <Input
              id={recipientId}
              name="recipient"
              placeholder="e.g. Brother Emmanuel"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={referenceId} className="text-[13px] font-medium">
              Transfer reference
            </Label>
            <Input
              id={referenceId}
              name="reference"
              placeholder="e.g. TRF-0091248"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="font-mono"
            />
          </div>
        </div>
      </form>
    </RecordSheet>
  )
}
