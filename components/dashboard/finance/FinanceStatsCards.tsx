'use client'

import React from 'react'
import { ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react'

interface FinanceStatsCardsProps {
  totalIncome: number
  totalExpense: number
}

export default function FinanceStatsCards({ totalIncome, totalExpense }: FinanceStatsCardsProps) {
  const netBalance = totalIncome - totalExpense

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* Income */}
      <div className="rounded-2xl bg-card p-5 shadow-sm border-0 flex flex-col justify-between min-h-[120px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Income
          </span>
          <div className="h-8 w-8 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ArrowDownRight className="h-4 w-4 shrink-0" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            ₦{totalIncome.toLocaleString()}
          </span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">Total recorded inflows</span>
      </div>

      {/* Expense */}
      <div className="rounded-2xl bg-card p-5 shadow-sm border-0 flex flex-col justify-between min-h-[120px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Expenses
          </span>
          <div className="h-8 w-8 shrink-0 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
            <ArrowUpRight className="h-4 w-4 shrink-0" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            ₦{totalExpense.toLocaleString()}
          </span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">Total recorded disbursements</span>
      </div>

      {/* Net Position */}
      <div className="rounded-2xl bg-card p-5 shadow-sm border-0 flex flex-col justify-between min-h-[120px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Net Position
          </span>
          <div className="h-8 w-8 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Scale className="h-4 w-4 shrink-0" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`font-sans text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${
              netBalance >= 0
                ? 'text-foreground'
                : 'text-destructive'
            }`}
          >
            {netBalance < 0 ? '-' : ''}₦{Math.abs(netBalance).toLocaleString()}
          </span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {netBalance >= 0 ? 'Surplus this period' : 'Deficit this period'}
        </span>
      </div>
    </div>
  )
}
