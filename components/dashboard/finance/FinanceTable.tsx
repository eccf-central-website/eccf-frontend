'use client'

import * as React from 'react'
import { ArrowDownLeft, ArrowUpRight, PlusCircle } from 'lucide-react'
import type { FinanceRow } from '@/types'
import { formatCount, formatDate, formatNaira, toDateTimeAttr } from '@/lib/dashboard/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/dashboard/ui/button'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import EmptyState from '@/components/dashboard/states/EmptyState'

interface FinanceTableProps {
  entries: FinanceRow[]
  highlightedId?: string | null
  hasActiveFilters?: boolean
  onResetFilters?: () => void
  onRecordClick?: () => void
}

function TransactionTypeBadge({ isIncome }: { isIncome: boolean }) {
  return (
    <StatusBadge
      variant={isIncome ? 'success' : 'destructive'}
      icon={
        isIncome ? (
          <ArrowDownLeft aria-hidden="true" />
        ) : (
          <ArrowUpRight aria-hidden="true" />
        )
      }
    >
      {isIncome ? 'Income' : 'Expense'}
    </StatusBadge>
  )
}

function AmountDisplay({
  entry,
  className,
}: {
  entry: FinanceRow
  className?: string
}) {
  const isIncome = entry.type === 'Income'
  return (
    <span
      className={cn(
        'font-sans font-semibold tabular-nums',
        isIncome ? 'text-success' : 'text-destructive',
        className
      )}
    >
      <data value={isIncome ? entry.amount : -entry.amount}>
        {isIncome ? '+' : '-'}
        {formatNaira(entry.amount)}
      </data>
    </span>
  )
}

export default function FinanceTable({
  entries,
  highlightedId,
  hasActiveFilters = false,
  onResetFilters,
  onRecordClick,
}: FinanceTableProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        variant={hasActiveFilters ? 'no-results' : 'nothing-yet'}
        headingLevel="h2"
        title={
          hasActiveFilters
            ? 'No transactions match your filters'
            : 'No financial transactions recorded yet'
        }
        description={
          hasActiveFilters
            ? 'Clear a filter or change your search query to see matching entries.'
            : 'Record the first offering, tithe, or disbursement to start building the ledger.'
        }
        action={
          hasActiveFilters && onResetFilters ? (
            <Button type="button" variant="outline" onClick={onResetFilters}>
              Clear filters
            </Button>
          ) : onRecordClick ? (
            <Button type="button" onClick={onRecordClick} className="gap-2">
              <PlusCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Record transaction</span>
            </Button>
          ) : undefined
        }
      />
    )
  }

  const netTotal = entries.reduce(
    (sum, entry) => sum + (entry.type === 'Income' ? entry.amount : -entry.amount),
    0
  )

  return (
    <>
      {/* Mobile: tonal stacked cards */}
      <div className="space-y-3 md:hidden">
        {entries.map((entry) => {
          const isIncome = entry.type === 'Income'
          return (
            <article
              key={entry._id}
              className={cn(
                'rounded-[var(--radius-card)] bg-card p-4 shadow-sm',
                entry._id === highlightedId && 'bg-primary/5 ring-1 ring-inset ring-primary/40'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <TransactionTypeBadge isIncome={isIncome} />
                    <time
                      dateTime={toDateTimeAttr(entry.transactionDate)}
                      className="text-[13px] font-medium text-muted-foreground"
                    >
                      {formatDate(entry.transactionDate)}
                    </time>
                  </div>

                  <h3 className="font-sans text-base font-semibold text-foreground">
                    {entry.category}
                  </h3>

                  {entry.description && (
                    <p
                      className="line-clamp-2 text-sm text-muted-foreground"
                      title={entry.description}
                    >
                      {entry.description}
                    </p>
                  )}

                  {entry.flutterwaveRef && (
                    <p className="truncate font-mono text-[13px] text-muted-foreground">
                      Ref: {entry.flutterwaveRef}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <AmountDisplay entry={entry} className="text-base" />
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Desktop: comfortable 48px ledger table */}
      <div className="hidden overflow-hidden rounded-[var(--radius-card)] bg-card shadow-sm md:block">
        <Table aria-label="Finance ledger transactions">
          <TableCaption className="sr-only">
            Finance ledger transactions with dates, types, categories, references, and Naira amounts
          </TableCaption>
          <TableHeader sticky>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="w-[140px]">
                Date
              </TableHead>
              <TableHead scope="col" className="w-[130px]">
                Type
              </TableHead>
              <TableHead scope="col">Category</TableHead>
              <TableHead scope="col">Description</TableHead>
              <TableHead scope="col" className="hidden lg:table-cell">
                Reference
              </TableHead>
              <TableHead scope="col" className="text-right">
                Amount (NGN)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const isIncome = entry.type === 'Income'
              return (
                <TableRow
                  key={entry._id}
                  className={cn(
                    entry._id === highlightedId && 'bg-primary/10 hover:bg-primary/15'
                  )}
                >
                  <TableCell className="whitespace-nowrap text-sm font-medium text-foreground">
                    <time dateTime={toDateTimeAttr(entry.transactionDate)}>
                      {formatDate(entry.transactionDate)}
                    </time>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    <TransactionTypeBadge isIncome={isIncome} />
                  </TableCell>

                  <TableCell className="font-sans text-sm font-semibold text-foreground">
                    {entry.category}
                  </TableCell>

                  <TableCell className="max-w-xs text-sm text-muted-foreground">
                    {entry.description ? (
                      <span className="block truncate" title={entry.description}>
                        {entry.description}
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                    {entry.flutterwaveRef && (
                      <span className="mt-0.5 block truncate font-mono text-[13px] text-muted-foreground lg:hidden">
                        {entry.flutterwaveRef}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="hidden whitespace-nowrap lg:table-cell">
                    {entry.flutterwaveRef ? (
                      <span className="font-mono text-[13px] text-muted-foreground">
                        {entry.flutterwaveRef}
                      </span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-right text-sm">
                    <AmountDisplay entry={entry} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="text-[13px] font-medium text-muted-foreground">
                Showing {formatCount(entries.length)}{' '}
                {entries.length === 1 ? 'transaction' : 'transactions'}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-sans text-sm font-semibold tabular-nums text-foreground">
                <span className="mr-2 text-[13px] font-medium text-muted-foreground">Net:</span>
                <span className={netTotal >= 0 ? 'text-success' : 'text-destructive'}>
                  <data value={netTotal}>{formatNaira(netTotal)}</data>
                </span>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </>
  )
}
