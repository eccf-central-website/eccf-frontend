'use client'

import React from 'react'
import { Button } from '@/components/dashboard/ui/button'
import { Download } from 'lucide-react'
import type { FinanceRow } from '@/types'

interface FinanceExportButtonProps {
  entries: FinanceRow[]
}

export default function FinanceExportButton({ entries }: FinanceExportButtonProps) {
  const handleExport = () => {
    if (entries.length === 0) return

    const header = ['Transaction Date', 'Type', 'Amount (NGN)', 'Category', 'Description', 'Flutterwave Ref']
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
    link.download = `eccf_finance_ledger_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      disabled={entries.length === 0}
      className="shadow-xs"
    >
      <Download className="mr-1.5 h-4 w-4 shrink-0" />
      Export CSV
    </Button>
  )
}
