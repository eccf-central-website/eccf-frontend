'use client'

/**
 * ExecutiveCsvImportDialog — 3-step bulk-import for executive positions from CSV/XLSX.
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
import { useId, useMemo, useRef, useState } from 'react'
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
import { Button, type ButtonProps } from '@/components/dashboard/ui/button'
import { Checkbox } from '@/components/dashboard/ui/checkbox'
import { Input } from '@/components/dashboard/ui/input'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
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
  'FullName,PositionType,PositionValue,Rank,Email',
  'Ada Osaretin,csgb,General Secretary,lead,ada.osaretin@example.com',
  'Emeka Nwosu,hall,Hall 1,lead,emeka.nwosu@example.com',
  'Grace Iyoha,hall,Hall 2,assistant,grace.iyoha@example.com',
  'Tunde Bakare,team,Media,lead,tunde.bakare@example.com',
].join('\n')

interface ExecutiveCsvImportDialogProps {
  className?: string
  buttonLabel?: string
  variant?: ButtonProps['variant']
}

function renderRoleCategoryBadge(kind: ExecutivePreviewRow['kind']) {
  switch (kind) {
    case 'csgb':
      return (
        <StatusBadge variant="gold" dot className="w-fit">
          CSGB Executive
        </StatusBadge>
      )
    case 'hall':
      return (
        <StatusBadge variant="warning" dot className="w-fit">
          Hall Pastorate
        </StatusBadge>
      )
    case 'team':
      return (
        <StatusBadge variant="info" dot className="w-fit">
          Ministry Team
        </StatusBadge>
      )
    case 'unknown':
    default:
      return (
        <StatusBadge variant="destructive" className="w-fit">
          Unrecognized Role
        </StatusBadge>
      )
  }
}

export default function ExecutiveCsvImportDialog({
  className,
  buttonLabel = 'Import from Spreadsheet',
  variant = 'default',
}: ExecutiveCsvImportDialogProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const searchInputId = useId()
  const fileInputId = useId()

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

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterTab === 'matched' && r.isNewWorker) return false
      if (filterTab === 'new' && !r.isNewWorker) return false
      if (filterTab === 'warning' && r.status !== 'warning') return false

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
  const newWorkerCount = useMemo(() => rows.filter((r) => r.isNewWorker).length, [rows])
  const warningCount = useMemo(() => rows.filter((r) => r.status === 'warning').length, [rows])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        variant={variant}
        onClick={() => setOpen(true)}
        className={cn(
          'min-h-11 md:min-h-10 px-4 font-semibold text-sm',
          className
        )}
      >
        <FileSpreadsheet className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{buttonLabel}</span>
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
              <DialogTitle className="font-sans font-semibold tracking-tight text-foreground flex items-center gap-2 text-lg min-w-0">
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">Bulk-Import Leadership Positions</span>
              </DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground leading-relaxed [text-wrap:pretty]">
                Upload your executive or unit leadership spreadsheet. In the next step, you will be able to preview and modify all name &amp; position mappings before anything is imported.
              </DialogDescription>
            </DialogHeader>

            <input
              id={fileInputId}
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              aria-label="Upload executive spreadsheet file"
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
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  inputRef.current?.click()
                }
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
                'flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring w-full min-w-0 max-w-full overflow-hidden',
                dragActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/40'
              )}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-accent-foreground dark:text-primary">
                <Upload className="h-6 w-6" aria-hidden="true" />
              </div>
              {file ? (
                <div className="w-full min-w-0 px-2 flex flex-col items-center">
                  <span className="text-sm font-semibold text-foreground w-full truncate text-center block">
                    {file.name}
                  </span>
                  <span className="text-[13px] text-muted-foreground text-center break-words mt-0.5 tabular-nums">
                    {(file.size / 1024).toFixed(0)} KB — click to choose a different file
                  </span>
                </div>
              ) : (
                <div className="w-full min-w-0 px-2 flex flex-col items-center">
                  <span className="text-sm font-semibold text-foreground text-center">
                    Drop your spreadsheet here or click to browse
                  </span>
                  <span className="text-[13px] text-muted-foreground text-center mt-0.5">
                    CSV, XLSX or XLS — up to 4 MB
                  </span>
                </div>
              )}
            </div>

            {/* Reserve appointments for unregistered EXCOs */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-raised cursor-pointer select-none hover:bg-muted/60 transition-colors min-h-11">
              <Checkbox
                checked={includeUnregistered}
                onCheckedChange={(c) => setIncludeUnregistered(Boolean(c))}
                aria-label="Include unregistered EXCOs"
                className="mt-0.5"
                disabled={isAnalyzing}
              />
              <div className="text-[13px] leading-relaxed">
                <span className="font-semibold text-foreground block">
                  Include unregistered EXCOs
                </span>
                <span className="text-muted-foreground">
                  Names not yet on the worker register are imported as reserved appointments. Their dashboard activates automatically — with full executive permissions — the moment they register on /register. Turn this off to skip them.
                </span>
              </div>
            </label>

            {/* Column hints */}
            <div className="rounded-xl bg-surface-raised p-3.5 space-y-2 w-full min-w-0 overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Supported columns (flexible &amp; auto-detected)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Full Name (any word order)',
                  'Email (recommended — links the role to the right person)',
                  'Position / Office / Role (auto-maps CSGB, Hall, Ministry Team)',
                  'Rank (lead · assistant, optional)',
                  'Hall (optional)',
                ].map((col) => (
                  <span
                    key={col}
                    className="px-2.5 py-1 rounded-md bg-card text-[13px] text-foreground shadow-sm"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-[13px] text-destructive font-semibold break-words" role="alert">
                {error}
              </p>
            )}

            <DialogFooter className="gap-2 pt-2 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center sm:space-x-0">
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={downloadTemplate}
                  disabled={downloading}
                  className="min-h-11 md:min-h-10 text-[13px] font-semibold text-muted-foreground hover:text-foreground w-full sm:w-auto"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>Template</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReconcile}
                  disabled={isReconciling}
                  className="min-h-11 md:min-h-10 text-[13px] font-semibold text-muted-foreground hover:text-foreground w-full sm:w-auto"
                >
                  {isReconciling ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                  ) : (
                    <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>Sync Exco Registrations</span>
                </Button>
              </div>

              <Button
                type="button"
                onClick={handleAnalyze}
                disabled={!file || isAnalyzing}
                className="min-h-11 md:min-h-10 px-4 font-semibold text-sm w-full sm:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                    <span>Analyzing Sheet…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Preview &amp; Map Rows</span>
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
            <div className="p-4 sm:p-5 border-b border-border/50 bg-card shrink-0 space-y-3 pr-12">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <DialogTitle className="font-sans font-semibold tracking-tight text-foreground flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span>Review &amp; Map Positions</span>
                    <span className="text-[13px] font-normal text-muted-foreground tabular-nums">
                      ({rows.length} total rows)
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-[13px] text-muted-foreground mt-0.5">
                    Review and verify all detected workers and roles before importing into the database.
                  </DialogDescription>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <StatusBadge
                    variant="success"
                    icon={<UserCheck className="h-3.5 w-3.5" aria-hidden="true" />}
                  >
                    <span className="tabular-nums">{matchedCount} Registered</span>
                  </StatusBadge>
                  <StatusBadge
                    variant="info"
                    icon={<UserPlus className="h-3.5 w-3.5" aria-hidden="true" />}
                  >
                    <span className="tabular-nums">{newWorkerCount} Unregistered</span>
                  </StatusBadge>
                  {warningCount > 0 && (
                    <StatusBadge
                      variant="warning"
                      icon={<TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
                    >
                      <span className="tabular-nums">{warningCount} Warnings</span>
                    </StatusBadge>
                  )}
                </div>
              </div>

              {/* Toolbar: Search & Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <div
                  role="tablist"
                  aria-label="Filter spreadsheet rows"
                  className="flex items-center gap-1 p-1 rounded-xl bg-surface-raised text-[13px] w-full sm:w-auto overflow-x-auto"
                >
                  {[
                    { id: 'all' as const, label: `All (${rows.length})` },
                    { id: 'matched' as const, label: `Registered (${matchedCount})` },
                    { id: 'new' as const, label: `Unregistered (${newWorkerCount})` },
                    ...(warningCount > 0
                      ? [{ id: 'warning' as const, label: `Warnings (${warningCount})` }]
                      : []),
                  ].map((tab) => {
                    const isActive = filterTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setFilterTab(tab.id)}
                        className={cn(
                          'min-h-11 md:min-h-10 px-3 rounded-lg font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isActive
                            ? 'bg-card text-foreground font-semibold shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span className="tabular-nums">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <label htmlFor={searchInputId} className="sr-only">
                      Search parsed spreadsheet rows
                    </label>
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id={searchInputId}
                      type="text"
                      placeholder="Search name, role, hall…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 min-h-11 md:min-h-10 text-sm"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleToggleAll(filteredRows)}
                    className="min-h-11 md:min-h-10 px-3 text-[13px] font-semibold whitespace-nowrap"
                  >
                    {filteredRows.length > 0 && filteredRows.every((r) => r.selected)
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Scrollable Preview Table */}
            <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
              <table className="w-full text-left border-collapse text-sm">
                <caption className="sr-only">
                  Preview of parsed executive leadership spreadsheet rows and mapped roles
                </caption>
                <thead className="sticky top-0 z-10 bg-surface-raised text-[13px] font-semibold text-muted-foreground">
                  <tr>
                    <th scope="col" className="h-11 pl-4 pr-2 w-12">
                      <Checkbox
                        checked={
                          filteredRows.length > 0 && filteredRows.every((r) => r.selected)
                        }
                        onCheckedChange={() => handleToggleAll(filteredRows)}
                        aria-label="Select all visible rows"
                      />
                    </th>
                    <th scope="col" className="h-11 px-2 w-12 text-center">
                      #
                    </th>
                    <th scope="col" className="h-11 px-3 min-w-[160px]">
                      Sheet Name
                    </th>
                    <th scope="col" className="h-11 px-3 min-w-[200px]">
                      Mapped Worker
                    </th>
                    <th scope="col" className="h-11 px-3 min-w-[200px]">
                      Mapped Role / Office
                    </th>
                    <th scope="col" className="h-11 px-3 w-36">
                      Rank
                    </th>
                    <th scope="col" className="h-11 px-3 w-28 text-right pr-4">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                        <Filter className="h-6 w-6 mx-auto mb-2 opacity-50" aria-hidden="true" />
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
                            'min-h-12 transition-colors hover:bg-muted/30',
                            !isRowSelected && 'opacity-60 bg-muted/10'
                          )}
                        >
                          {/* Checkbox */}
                          <td className="py-3 pl-4 pr-2">
                            <Checkbox
                              checked={isRowSelected}
                              onCheckedChange={() => handleToggleRow(row.rowId)}
                              aria-label={`Select ${row.rawName}`}
                            />
                          </td>

                          {/* Row Index */}
                          <td className="py-3 px-2 text-center text-[13px] tabular-nums text-muted-foreground">
                            {row.rowIndex}
                          </td>

                          {/* Raw Sheet Name */}
                          <td className="py-3 px-3">
                            <span className="font-semibold text-foreground block">
                              {row.rawName}
                            </span>
                            <span className="text-[13px] text-muted-foreground block truncate max-w-[180px]">
                              {row.rawEmail || row.rawPosition}
                            </span>
                          </td>

                          {/* Mapped Worker */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-foreground">
                                {row.workerDisplayName}
                              </span>
                              {!row.isNewWorker ? (
                                <StatusBadge
                                  variant="success"
                                  icon={<Check className="h-3.5 w-3.5" aria-hidden="true" />}
                                  className="w-fit"
                                >
                                  Registered Worker
                                </StatusBadge>
                              ) : (
                                <StatusBadge
                                  variant="info"
                                  icon={<UserPlus className="h-3.5 w-3.5" aria-hidden="true" />}
                                  className="w-fit"
                                >
                                  Unregistered
                                </StatusBadge>
                              )}
                            </div>
                          </td>

                          {/* Mapped Category & Office */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-foreground">
                                {row.office || row.hall || row.teamName || row.rawPosition}
                              </span>
                              {renderRoleCategoryBadge(row.kind)}
                            </div>
                          </td>

                          {/* Rank Toggle */}
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => handleToggleRank(row.rowId)}
                              aria-label={`Toggle rank for ${row.rawName}, currently ${row.rank === 'lead' ? 'Lead' : 'Assistant'}`}
                              className={cn(
                                'min-h-11 md:min-h-10 px-3 rounded-[var(--radius-control)] text-[13px] font-semibold transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                row.rank === 'lead'
                                  ? 'bg-primary/10 text-accent-foreground dark:text-primary'
                                  : 'bg-surface-raised text-muted-foreground hover:text-foreground'
                              )}
                              title="Click to toggle Lead / Assistant"
                            >
                              <span>{row.rank === 'lead' ? 'Lead' : 'Assistant'}</span>
                              <RotateCcw className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                            </button>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-right pr-4">
                            {row.status === 'valid' ? (
                              <StatusBadge variant="success">Ready</StatusBadge>
                            ) : (
                              <StatusBadge
                                variant="warning"
                                title={row.statusMessage}
                              >
                                Review
                              </StatusBadge>
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
            <div className="p-4 border-t border-border/50 bg-card shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('upload')}
                disabled={isCommitting}
                className="min-h-11 md:min-h-10 text-sm font-semibold text-muted-foreground hover:text-foreground w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Back to Upload</span>
              </Button>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
                <span className="text-[13px] text-muted-foreground tabular-nums">
                  <span className="font-semibold text-foreground">{selectedCount}</span> of {rows.length} rows selected
                </span>

                <Button
                  type="button"
                  onClick={handleCommit}
                  disabled={selectedCount === 0 || isCommitting}
                  className="min-h-11 md:min-h-10 px-4 font-semibold text-sm w-full sm:w-auto"
                >
                  {isCommitting ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                      <span>Importing {selectedCount} Positions…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Confirm &amp; Import ({selectedCount})</span>
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
              <DialogTitle className="font-sans font-semibold tracking-tight text-foreground flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                <span>Import Finished</span>
              </DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground leading-relaxed">
                Positions have been saved. When you close this dialog, the workforce table will refresh.
              </DialogDescription>
            </DialogHeader>

            {commitResult.imported > 0 ? (
              <div className="flex items-start gap-3 rounded-2xl bg-success/10 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    Imported {commitResult.imported} position{commitResult.imported === 1 ? '' : 's'}
                  </p>
                  <p className="text-[13px] text-muted-foreground mt-0.5 tabular-nums">
                    {commitResult.matchedCount} mapped to registered workers
                    {commitResult.unregisteredCount > 0 &&
                      ` · ${commitResult.unregisteredCount} unregistered appointment${commitResult.unregisteredCount === 1 ? '' : 's'} reserved (activates on registration)`}
                    {commitResult.emailsSent > 0 &&
                      ` · ${commitResult.emailsSent} appointment email${commitResult.emailsSent === 1 ? '' : 's'} sent`}
                    .
                  </p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    {commitResult.skipped.length
                      ? `${commitResult.skipped.length} row${commitResult.skipped.length === 1 ? ' was' : 's were'} skipped below.`
                      : 'All selected entries were imported cleanly.'}
                  </p>
                  {commitResult.unregisteredCount > 0 && (
                    <p className="text-[13px] text-accent-foreground dark:text-primary mt-1.5">
                      Reserved leaders appear on the Executive Roster as “Unregistered · Awaiting registration” until they register.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 p-4">
                <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-destructive">
                    0 positions imported
                  </p>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    None of the positions could be imported. Review any skipped rows below.
                  </p>
                </div>
              </div>
            )}

            {commitResult.emailsSent > 0 && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/10 text-[13px] text-accent-foreground dark:text-primary font-medium">
                <Mail className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Appointment emails were dispatched to {commitResult.emailsSent} leader{commitResult.emailsSent === 1 ? '' : 's'} — registered leaders received dashboard access guidance, and unregistered appointees received a registration invitation.
                </span>
              </div>
            )}

            {commitResult.emailsSkipped > 0 && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-surface-raised text-[13px] text-foreground font-medium">
                <Mail className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
                <span>
                  No duplicate emails sent — {commitResult.emailsSkipped} leader{commitResult.emailsSkipped === 1 ? ' has' : 's have'} already been emailed about this appointment.
                </span>
              </div>
            )}

            {commitResult.skipped.length > 0 && (
              <div className="rounded-xl bg-warning/20 dark:bg-warning/15 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5">
                  <TriangleAlert
                    className="h-4 w-4 shrink-0 text-warning-foreground dark:text-warning"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-warning-foreground dark:text-warning">
                    Skipped rows ({commitResult.skipped.length})
                  </span>
                </div>
                <ul className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/20">
                  {commitResult.skipped.map((reason, i) => (
                    <li key={i} className="text-[13px] text-foreground leading-relaxed break-words pt-1.5 first:pt-0">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-0">
              <Button
                type="button"
                variant="ghost"
                onClick={resetDialog}
                className="min-h-11 md:min-h-10 text-sm font-semibold text-muted-foreground hover:text-foreground w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Import Another File</span>
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setOpen(false)
                  if (commitResult.imported > 0) {
                    router.refresh()
                  }
                }}
                className="min-h-11 md:min-h-10 px-4 font-semibold text-sm w-full sm:w-auto"
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
