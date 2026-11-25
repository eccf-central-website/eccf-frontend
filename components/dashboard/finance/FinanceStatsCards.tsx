'use client'

import * as React from 'react'
import { useMemo } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { formatNaira } from '@/lib/dashboard/format'
import { cn } from '@/lib/utils'
import { KpiStrip, type KpiStripItem } from '@/components/dashboard/ui/kpi-strip'

interface FinanceStatsCardsProps {
  totalIncome: number
  totalExpense: number
  periodLabel?: string
}

export default function FinanceStatsCards({
  totalIncome,
  totalExpense,
  periodLabel,
}: FinanceStatsCardsProps) {
  const netBalance = totalIncome - totalExpense
  const isSurplus = netBalance >= 0

  const items: KpiStripItem[] = useMemo(
    () => [
      {
        id: 'income',
        label: 'Income',
        value: formatNaira(totalIncome),
        rawValue: totalIncome,
        caption: periodLabel ? `Inflows · ${periodLabel}` : 'Recorded inflows',
        icon: <ArrowDownLeft />,
        tone: 'success',
      },
      {
        id: 'expenses',
        label: 'Expenses',
        value: formatNaira(totalExpense),
        rawValue: totalExpense,
        caption: periodLabel ? `Disbursements · ${periodLabel}` : 'Recorded disbursements',
        icon: <ArrowUpRight />,
        tone: 'neutral',
      },
      {
        id: 'net-position',
        label: 'Net position',
        value: formatNaira(netBalance),
        rawValue: netBalance,
        caption: (
          <span
            className={cn(
              'inline-flex items-center gap-1 font-medium',
              isSurplus ? 'text-success' : 'text-destructive'
            )}
          >
            {isSurplus ? (
              <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>
              {isSurplus ? 'Surplus' : 'Deficit'}
              {periodLabel ? ` · ${periodLabel}` : ''}
            </span>
          </span>
        ),
        icon: <Scale />,
        tone: isSurplus ? 'primary' : 'destructive',
      },
    ],
    [totalIncome, totalExpense, netBalance, isSurplus, periodLabel]
  )

  return <KpiStrip ariaLabel="Financial position summary" items={items} />
}
