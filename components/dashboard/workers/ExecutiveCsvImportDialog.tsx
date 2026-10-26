'use client'

/**
 * ExecutiveCsvImportDialog — 2-step bulk-import for executive positions from CSV/XLSX.
 *
 * Step 1: Upload spreadsheet and select options (e.g. reserve roles for unregistered EXCOs).
 * Step 2: Interactive Mapping & Preview table:
 *         - Review every single row before anything is saved to the database.
 *         - View matched registered workers vs. reserved appointments for unregistered leaders.
 *         - Review mapped CSGB offices, halls, and ministry teams.
 *         - Toggle rank (Lead vs Assistant) or select/unselect specific rows.
 * Step 3: Confirmation and summary report. The workforce roster refreshes only
 *         when the user clicks "Done" or closes the modal.
 */

import * as React from 'react'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  Mail,
  RotateCcw,
  Search,
  Sparkles,
  TriangleAlert,
  Upload,
  UserCheck,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/dashboard/ui/button'
import { Checkbox } from '@/components/dashboard/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'
import {
  previewExecutiveSpreadsheet,
  commitExecutiveImport,
  reconcileRegisteredExecutives,
  type ExecutivePreviewRow,
  type PreviewSpreadsheetResult,
  type CommitImportItem,
  type CommitImportResult,
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
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [includeUnregistered, setIncludeUnregistered] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [isReconciling, setIsReconciling] = useState(false)

  const [, setPreviewData] = useState<PreviewSpreadsheetResult | null>(null)
  const [rows, setRows] = useState<ExecutivePreviewRow[]>([])
  const [filterTab, setFilterTab] = useState<'all' | 'matched' | 'new' | 'warning'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [commitResult, setCommitResult] = useState<CommitImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReconcile() {
    setIsReconciling(true)
    setError(null)
    try {
      const res = await reconcileRegisteredExecutives()
      if (res.ok) {
        if (res.reconciledCount > 0) {
          toastSuccess(`Linked & activated ${res.reconciledCount} exco appointment(s)!`)
          router.refresh()
        } else {
          toastSuccess('Registered excos are in sync with the leadership register.')
        }
      } else {
        setError(res.error || 'Failed to sync leadership appointments.')
        toastError(res.error || 'Failed to sync leadership appointments.')
      }
    } catch {
      setError('Network error syncing leadership appointments.')
      toastError('Network error syncing appointments.')
    } finally {
      setIsReconciling(false)
    }
  }

  function resetDialog() {
    setStep('upload')
    setFile(null)
    setDragActive(false)
    setIsAnalyzing(false)
    setIsCommitting(false)
    setPreviewData(null)
    setRows([])
    setFilterTab('all')
    setSearchQuery('')
    setCommitResult(null)
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next && commitResult && commitResult.imported > 0) {
      router.refresh()
    }
    setOpen(next)
    if (!next) {
      setTimeout(() => {
        resetDialog()
      }, 200)
    }
  }

  function pickFile(next: File | null) {
    setError(null)
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

  async function handleAnalyze() {
    if (!file || isAnalyzing) return
    setIsAnalyzing(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await previewExecutiveSpreadsheet(formData)
      if (res.ok) {
        setPreviewData(res)
        setRows(res.rows)
        setStep('preview')
        toastSuccess(`Parsed ${res.rows.length} rows. Please review mappings below.`)
      } else {
        setError(res.error || 'Failed to analyze spreadsheet.')
        toastError(res.error || 'Failed to analyze spreadsheet.')
      }
    } catch {
      setError('An unexpected network error occurred while analyzing the file.')
      toastError('Network error parsing spreadsheet.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  function handleToggleRow(rowId: string) {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, selected: !r.selected } : r))
    )
  }

  function handleToggleAll(selectedRows: ExecutivePreviewRow[]) {
    const allSelected = selectedRows.every((r) => r.selected)
    const targetIds = new Set(selectedRows.map((r) => r.rowId))
    setRows((prev) =>
      prev.map((r) => (targetIds.has(r.rowId) ? { ...r, selected: !allSelected } : r))
    )
  }

  function handleToggleRank(rowId: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.rowId === rowId
          ? { ...r, rank: r.rank === 'lead' ? 'assistant' : 'lead' }
          : r
      )
    )
  }

  async function handleCommit() {
    const selectedRows = rows.filter((r) => r.selected)
    if (!selectedRows.length) {
      toastError('Please select at least one row to import.')
      return
    }

    setIsCommitting(true)
    setError(null)

    const commitItems: CommitImportItem[] = selectedRows.map((r) => ({
      rowId: r.rowId,
      rawName: r.rawName,
      workerDisplayName: r.workerDisplayName,
      matchedWorkerId: r.matchedWorkerId,
      isNewWorker: r.isNewWorker,
      kind: r.kind === 'unknown' ? 'team' : r.kind,
      office: r.office,
      csgbRoleRef: r.csgbRoleRef,
      hall: r.hall,
      hallRef: r.hallRef,
      teamName: r.teamName,
      teamRef: r.teamRef,
      rank: r.rank,
      email: r.rawEmail,
    }))

    try {
      const res = await commitExecutiveImport({
        items: commitItems,
        includeUnregistered,
      })

      if (res.ok) {
        setCommitResult(res)
        setStep('result')
        if (res.imported > 0) {
          const reserved = res.unregisteredCount > 0
            ? ` (${res.unregisteredCount} reserved for unregistered leader${res.unregisteredCount === 1 ? '' : 's'})`
            : ''
          toastSuccess(
            `Successfully imported ${res.imported} position${res.imported === 1 ? '' : 's'}${reserved}!`
          )
        } else {
          toastError('0 positions were imported. Check the report below.')
        }
      } else {
        setError(res.error || 'Import failed.')
        toastError(res.error || 'Import failed.')
      }
    } catch {
      setError('An unexpected error occurred while saving positions.')
      toastError('Network error committing import.')
    } finally {
      setIsCommitting(false)
    }
  }

  // Filtered rows for the preview table
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // Tab filter
      if (filterTab === 'matched' && r.isNewWorker) return false
      if (filterTab === 'new' && (!r.isNewWorker || r.status === 'warning')) return false
      if (filterTab === 'warning' && r.status !== 'warning') return false

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchName = r.rawName.toLowerCase().includes(query)
        const matchDisplay = r.workerDisplayName.toLowerCase().includes(query)
        const matchPos = r.rawPosition.toLowerCase().includes(query)
        const matchOffice = (r.office || '').toLowerCase().includes(query)
        const matchHall = (r.hall || '').toLowerCase().includes(query)
        const matchTeam = (r.teamName || '').toLowerCase().includes(query)
        return matchName || matchDisplay || matchPos || matchOffice || matchHall || matchTeam
      }
      return true
    })
  }, [rows, filterTab, searchQuery])

  const selectedCount = useMemo(() => rows.filter((r) => r.selected).length, [rows])
  const matchedCount = useMemo(() => rows.filter((r) => !r.isNewWorker).length, [rows])
  const newWorkerCount = useMemo(() => rows.filter((r) => r.isNewWorker && r.status === 'valid').length, [rows])
  const warningCount = useMemo(() => rows.filter((r) => r.status === 'warning').length, [rows])

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

      <DialogContent
        className={cn(
          'overflow-hidden border-border bg-card p-0 transition-all duration-200',
          step === 'preview'
            ? 'max-w-5xl w-[95vw] max-h-[92vh] flex flex-col'
            : step === 'result'
            ? 'sm:max-w-xl max-h-[90vh] flex flex-col'
            : 'sm:max-w-lg max-h-[90vh] flex flex-col'
        )}
      >
        {/* =================================================================== */}
        {/* STEP 1: UPLOAD                                                      */}
        {/* =================================================================== */}
        {step === 'upload' && (
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif font-black tracking-tight text-foreground flex items-center gap-2 text-base sm:text-lg min-w-0">
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" />
                <span className="truncate">Bulk-Import Leadership Positions</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Upload your executive or unit leadership spreadsheet. In the next step, you will be able to preview and modify all name & position mappings before anything is imported.
              </DialogDescription>
            </DialogHeader>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              disabled={isAnalyzing}
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
                if (!isAnalyzing) pickFile(e.dataTransfer.files?.[0] ?? null)
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring w-full min-w-0 max-w-full overflow-hidden',
                dragActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/40'
              )}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Upload className="h-6 w-6" />
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
                    Drop your spreadsheet here or click to browse
                  </span>
                  <span className="text-xs text-muted-foreground text-center mt-0.5">
                    CSV, XLSX or XLS — up to 4 MB
                  </span>
                </div>
              )}
            </div>

            {/* Reserve appointments for unregistered EXCOs */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30 border border-border cursor-pointer select-none hover:bg-muted/50 transition-colors">
              <Checkbox
                checked={includeUnregistered}
                onCheckedChange={(c) => setIncludeUnregistered(Boolean(c))}
                className="mt-0.5"
                disabled={isAnalyzing}
              />
              <div className="text-xs leading-normal">
                <span className="font-semibold text-foreground block">
                  Include unregistered EXCOs
                </span>
                <span className="text-muted-foreground">
                  Names not yet on the worker register are imported as reserved appointments. Their dashboard activates automatically — with full executive permissions — the moment they register on /register. Turn this off to skip them.
                </span>
              </div>
            </label>

            {/* Column hints */}
            <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1.5 w-full min-w-0 overflow-hidden">
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Supported columns (flexible & auto-detected)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Full Name (any word order)',
                  'Position / Office / Role (auto-maps CSGB, Hall, Ministry Team)',
                  'Rank (lead · assistant, optional)',
                  'Hall (optional)',
                ].map((col) => (
                  <span
                    key={col}
                    className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] font-mono text-foreground"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive font-semibold break-words" role="alert">
                {error}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center">
              <div className="flex items-center gap-2 flex-wrap">
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

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReconcile}
                  disabled={isReconciling}
                  className="h-10 sm:h-9 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground w-full sm:w-auto"
                >
                  {isReconciling ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin mr-1.5" />
                  ) : (
                    <RotateCcw className="h-4 w-4 shrink-0 mr-1.5" />
                  )}
                  Sync Exco Registrations
                </Button>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleAnalyze}
                disabled={!file || isAnalyzing}
                className="h-10 sm:h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs w-full sm:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin mr-1.5" />
                    Analyzing Sheet...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 shrink-0 mr-1.5" />
                    Preview & Map Rows
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 2: PREVIEW & INTERACTIVE MAPPING                               */}
        {/* =================================================================== */}
        {step === 'preview' && (
          <div className="flex flex-col h-full max-h-[92vh] min-h-0">
            {/* Header with summary chips */}
            <div className="p-4 sm:p-5 border-b border-border bg-card/60 backdrop-blur-xs shrink-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <DialogTitle className="font-serif font-black tracking-tight text-foreground flex items-center gap-2 text-base sm:text-lg">
                    <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                    <span>Review & Map Positions</span>
                    <span className="text-xs font-normal font-sans text-muted-foreground">
                      ({rows.length} total rows detected)
                    </span>
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Review and verify all detected workers and roles before importing into the database.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    <UserCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>{matchedCount} Registered</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-700 dark:text-sky-400 text-xs font-semibold">
                    <UserPlus className="h-3.5 w-3.5 shrink-0" />
                    <span>{newWorkerCount} Unregistered</span>
                  </div>
                  {warningCount > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                      <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                      <span>{warningCount} Warnings</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Toolbar: Search & Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/50 border border-border text-xs w-full sm:w-auto overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={cn(
                      'px-2.5 py-1 rounded-md font-semibold transition-all whitespace-nowrap',
                      filterTab === 'all'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    All ({rows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('matched')}
                    className={cn(
                      'px-2.5 py-1 rounded-md font-semibold transition-all whitespace-nowrap',
                      filterTab === 'matched'
                        ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Registered ({matchedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('new')}
                    className={cn(
                      'px-2.5 py-1 rounded-md font-semibold transition-all whitespace-nowrap',
                      filterTab === 'new'
                        ? 'bg-card text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Unregistered ({newWorkerCount})
                  </button>
                  {warningCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterTab('warning')}
                      className={cn(
                        'px-2.5 py-1 rounded-md font-semibold transition-all whitespace-nowrap',
                        filterTab === 'warning'
                          ? 'bg-card text-amber-600 dark:text-amber-400 shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Warnings ({warningCount})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search name, role, hall..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAll(filteredRows)}
                    className="h-8 px-2.5 text-xs rounded-lg whitespace-nowrap"
                  >
                    {filteredRows.every((r) => r.selected) ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Scrollable Preview Table */}
            <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-xs border-b border-border text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2.5 pl-4 pr-2 w-10">
                      <Checkbox
                        checked={
                          filteredRows.length > 0 && filteredRows.every((r) => r.selected)
                        }
                        onCheckedChange={() => handleToggleAll(filteredRows)}
                      />
                    </th>
                    <th className="py-2.5 px-2 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Sheet Name</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Mapped Worker</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Mapped Role / Office</th>
                    <th className="py-2.5 px-3 w-32">Rank</th>
                    <th className="py-2.5 px-3 w-24 text-right pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <Filter className="h-6 w-6 mx-auto mb-2 opacity-40" />
                        No rows match your current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const isRowSelected = row.selected

                      return (
                        <tr
                          key={row.rowId}
                          className={cn(
                            'transition-colors hover:bg-muted/40',
                            !isRowSelected && 'opacity-60 bg-muted/10'
                          )}
                        >
                          {/* Checkbox */}
                          <td className="py-3 pl-4 pr-2">
                            <Checkbox
                              checked={isRowSelected}
                              onCheckedChange={() => handleToggleRow(row.rowId)}
                            />
                          </td>

                          {/* Row Index */}
                          <td className="py-3 px-2 text-center font-mono text-[11px] text-muted-foreground">
                            {row.rowIndex}
                          </td>

                          {/* Raw Sheet Name */}
                          <td className="py-3 px-3">
                            <span className="font-semibold text-foreground block">
                              {row.rawName}
                            </span>
                            <span className="text-[11px] text-muted-foreground block truncate max-w-[180px]">
                              {row.rawEmail || row.rawPosition}
                            </span>
                          </td>

                          {/* Mapped Worker */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-foreground">
                                {row.workerDisplayName}
                              </span>
                              {!row.isNewWorker ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] w-fit font-bold">
                                  <Check className="h-3 w-3" />
                                  Registered Worker
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-400 font-mono text-[10px] w-fit font-bold">
                                  <UserPlus className="h-3 w-3" />
                                  Unregistered
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Mapped Category & Office */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-foreground">
                                {row.office || row.hall || row.teamName || row.rawPosition}
                              </span>
                              <div className="flex items-center gap-1">
                                {row.kind === 'csgb' && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-400 font-mono text-[10px] font-bold">
                                    CSGB Executive
                                  </span>
                                )}
                                {row.kind === 'hall' && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 font-mono text-[10px] font-bold">
                                    Hall Pastorate
                                  </span>
                                )}
                                {row.kind === 'team' && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-400 font-mono text-[10px] font-bold">
                                    Ministry Team
                                  </span>
                                )}
                                {row.kind === 'unknown' && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-destructive/15 text-destructive font-mono text-[10px] font-bold">
                                    Unrecognized Role
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Rank Toggle */}
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => handleToggleRank(row.rowId)}
                              className={cn(
                                'px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors inline-flex items-center gap-1',
                                row.rank === 'lead'
                                  ? 'bg-primary/10 border-primary/30 text-primary'
                                  : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                              )}
                              title="Click to toggle Lead / Assistant"
                            >
                              <span>{row.rank === 'lead' ? 'Lead' : 'Assistant'}</span>
                              <RotateCcw className="h-3 w-3 opacity-60 ml-0.5" />
                            </button>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-right pr-4">
                            {row.status === 'valid' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]" title={row.statusMessage}>
                                <TriangleAlert className="h-3.5 w-3.5" />
                                Review
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-card shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep('upload')}
                disabled={isCommitting}
                className="h-9 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Upload
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <span className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{selectedCount}</span> of {rows.length} rows selected
                </span>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleCommit}
                  disabled={selectedCount === 0 || isCommitting}
                  className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs w-full sm:w-auto"
                >
                  {isCommitting ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin mr-1.5" />
                      Importing {selectedCount} Positions...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0 mr-1.5" />
                      Confirm & Import ({selectedCount})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 3: RESULT REPORT                                               */}
        {/* =================================================================== */}
        {step === 'result' && commitResult && (
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif font-black tracking-tight text-foreground flex items-center gap-2 text-base sm:text-lg">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Import Finished</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Positions have been saved. When you close this dialog, the workforce table will refresh.
              </DialogDescription>
            </DialogHeader>

            {commitResult.imported > 0 ? (
              <div className="flex items-start gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    Imported {commitResult.imported} position{commitResult.imported === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {commitResult.matchedCount} mapped to registered workers
                    {commitResult.unregisteredCount > 0 &&
                      ` • ${commitResult.unregisteredCount} unregistered appointment${commitResult.unregisteredCount === 1 ? '' : 's'} reserved (activates on registration)`}
                    {commitResult.emailsSent > 0 && ` • ${commitResult.emailsSent} guidance email${commitResult.emailsSent === 1 ? '' : 's'} sent with dashboard links`}
                    .
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {commitResult.skipped.length
                      ? `${commitResult.skipped.length} row${commitResult.skipped.length === 1 ? ' was' : 's were'} skipped below.`
                      : 'All selected entries were imported cleanly.'}
                  </p>
                  {commitResult.unregisteredCount > 0 && (
                    <p className="text-xs text-sky-700 dark:text-sky-400 mt-1.5">
                      Reserved leaders appear on the Executive Roster as “Unregistered · Awaiting registration” until they register.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 border border-destructive/25 p-4">
                <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-destructive">
                    0 positions imported
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    None of the positions could be imported. Review any skipped rows below.
                  </p>
                </div>
              </div>
            )}

                        {commitResult.emailsSent > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 font-medium">
                <Mail className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                <span>
                  Official appointment guidance emails with direct dashboard access links were dispatched to {commitResult.emailsSent} leader{commitResult.emailsSent === 1 ? '' : 's'}.
                </span>
              </div>
            )}

            {commitResult.skipped.length > 0 && (
              <div className="rounded-xl bg-warning/10 border border-warning/25 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5">
                  <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Skipped rows ({commitResult.skipped.length})
                  </span>
                </div>
                <ul className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/20">
                  {commitResult.skipped.map((reason, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed break-words pt-1.5 first:pt-0">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetDialog}
                className="h-10 sm:h-9 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Import Another File
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setOpen(false)
                  if (commitResult.imported > 0) {
                    router.refresh()
                  }
                }}
                className="h-10 sm:h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs w-full sm:w-auto"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
