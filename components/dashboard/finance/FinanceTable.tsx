'use client'

import React from 'react'
import type { FinanceRow } from '@/types'
import { Badge } from '@/components/dashboard/ui/badge'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

interface FinanceTableProps {
  entries: FinanceRow[]
}

export default function FinanceTable({ entries }: FinanceTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No financial transactions recorded yet.
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-x-auto">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b text-xs uppercase tracking-wider text-muted-foreground font-medium">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Amount (NGN)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((entry) => {
              const isIncome = entry.type === 'Income'
              return (
                <tr key={entry._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5 font-medium whitespace-nowrap text-foreground">
                    {entry.transactionDate}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={`inline-flex items-center gap-1 font-semibold ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="h-3 w-3" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3" />
                      )}
                      <span>{entry.type}</span>
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground">
                    {entry.category}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground max-w-xs truncate">
                    {entry.description || '—'}
                    {entry.flutterwaveRef && (
                      <span className="block text-[11px] text-sky-600 font-mono mt-0.5">
                        Ref: {entry.flutterwaveRef}
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-4 py-3.5 text-right font-bold whitespace-nowrap ${
                      isIncome ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {isIncome ? '+' : '-'}₦{entry.amount.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
