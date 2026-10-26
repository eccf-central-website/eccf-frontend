'use client'

import React from 'react'
import { ArrowDownLeft, ArrowUpRight, Receipt, Wallet } from 'lucide-react'

interface WelfareStatsCardsProps {
  currentBalance: number
  totalCredit: number
  totalDebit: number
  totalBankCharges: number
}

export default function WelfareStatsCards({
  currentBalance,
  totalCredit,
  totalDebit,
  totalBankCharges,
}: WelfareStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Current Purse Balance */}
      <div className="rounded-2xl bg-card p-5 shadow-sm border border-border/40 flex flex-col justify-between min-h-[120px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Purse Balance
          </span>
          <div className="h-8 w-8 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Wallet className="h-4 w-4 shrink-0" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`font-sans text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${
              currentBalance >= 0 ? 'text-foreground' : 'text-destructive'
            }`}
          >
            {currentBalance < 0 ? '-' : ''}₦{Math.abs(currentBalance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">Available Welfare Purse funds</span>
      </div>

      {/* Total Inflow / Credits */}
      <div className="rounded-2xl bg-card p-5 shadow-sm border border-border/40 flex flex-col justify-between min-h-[120px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Inflows
          </span>
          <div className="h-8 w-8 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ArrowDownLeft className="h-4 w-4 shrink-0" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            ₦{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">Allocations & voluntary gifts</span>
      </div>

      {/* Total Outflow / Debits */}
      <div className="rounded-2xl bg-card p-5 shadow-sm border border-border/40 flex flex-col justify-between min-h-[120px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Outflows
          </span>
          <div className="h-8 w-8 shrink-0 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ArrowUpRight className="h-4 w-4 shrink-0" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            ₦{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">Direct student assistance disbursed</span>
      </div>

      {/* Bank Charges */}
      <div className="rounded-2xl bg-card p-5 shadow-sm border border-border/40 flex flex-col justify-between min-h-[120px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bank Charges
          </span>
          <div className="h-8 w-8 shrink-0 rounded-xl bg-muted/70 flex items-center justify-center text-muted-foreground">
            <Receipt className="h-4 w-4 shrink-0" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            ₦{totalBankCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">Cumulative electronic transfer fees</span>
      </div>
    </div>
  )
}
