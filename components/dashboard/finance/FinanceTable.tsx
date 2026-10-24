'use client'

import type { FinanceRow } from '@/types'
import { Badge } from '@/components/dashboard/ui/badge'
import { formatNaira } from '@/lib/dashboard/format'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FinanceTableProps {
  entries: FinanceRow[]
}

/** One shared row badge + amount so the mobile cards and the table can't drift. */
function TransactionTypeBadge({ isIncome }: { isIncome: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 font-semibold',
        isIncome ? 'bg-success/10 text-success border-success/25' : 'bg-destructive/10 text-destructive border-destructive/25'
      )}
    >
      {isIncome ? (
        <ArrowDownLeft className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : (
        <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      <span>{isIncome ? 'Income' : 'Expense'}</span>
    </Badge>
  )
}

function Amount({ entry, className }: { entry: FinanceRow; className?: string }) {
  const isIncome = entry.type === 'Income'
  return (
    <span
      className={cn('font-semibold tabular-nums', isIncome ? 'text-success' : 'text-destructive', className)}
    >
      {isIncome ? '+' : '-'}
      {formatNaira(entry.amount)}
    </span>
  )
}

function FlutterwaveRef({ reference }: { reference: string }) {
  return (
    <span className="mt-1 block font-mono text-xs text-muted-foreground">
      Ref: <span className="truncate">{reference}</span>
    </span>
  )
}

export default function FinanceTable({ entries }: FinanceTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-card/60 p-8 text-center text-sm text-muted-foreground">
        No financial transactions recorded yet.
      </div>
    )
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {entries.map((entry) => {
          const isIncome = entry.type === 'Income'
          return (
            <div key={entry._id} className="rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <TransactionTypeBadge isIncome={isIncome} />
                    <span className="text-xs font-medium text-muted-foreground">{entry.transactionDate}</span>
                  </div>
                  <p className="mt-1.5 font-medium text-foreground">{entry.category}</p>
                  {entry.description && (
                    <p
                      className="mt-0.5 text-sm text-muted-foreground line-clamp-2"
                      title={entry.description}
                    >
                      {entry.description}
                    </p>
                  )}
                  {entry.flutterwaveRef && <FlutterwaveRef reference={entry.flutterwaveRef} />}
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <Amount entry={entry} className="font-mono text-sm" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden rounded-2xl bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table aria-label="Finance records" className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground font-medium">
              <tr>
                <th scope="col" className="rounded-t-2xl px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Type</th>
                <th scope="col" className="px-4 py-3">Category</th>
                <th scope="col" className="px-4 py-3">Description</th>
                <th scope="col" className="px-4 py-3 text-right">Amount (NGN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {entries.map((entry) => {
                const isIncome = entry.type === 'Income'
                return (
                  <tr key={entry._id} className="transition-colors hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-3.5 font-medium tabular-nums text-foreground">
                      {entry.transactionDate}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <TransactionTypeBadge isIncome={isIncome} />
                    </td>
                    <td className="px-4 py-3.5 font-medium text-foreground">{entry.category}</td>
                    <td className="max-w-xs px-4 py-3.5 text-muted-foreground">
                      {entry.description ? (
                        <span className="block truncate" title={entry.description}>
                          {entry.description}
                        </span>
                      ) : (
                        '—'
                      )}
                      {entry.flutterwaveRef && <FlutterwaveRef reference={entry.flutterwaveRef} />}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono">
                      <Amount entry={entry} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
