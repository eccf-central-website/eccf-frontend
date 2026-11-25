'use client'

import React from 'react'
import { ArrowDownLeft, ArrowUpRight, Receipt, Wallet } from 'lucide-react'
import { KpiStrip, type KpiStripItem } from '@/components/dashboard/ui/kpi-strip'
import { formatNaira } from '@/lib/dashboard/format'

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
  const items: KpiStripItem[] = [
    {
      id: 'purse-balance',
      label: 'Purse balance',
      value: formatNaira(currentBalance),
      rawValue: currentBalance,
      caption: 'Available welfare purse funds',
      icon: <Wallet />,
      tone: currentBalance >= 0 ? 'primary' : 'destructive',
    },
    {
      id: 'total-inflows',
      label: 'Total inflows',
      value: formatNaira(totalCredit),
      rawValue: totalCredit,
      caption: 'Allocations & voluntary gifts',
      icon: <ArrowDownLeft />,
      tone: 'success',
    },
    {
      id: 'total-outflows',
      label: 'Total outflows',
      value: formatNaira(totalDebit),
      rawValue: totalDebit,
      caption: 'Direct student assistance',
      icon: <ArrowUpRight />,
      tone: 'neutral',
    },
    {
      id: 'bank-charges',
      label: 'Bank charges',
      value: formatNaira(totalBankCharges),
      rawValue: totalBankCharges,
      caption: 'Cumulative transfer fees',
      icon: <Receipt />,
      tone: 'neutral',
    },
  ]

  return <KpiStrip items={items} ariaLabel="Welfare purse summary" />
}
