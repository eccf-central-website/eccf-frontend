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
      <Card className="shadow-xs border-emerald-200/60 bg-emerald-50/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
              Total Inflow (Income)
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700">
              ₦{totalIncome.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs border-rose-200/60 bg-rose-50/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-900">
              Total Outflow (Expense)
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-700">
              ₦{totalExpense.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs border-sky-200/60 bg-sky-50/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-900">
              Net Balance
            </span>
            <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
              <Scale className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                netBalance >= 0 ? 'text-sky-800' : 'text-rose-700'
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
