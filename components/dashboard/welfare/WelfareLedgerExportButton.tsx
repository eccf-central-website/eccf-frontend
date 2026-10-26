'use client'

import React from 'react'
import { Button } from '@/components/dashboard/ui/button'
import { Download } from 'lucide-react'
import type { WelfareLedgerRow } from '@/types'

interface WelfareLedgerExportButtonProps {
  entries: WelfareLedgerRow[]
}

export default function WelfareLedgerExportButton({ entries }: WelfareLedgerExportButtonProps) {
  const handleExport = () => {
    if (entries.length === 0) return

    const header = [
      'Date',
      'Description',
      'Debit/Credit',
      'Amount (NGN)',
      'Bank Charge (NGN)',
      'Balance (NGN)',
      'Category',
      'Beneficiary/Recipient',
      'Reference',
      'Logged By',
    ]

    const rows = entries.map((e) => [
      e.date,
      e.description,
      e.type,
      e.amount,
      e.bankCharge ?? 0,
      e.runningBalance,
      e.category || '',
      e.recipient || '',
      e.reference || '',
      e.loggedByName || (typeof e.loggedBy === 'object' ? e.loggedBy?.fullName : '') || '',
    ])

    const csvContent = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `eccf_welfare_purse_ledger_${new Date().toISOString().split('T')[0]}.csv`
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
      className="shadow-xs rounded-xl"
    >
      <Download className="mr-1.5 h-4 w-4 shrink-0" />
      Export CSV
    </Button>
  )
}
