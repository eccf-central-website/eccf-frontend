'use client'

import React, { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Loader2, Receipt, Trash2 } from 'lucide-react'
import type { WelfareLedgerRow } from '@/types'
import { formatDate, formatNaira, toDateTimeAttr } from '@/lib/dashboard/format'
import { Button } from '@/components/dashboard/ui/button'
import { ConfirmDialog } from '@/components/dashboard/ui/confirm-dialog'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import EmptyState from '@/components/dashboard/states/EmptyState'
import { deleteWelfareLedgerEntry } from '@/app/actions/welfare-ledger-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface WelfareLedgerTableProps {
  entries: WelfareLedgerRow[]
  onDeleteEntry?: (id: string) => void
  hasActiveFilters?: boolean
  onResetFilters?: () => void
}

function isValidIso(iso?: string | null): iso is string {
  if (!iso) return false
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00Z`) : new Date(iso)
  return !Number.isNaN(parsed.getTime())
}

function safeFormatDate(iso?: string | null): string {
  if (!isValidIso(iso)) return iso || '—'
  return formatDate(iso)
}

function TransactionTypeBadge({ type }: { type: 'Credit' | 'Debit' }) {
  const isCredit = type === 'Credit'
  return (
    <StatusBadge
      variant={isCredit ? 'success' : 'destructive'}
      icon={
        isCredit ? (
          <ArrowDownLeft className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpRight className="h-3.5 w-3.5" />
        )
      }
    >
      {isCredit ? 'Credit (Inflow)' : 'Debit (Outflow)'}
    </StatusBadge>
  )
}

function AmountDisplay({ entry }: { entry: WelfareLedgerRow }) {
  const isCredit = entry.type === 'Credit'
  return (
    <data
      value={isCredit ? entry.amount : -entry.amount}
      className={cn(
        'font-sans text-sm font-semibold tabular-nums',
        isCredit ? 'text-success' : 'text-destructive'
      )}
    >
      {isCredit ? '+' : '-'}
      {formatNaira(entry.amount)}
    </data>
  )
}

export default function WelfareLedgerTable({
  entries,
  onDeleteEntry,
  hasActiveFilters = false,
  onResetFilters,
}: WelfareLedgerTableProps) {
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<WelfareLedgerRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleConfirmDelete = async () => {
    if (!pendingDeleteEntry) return
    const targetId = pendingDeleteEntry._id
    setDeletingId(targetId)

    try {
      const res = await deleteWelfareLedgerEntry(targetId)
      if (res.success) {
        toast.success('Transaction removed from the Welfare Purse ledger.')
        setPendingDeleteEntry(null)
        onDeleteEntry?.(targetId)
      } else {
        toast.error(res.error || 'Failed to delete transaction.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete transaction.')
    } finally {
      setDeletingId(null)
    }
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        variant={hasActiveFilters ? 'no-results' : 'nothing-yet'}
        title={
          hasActiveFilters
            ? 'No matching ledger entries'
            : 'No Welfare Purse transactions yet'
        }
        description={
          hasActiveFilters
            ? 'Try clearing your search query or adjusting the flow and category filters.'
            : 'Record your first inflow or assistance disbursement to start tracking the Welfare Purse balance.'
        }
        icon={<Receipt />}
        action={
          hasActiveFilters && onResetFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={onResetFilters}
              className="min-h-11 md:min-h-10"
            >
              Clear filters
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <>
      {/* Mobile: stacked tonal cards */}
      <div className="space-y-3 md:hidden">
        {entries.map((entry) => {
          const isDeleting = deletingId === entry._id
          return (
            <article
              key={entry._id}
              className="space-y-3 rounded-[var(--radius-card)] bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <time
                    dateTime={isValidIso(entry.date) ? toDateTimeAttr(entry.date) : undefined}
                    className="block text-[13px] font-medium text-muted-foreground"
                  >
                    {safeFormatDate(entry.date)}
                  </time>
                  <h3 className="font-sans text-base font-semibold leading-snug text-foreground">
                    {entry.description}
                  </h3>
                </div>
                <TransactionTypeBadge type={entry.type} />
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-control)] bg-surface-raised p-3 text-[13px]">
                <div className="min-w-0">
                  <span className="block text-[13px] text-muted-foreground">Amount</span>
                  <div className="mt-0.5">
                    <AmountDisplay entry={entry} />
                  </div>
                </div>

                <div className="min-w-0">
                  <span className="block text-[13px] text-muted-foreground">Fee</span>
                  <span className="mt-0.5 block font-sans text-sm tabular-nums text-foreground">
                    {entry.bankCharge && entry.bankCharge > 0
                      ? formatNaira(entry.bankCharge)
                      : '—'}
                  </span>
                </div>

                <div className="min-w-0 text-right">
                  <span className="block text-[13px] text-muted-foreground">Balance</span>
                  <data
                    value={entry.runningBalance}
                    className="mt-0.5 block font-sans text-sm font-semibold tabular-nums text-foreground"
                  >
                    {formatNaira(entry.runningBalance)}
                  </data>
                </div>
              </div>

              {(entry.category || entry.recipient || entry.reference || entry.loggedByName) && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted-foreground">
                  {entry.category && (
                    <StatusBadge variant="neutral" dot>
                      {entry.category}
                    </StatusBadge>
                  )}
                  {entry.recipient && <span>To: {entry.recipient}</span>}
                  {entry.reference && (
                    <span className="font-mono text-[13px] text-muted-foreground">
                      {entry.reference}
                    </span>
                  )}
                  {entry.loggedByName && <span>By: {entry.loggedByName}</span>}
                </div>
              )}

              {onDeleteEntry && (
                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => setPendingDeleteEntry(entry)}
                    aria-label={`Delete transaction ${entry.description}`}
                    className="min-h-11 gap-1.5 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {isDeleting ? (
                      <Loader2
                        className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    ) : (
                      <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>Delete</span>
                  </Button>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {/* Desktop: Calm tabular view */}
      <div className="hidden overflow-hidden rounded-[var(--radius-card)] bg-card shadow-sm md:block">
        <Table>
          <TableCaption className="sr-only">
            Welfare purse ledger transactions with inflows, outflows, bank charges, and running balance
          </TableCaption>
          <TableHeader sticky>
            <TableRow className="hover:bg-transparent">
              <TableHead sticky scope="col" className="w-[125px]">
                Date
              </TableHead>
              <TableHead sticky scope="col">
                Description
              </TableHead>
              <TableHead sticky scope="col" className="w-[170px]">
                Flow
              </TableHead>
              <TableHead sticky scope="col" className="w-[130px] text-right">
                Amount
              </TableHead>
              <TableHead sticky scope="col" className="w-[120px] text-right">
                Bank charge
              </TableHead>
              <TableHead sticky scope="col" className="w-[140px] text-right">
                Balance
              </TableHead>
              {onDeleteEntry && (
                <TableHead sticky scope="col" className="w-[64px] text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const isDeleting = deletingId === entry._id
              return (
                <TableRow
                  key={entry._id}
                  className="border-b border-border/40 last:border-b-0"
                >
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    <time
                      dateTime={isValidIso(entry.date) ? toDateTimeAttr(entry.date) : undefined}
                    >
                      {safeFormatDate(entry.date)}
                    </time>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-sans text-sm font-medium leading-snug text-foreground">
                        {entry.description}
                      </p>
                      {(entry.category ||
                        entry.recipient ||
                        entry.reference ||
                        entry.loggedByName) && (
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted-foreground">
                          {entry.category && (
                            <StatusBadge variant="neutral" dot>
                              {entry.category}
                            </StatusBadge>
                          )}
                          {entry.recipient && (
                            <span>
                              To:{' '}
                              <span className="font-medium text-foreground">
                                {entry.recipient}
                              </span>
                            </span>
                          )}
                          {entry.reference && (
                            <span className="font-mono text-[13px] text-muted-foreground">
                              {entry.reference}
                            </span>
                          )}
                          {entry.loggedByName && <span>By: {entry.loggedByName}</span>}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    <TransactionTypeBadge type={entry.type} />
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-right">
                    <AmountDisplay entry={entry} />
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-right font-sans text-sm tabular-nums text-muted-foreground">
                    {entry.bankCharge && entry.bankCharge > 0
                      ? formatNaira(entry.bankCharge)
                      : '—'}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-right">
                    <data
                      value={entry.runningBalance}
                      className="font-sans text-sm font-semibold tabular-nums text-foreground"
                    >
                      {formatNaira(entry.runningBalance)}
                    </data>
                  </TableCell>

                  {onDeleteEntry && (
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isDeleting}
                        onClick={() => setPendingDeleteEntry(entry)}
                        aria-label={`Delete transaction ${entry.description}`}
                        title="Delete transaction"
                        className="min-h-11 min-w-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive md:min-h-10 md:min-w-10"
                      >
                        {isDeleting ? (
                          <Loader2
                            className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                            aria-hidden="true"
                          />
                        ) : (
                          <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteEntry)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteEntry(null)
        }}
        tone="destructive"
        title="Delete purse transaction?"
        description={
          pendingDeleteEntry
            ? `Remove "${pendingDeleteEntry.description}" (${formatNaira(pendingDeleteEntry.amount)}) from the Welfare Purse ledger?`
            : undefined
        }
        effectSummary="Running purse balances will recalculate immediately. This cannot be undone."
        confirmLabel="Delete transaction"
        loading={Boolean(deletingId)}
        loadingLabel="Deleting…"
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
