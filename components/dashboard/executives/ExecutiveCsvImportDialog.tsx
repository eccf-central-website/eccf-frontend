'use client'

/**
 * ExecutiveCsvImportDialog — bulk-import executive positions from CSV/XLSX.
 *
 * Pairs with the `suggestPositionsFromCsv` server action
 * (app/actions/executive-suggestion-actions.ts), which is hard-gated to the
 * President/VP/Chaplain (or admin). This dialog collects the spreadsheet,
 * shows the expected column shape, submits it as FormData, and surfaces the
 * per-row skip report returned by the action. Imported entries land among the
 * pending applications on the approvals console (the page refreshes after a
 * successful import; the console syncs from fresh props).
 */

import * as React from 'react'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  TriangleAlert,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/dashboard/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'
import {
  suggestPositionsFromCsv,
  type CsvImportResult,
} from '@/app/actions/executive-suggestion-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'
import { cn } from '@/lib/utils'

const MAX_FILE_BYTES = 4 * 1024 * 1024 // 4 MB
const ACCEPT = '.csv,.xlsx,.xls'

const TEMPLATE_CSV = [
  'FullName,PositionType,PositionValue,Rank',
  'Ada Osaretin,csgb,General Secretary,lead',
  'Emeka Nwosu,hall,Hall 1,lead',
  'Grace Iyoha,hall,Hall 2,assistant',
  'Tunde Bakare,team,Media,lead',
].join('\n')

interface ExecutiveCsvImportDialogProps {
  className?: string
  buttonLabel?: string
}

export default function ExecutiveCsvImportDialog({
  className,
  buttonLabel = 'Import from Spreadsheet',
}: ExecutiveCsvImportDialogProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CsvImportResult | null>(null)
  const [pending, startTransition] = useTransition()
  const [downloading, setDownloading] = useState(false)

  function pickFile(next: File | null) {
    setError(null)
    setResult(null)
    if (!next) {
      setFile(next)
      return
    }
    const extOk = /\.(csv|xlsx|xls)$/i.test(next.name)
    if (!extOk) {
      setError('Only CSV, XLSX or XLS files are supported.')
      return
    }
    if (next.size > MAX_FILE_BYTES) {
      setError('File is larger than 4 MB. Trim the sheet and try again.')
      return
    }
    setFile(next)
  }

  function downloadTemplate() {
    setDownloading(true)
    try {
      const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'eccf_executive_import_template.csv'
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  function submit() {
    if (!file || pending) return
    const data = new FormData()
    data.append('file', file)
    startTransition(async () => {
      try {
        const res = await suggestPositionsFromCsv(data)
        if (res.ok) {
          setResult(res)
          toastSuccess(
            `Imported ${res.imported} position${res.imported === 1 ? '' : 's'}${
              res.skipped.length ? `, ${res.skipped.length} row${res.skipped.length === 1 ? '' : 's'} skipped` : ''
            }.`
          )
          // Refresh the server component so the pending-approvals list
          // includes the freshly imported entries.
          router.refresh()
        } else {
          setError(res.error || 'Import failed. Try again.')
          toastError(res.error || 'Import failed. Try again.')
        }
      } catch {
        setError('An unexpected network error occurred. Please try again.')
        toastError('An unexpected network error occurred.')
      }
    })
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      // Reset a moment after exit so the closing animation doesn't flicker.
      setTimeout(() => {
        setFile(null)
        setError(null)
        setResult(null)
        setDragActive(false)
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          'h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs',
          className
        )}
      >
        <FileSpreadsheet className="h-4 w-4 shrink-0 mr-1.5" />
        {buttonLabel}
      </Button>

      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden min-w-0 border-border bg-card sm:max-w-lg p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-serif font-black tracking-tight text-foreground flex items-center gap-2 text-base sm:text-lg min-w-0">
            <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate">Bulk-Import Executive Positions</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Upload a CSV or Excel sheet of executive positions. Each row is matched to a registered
            worker by full name and lands here as a pending application for your approval.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          /* ---------- Result report ---------- */
          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">
                  Imported {result.imported} position{result.imported === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.skipped.length
                    ? `${result.skipped.length} row${result.skipped.length === 1 ? ' was' : 's were'} skipped below.`
                    : 'Everything on the sheet matched cleanly.'}
                </p>
              </div>
            </div>

            {result.skipped.length > 0 && (
              <div className="rounded-xl bg-warning/10 border border-warning/25 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Skipped rows ({result.skipped.length})
                  </span>
                </div>
                <ul className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {result.skipped.map((reason, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed break-words">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* ---------- Upload form ---------- */
          <div className="space-y-3 min-w-0">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              disabled={pending}
            />

            <div
              role="button"
              tabIndex={0}
              aria-label="Choose a CSV or Excel file"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragActive(false)
                if (!pending) pickFile(e.dataTransfer.files?.[0] ?? null)
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 sm:p-6 text-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring w-full min-w-0 max-w-full overflow-hidden',
                dragActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/40'
              )}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Upload className="h-5 w-5" />
              </div>
              {file ? (
                <div className="w-full min-w-0 px-2 flex flex-col items-center">
                  <span className="text-sm font-bold text-foreground w-full truncate text-center block">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground text-center break-words mt-0.5">
                    {(file.size / 1024).toFixed(0)} KB — click to choose a different file
                  </span>
                </div>
              ) : (
                <div className="w-full min-w-0 px-2 flex flex-col items-center">
                  <span className="text-sm font-bold text-foreground text-center">
                    Drop the sheet here or click to browse
                  </span>
                  <span className="text-xs text-muted-foreground text-center mt-0.5">
                    CSV, XLSX or XLS — up to 4 MB
                  </span>
                </div>
              )}
            </div>

            {/* Column shape hint */}
            <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1.5 w-full min-w-0 overflow-hidden">
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Expected columns
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['FullName (or First + Last Name)', 'PositionType: csgb · hall · team', 'PositionValue', 'Rank: lead · assistant'].map(
                  (col) => (
                    <span
                      key={col}
                      className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] font-mono text-foreground break-all sm:break-normal"
                    >
                      {col}
                    </span>
                  )
                )}
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive font-semibold break-words" role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={downloadTemplate}
            disabled={downloading}
            className="h-10 sm:h-9 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground w-full sm:w-auto"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin mr-1.5" />
            ) : (
              <Download className="h-4 w-4 shrink-0 mr-1.5" />
            )}
            Template
          </Button>

          {result ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-10 sm:h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs w-full sm:w-auto"
            >
              {result.skipped.length ? 'Review Pending List' : 'Done'}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={submit}
              disabled={!file || pending}
              className="h-10 sm:h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs w-full sm:w-auto"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin mr-1.5" />
                  Importing...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 shrink-0 mr-1.5" />
                  Import Positions
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
