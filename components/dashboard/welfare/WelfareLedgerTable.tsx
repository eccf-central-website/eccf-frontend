'use client'

import React, { useState } from 'react'
import type { WelfareLedgerRow } from '@/types'
import { Badge } from '@/components/dashboard/ui/badge'
import { formatNaira } from '@/lib/dashboard/format'
import { ArrowDownLeft, ArrowUpRight, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { deleteWelfareLedgerEntry } from '@/app/actions/welfare-ledger-actions'
import { toast } from 'sonner'

interface WelfareLedgerTableProps {
  entries: WelfareLedgerRow[]
  onDeleteEntry?: (id: string) => void
}

/** One shared row badge for Credit (Inflow) vs Debit (Outflow) */
function TransactionTypeBadge({ type }: { type: 'Credit' | 'Debit' }) {
  const isCredit = type === 'Credit'
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 font-semibold text-xs',
        isCredit
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
      )}
    >
      {isCredit ? (
        <ArrowDownLeft className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : (
        <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      <span>{isCredit ? 'Credit (Inflow)' : 'Debit (Outflow)'}</span>
    </Badge>
  )
}

function AmountDisplay({ entry }: { entry: WelfareLedgerRow }) {
  const isCredit = entry.type === 'Credit'
  return (
    <span
      className={cn(
        'font-semibold tabular-nums',
        isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
      )}
    >
      {isCredit ? '+' : '-'}
      {formatNaira(entry.amount)}
    </span>
  )
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function WelfareLedgerTable({ entries, onDeleteEntry }: WelfareLedgerTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Welfare Purse transaction?')) {
      return
    }

    setDeletingId(id)
    try {
      const res = await deleteWelfareLedgerEntry(id)
      if (res.success) {
        toast.success('Transaction removed successfully.')
        onDeleteEntry?.(id)
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
      <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-8 text-center text-sm text-muted-foreground">
        No Welfare Purse transactions match your search criteria.
      </div>
    )
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {entries.map((entry) => (
          <div
            key={entry._id}
            className="rounded-2xl border bg-card p-4 shadow-xs space-y-3 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {formatDate(entry.date)}
                </span>
                <p className="font-semibold text-sm text-foreground leading-snug">
                  {entry.description}
                </p>
              </div>
              <TransactionTypeBadge type={entry.type} />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                  Amount
                </span>
                <AmountDisplay entry={entry} />
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                  Bank Charge
                </span>
                <span className="font-mono text-muted-foreground">
                  {entry.bankCharge && entry.bankCharge > 0
                    ? `₦${entry.bankCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '—'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                  Purse Balance
                </span>
                <span className="font-semibold text-sm tabular-nums text-foreground">
                  ₦{entry.runningBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {entry.category && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    {entry.category}
                  </Badge>
                )}
                {onDeleteEntry && (
                  <button
                    type="button"
                    onClick={() => handleDelete(entry._id)}
                    disabled={deletingId === entry._id}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md"
                    title="Delete transaction"
                  >
                    {deletingId === entry._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {(entry.recipient || entry.reference) && (
              <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 pt-1 border-t border-border/40">
                {entry.recipient && <span>Beneficiary: {entry.recipient}</span>}
                {entry.reference && <span className="font-mono">Ref: {entry.reference}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: Calm tabular view */}
      <div className="hidden md:block rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th scope="col" className="px-4 py-3.5 w-[110px]">
                  Date
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Description
                </th>
                <th scope="col" className="px-4 py-3.5 w-[160px]">
                  Debit / Credit
                </th>
                <th scope="col" className="px-4 py-3.5 w-[120px] text-right">
                  Bank Charge
                </th>
                <th scope="col" className="px-4 py-3.5 w-[150px] text-right">
                  Balance
                </th>
                {onDeleteEntry && (
                  <th scope="col" className="px-3 py-3.5 w-[50px] text-center">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {entries.map((entry) => (
                <tr key={entry._id} className="hover:bg-muted/30 transition-colors">
                  {/* Date */}
                  <td className="px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {formatDate(entry.date)}
                  </td>

                  {/* Description & metadata */}
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm leading-snug">
                        {entry.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {entry.category && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                            {entry.category}
                          </Badge>
                        )}
                        {entry.recipient && (
                          <span>
                            To: <strong className="text-foreground/80 font-medium">{entry.recipient}</strong>
                          </span>
                        )}
                        {entry.reference && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            Ref: {entry.reference}
                          </span>
                        )}
                        {entry.loggedByName && (
                          <span className="text-[11px] text-muted-foreground">
                            By: {entry.loggedByName}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Debit / Credit */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="space-y-1">
                      <TransactionTypeBadge type={entry.type} />
                      <div>
                        <AmountDisplay entry={entry} />
                      </div>
                    </div>
                  </td>

                  {/* Bank charge */}
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {entry.bankCharge && entry.bankCharge > 0 ? (
                      <span>
                        ₦
                        {entry.bankCharge.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>

                  {/* Balance */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className="font-semibold text-sm tabular-nums text-foreground">
                      ₦
                      {entry.runningBalance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>

                  {/* Action */}
                  {onDeleteEntry && (
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(entry._id)}
                        disabled={deletingId === entry._id}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                        title="Delete entry"
                      >
                        {deletingId === entry._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
