'use client'

import React from 'react'
import { Card, CardContent } from '@/components/dashboard/ui/card'
import { ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react'

interface FinanceStatsCardsProps {
  totalIncome: number
  totalExpense: number
}

export default function FinanceStatsCards({ totalIncome, totalExpense }: FinanceStatsCardsProps) {
  const netBalance = totalIncome - totalExpense

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="shadow-xs border-emerald-500/25 bg-emerald-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Total Inflow (Income)
            </span>
            <div className="h-8 w-8 shrink-0 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
              <ArrowDownRight className="h-5 w-5 shrink-0" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              ₦{totalIncome.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs border-rose-500/25 bg-rose-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Total Outflow (Expense)
            </span>
            <div className="h-8 w-8 shrink-0 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-500">
              <ArrowUpRight className="h-5 w-5 shrink-0" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              ₦{totalExpense.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs border-sky-500/25 bg-sky-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Net Balance
            </span>
            <div className="h-8 w-8 shrink-0 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-500">
              <Scale className="h-5 w-5 shrink-0" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                netBalance >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              ₦{netBalance.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
