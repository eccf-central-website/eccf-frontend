'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/dashboard/ui/button'
import { suggestPositionsFromCsv } from '@/app/actions/executive-suggestion-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'

export default function CsvPositionImportClient() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: string[] } | null>(null)
  const [isPending, startTransition] = useTransition()

  function downloadTemplate() {
    const header = 'FirstName,LastName,Email,PositionType,PositionValue,Rank'
    const rows = [
      'John,Doe,john.doe@example.com,csgb,President,lead',
      'Jane,Smith,jane.smith@example.com,hall,Main Hall,assistant',
      'Sam,Okoro,,team,Media Team,lead',
    ]
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'position-suggestions-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toastError('Please select a CSV or Excel file.')
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    startTransition(async () => {
      const res = await suggestPositionsFromCsv(formData)
      if (!res.ok) {
        toastError(res.error || 'Import failed.')
        return
      }
      setResult({ imported: res.imported, skipped: res.skipped })
      toastSuccess(`Imported ${res.imported} position suggestion(s).`)
    })
  }

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Upload className="h-5 w-5 shrink-0 text-[#0077cc]" />
        <h2 className="font-serif font-bold text-lg text-slate-900">
          Import Position Suggestions (CSV / Excel)
        </h2>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">
        Upload a file with columns: FirstName, LastName, Email (optional), PositionType (csgb|hall|team), PositionValue, Rank (lead|assistant).
        One row per person-position; multiple rows = multiple positions. Unmatched names are skipped.
      </p>
      <Button type="button" variant="outline" onClick={downloadTemplate}>
        Download CSV template
      </Button>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm"
        />
        <Button type="submit" disabled={isPending || !file}>
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> Importing…
            </span>
          ) : (
            'Import Suggestions'
          )}
        </Button>
      </form>
      {result && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Imported {result.imported} suggestion(s).
          </div>
          {result.skipped.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-700 font-semibold">
                <XCircle className="h-4 w-4 shrink-0" /> Skipped {result.skipped.length}:
              </div>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-0.5">
                {result.skipped.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}