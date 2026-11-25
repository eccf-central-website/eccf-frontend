'use client'

import * as React from 'react'
import { Download } from 'lucide-react'
import type { FinanceRow } from '@/types'
import { lagosDate } from '@/lib/dashboard/dates'
import { Button } from '@/components/dashboard/ui/button'

interface FinanceExportButtonProps {
  entries: FinanceRow[]
}

export default function FinanceExportButton({ entries }: FinanceExportButtonProps) {
  const handleExport = () => {
    if (entries.length === 0) return

    const header = [
      'Transaction Date',
      'Type',
      'Amount (NGN)',
      'Category',
      'Description',
      'Flutterwave Ref',
    ]
    const rows = entries.map((e) => [
      e.transactionDate,
      e.type,
      e.amount,
      e.category,
      e.description || '',
      e.flutterwaveRef || '',
    ])

    const csvContent = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `eccf_finance_ledger_${lagosDate()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      type="button"
      onClick={handleExport}
      variant="outline"
      disabled={entries.length === 0}
      className="min-h-11 gap-2 px-4 md:min-h-10"
    >
      <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Export CSV</span>
    </Button>
  )
}
