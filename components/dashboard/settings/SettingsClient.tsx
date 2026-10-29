'use client'

import * as React from 'react'
import { useState, useTransition, useEffect } from 'react'
import {
  Upload,
  Trash2,
  RefreshCw,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import {
  deleteApprovedWorkerAction,
  importWorkerRosterCsvAction,
  syncMemberDirectoryAction,
  type WorkerRosterCsvRow,
  type WorkerRosterImportResult,
  type MemberDirectorySyncResult,
} from '@/app/actions/worker-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'
import { cn } from '@/lib/utils'

interface WorkerOption {
  _id: string
  fullName: string
  team?: string
  status?: string
}

interface SettingsClientProps {
  workers: WorkerOption[]
  canDelete?: boolean
  canImport?: boolean
}

type SettingsTab = 'import' | 'delete' | 'sync'

/**
 * RFC-4180-style CSV reader: handles quoted fields, escaped quotes, commas and
 * newlines inside quotes, CRLF, and a UTF-8 BOM.
 */
function parseCsvRecords(text: string): string[][] {
  const records: string[][] = []
  const normalized = text.replace(/^\uFEFF/, '')
  let record: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i]

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      record.push(field)
      field = ''
    } else if (char === '\n') {
      record.push(field.replace(/\r$/, ''))
      records.push(record)
      record = []
      field = ''
    } else {
      field += char
    }
  }

  if (field.length > 0 || record.length > 0) {
    record.push(field.replace(/\r$/, ''))
    records.push(record)
  }

  return records
    .map((row) => row.map((cell) => cell.trim()))
    .filter((row) => row.some((cell) => cell.length > 0))
}

export default function SettingsClient({
  workers,
  canDelete = false,
  canImport = false,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('import')
  const [isPending, startTransition] = useTransition()

  // --- CSV Import State ---
  const [parsedRows, setParsedRows] = useState<WorkerRosterCsvRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<WorkerRosterImportResult | null>(null)

  // --- Deletion State ---
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('')
  const [confirmName, setConfirmName] = useState<string>('')
  const [deletePolicy, setDeletePolicy] = useState<'archive' | 'permanent'>('archive')
  const [deleteReason, setDeleteReason] = useState<string>('')

  // --- Sync State ---
  const [syncResult, setSyncResult] = useState<MemberDirectorySyncResult | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncTimestamp, setSyncTimestamp] = useState<string | null>(null)

  const availableTabs: SettingsTab[] = [
    ...(canImport ? (['import'] as const) : []),
    ...(canDelete ? (['delete'] as const) : []),
    ...(canImport || canDelete ? (['sync'] as const) : []),
  ]

  const visibleTabs: SettingsTab[] = availableTabs.length > 0 ? availableTabs : ['sync']

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canImport, canDelete])

  const selectedWorker = workers.find((w) => w._id === selectedWorkerId)
  const isNameConfirmed =
    selectedWorker &&
    confirmName.trim().toLowerCase() === selectedWorker.fullName.trim().toLowerCase()

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setParseError(null)
    setImportResult(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      parseCsv(text)
    }
    reader.readAsText(file)
  }

  const parseCsv = (text: string) => {
    try {
      const records = parseCsvRecords(text)
      if (records.length < 2) {
        setParsedRows([])
        setParseError('CSV must have a header row and at least one data row.')
        return
      }

      const headers = records[0].map((h) => h.trim().toLowerCase())
      const nameIdx = headers.findIndex((h) => h.includes('name'))
      const emailIdx = headers.findIndex((h) => h.includes('email'))
      const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'))
      const teamIdx = headers.findIndex((h) => h.includes('team') || h.includes('dept'))
      const hallIdx = headers.findIndex((h) => h.includes('hall'))

      if (nameIdx === -1 || emailIdx === -1) {
        setParsedRows([])
        setParseError('CSV header must contain "Full Name" (or Name) and "Email" columns.')
        return
      }

      const rows: WorkerRosterCsvRow[] = []
      for (let i = 1; i < records.length; i++) {
        const cols = records[i]
        const fullName = cols[nameIdx]?.trim() || ''
        const email = cols[emailIdx]?.trim() || ''
        if (!fullName || !email) continue

        rows.push({
          fullName,
          email,
          phone: phoneIdx !== -1 ? cols[phoneIdx]?.trim() || undefined : undefined,
          team: teamIdx !== -1 ? cols[teamIdx]?.trim() || undefined : undefined,
          hall: hallIdx !== -1 ? cols[hallIdx]?.trim() || undefined : undefined,
        })
      }

      if (rows.length === 0) {
        setParsedRows([])
        setParseError('No complete rows found. Each row needs a full name and email address.')
        return
      }

      setParsedRows(rows)
      setParseError(null)
    } catch {
      setParsedRows([])
      setParseError('Failed to parse CSV file. Please verify standard formatting.')
    }
  }

  const handleImportSubmit = () => {
    if (parsedRows.length === 0 || !canImport) return

    startTransition(async () => {
      const res = await importWorkerRosterCsvAction(parsedRows)
      if (res.ok) {
        const { importedCount, updatedCount, skippedCount } = res.data
        setImportResult(res.data)
        setParsedRows([])
        setFileName(null)

        if (importedCount + updatedCount > 0) {
          toastSuccess(
            `Roster import complete: ${importedCount} created, ${updatedCount} updated.`
          )
        } else {
          toastError(
            skippedCount > 0
              ? 'No workers were imported. Review the row errors below.'
              : 'No workers were imported.'
          )
        }
      } else {
        toastError(res.error || 'Failed to import worker roster.')
      }
    })
  }

  const handleDeleteSubmit = () => {
    if (!selectedWorker || !isNameConfirmed || !canDelete) return

    startTransition(async () => {
      const res = await deleteApprovedWorkerAction({
        workerId: selectedWorker._id,
        confirmedName: confirmName,
        policy: deletePolicy,
        reason: deleteReason || 'Administrative offboarding',
      })

      if (res.ok) {
        const warning = res.data.warning
        toastSuccess(
          warning ||
            (deletePolicy === 'archive'
              ? `${selectedWorker.fullName} has been archived and permissions revoked.`
              : `${selectedWorker.fullName} was permanently deleted.`)
        )
        setSelectedWorkerId('')
        setConfirmName('')
        setDeleteReason('')
      } else {
        toastError(res.error || 'Failed to delete worker record.')
      }
    })
  }

  const handleMemberSync = () => {
    if (!canImport && !canDelete) return

    startTransition(async () => {
      setSyncError(null)
      setSyncResult(null)
      const res = await syncMemberDirectoryAction()

      if (res.ok) {
        setSyncResult(res.data)
        setSyncTimestamp(new Date().toLocaleString('en-GB', { timeZone: 'Africa/Lagos' }))
        if (res.data.pendingAnomalies === 0) {
          toastSuccess(`Directory sync complete: ${res.data.scanned} records scanned, no anomalies.`)
        } else {
          toastSuccess(
            `Directory sync complete: ${res.data.pendingAnomalies} item${res.data.pendingAnomalies === 1 ? '' : 's'} need attention.`
          )
        }
      } else {
        setSyncError(res.error || 'Member directory sync failed.')
        toastError(res.error || 'Member directory sync failed.')
      }
    })
  }

  const tabClass = (tab: SettingsTab, destructive = false) =>
    cn(
      'flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors',
      activeTab === tab
        ? destructive
          ? 'bg-destructive/10 font-semibold text-destructive'
          : 'bg-primary/10 font-semibold text-primary'
        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
    )

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-muted/50 p-1">
        {visibleTabs.includes('import') && (
          <button type="button" onClick={() => setActiveTab('import')} className={tabClass('import')}>
            <Upload className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">Worker CSV Roster</span>
          </button>
        )}

        {visibleTabs.includes('delete') && (
          <button
            type="button"
            onClick={() => setActiveTab('delete')}
            className={tabClass('delete', true)}
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">Worker Offboarding</span>
          </button>
        )}

        {visibleTabs.includes('sync') && (
          <button type="button" onClick={() => setActiveTab('sync')} className={tabClass('sync')}>
            <RefreshCw className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">Member Directory Sync</span>
          </button>
        )}
      </div>

      {/* Tab 1: Worker CSV Roster Import */}
      {activeTab === 'import' && canImport && (
        <section className="space-y-5 rounded-2xl bg-card p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Worker CSV Roster Import</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Upload a bulk CSV of fellowship workers to create or update roster records and team allocations.
            </p>
          </div>

          <div className="space-y-3 rounded-xl bg-muted/30 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="csv-upload"
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-3 text-sm font-semibold text-primary hover:underline focus-within:ring-2 focus-within:ring-ring"
              >
                Choose worker CSV file
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Required columns: Full Name, Email. Optional: Phone, Team, Hall.
                {fileName ? ` Selected: ${fileName}` : ''}
              </p>
            </div>
          </div>

          {parseError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {importResult && (
            <div className="space-y-3 rounded-xl bg-muted/40 p-4">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  {importResult.importedCount + importResult.updatedCount} processed
                </span>
                <span className="text-xs text-muted-foreground">
                  {importResult.importedCount} created · {importResult.updatedCount} updated ·{' '}
                  {importResult.skippedCount} skipped
                </span>
              </div>
              {importResult.errors.length > 0 && (
                <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {importResult.errors.map((error, index) => (
                    <li key={index} className="flex gap-1.5">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-[var(--brand-gold)]" />
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <span className="text-sm font-medium text-foreground">
                  Ready to import {parsedRows.length} worker{parsedRows.length === 1 ? '' : 's'}
                </span>
                <Button
                  onClick={handleImportSubmit}
                  disabled={isPending || !canImport}
                  className="min-h-11 w-full px-6 sm:w-auto"
                >
                  {isPending ? 'Importing…' : `Confirm & Ingest ${parsedRows.length} Workers`}
                </Button>
              </div>

              <div className="max-h-64 divide-y divide-border/20 overflow-y-auto rounded-xl bg-muted/20 text-xs">
                {parsedRows.slice(0, 15).map((row, idx) => (
                  <div
                    key={`${row.email}-${idx}`}
                    className="flex min-w-0 flex-col justify-between gap-1 p-2.5 px-3 sm:flex-row sm:items-center"
                  >
                    <span className="truncate font-medium text-foreground">{row.fullName}</span>
                    <span className="truncate text-muted-foreground">{row.email}</span>
                    <span className="shrink-0 text-muted-foreground">{row.team || 'Unassigned'}</span>
                  </div>
                ))}
                {parsedRows.length > 15 && (
                  <div className="bg-muted/20 p-2 text-center text-muted-foreground">
                    + {parsedRows.length - 15} more rows
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Worker Deletion & Offboarding */}
      {activeTab === 'delete' && canDelete && (
        <section className="space-y-5 rounded-2xl bg-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Offboard / Delete Approved Worker</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Archiving revokes leadership positions and team duties immediately and removes the
                leader from the Executives roster. Permanent deletion also erases the worker record
                and their linked sign-in account.
              </p>
            </div>
          </div>

          <div className="max-w-lg space-y-4">
            <div>
              <label htmlFor="worker-select" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select Worker Record
              </label>
              <select
                id="worker-select"
                value={selectedWorkerId}
                onChange={(e) => {
                  setSelectedWorkerId(e.target.value)
                  setConfirmName('')
                }}
                className="h-11 w-full rounded-xl bg-muted/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Choose approved worker —</option>
                {workers.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.fullName} {w.team ? `(${w.team})` : ''}
                  </option>
                ))}
              </select>
              {workers.length === 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  No approved workers are currently available to offboard.
                </p>
              )}
            </div>

            {selectedWorker && (
              <>
                <div className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Offboarding Policy
                  </span>
                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-muted/30 p-3">
                      <input
                        type="radio"
                        name="policy"
                        value="archive"
                        checked={deletePolicy === 'archive'}
                        onChange={() => setDeletePolicy('archive')}
                      />
                      <div>
                        <span className="block font-medium">Archive & Revoke</span>
                        <span className="text-xs text-muted-foreground">Keep attendance, revoke duty</span>
                      </div>
                    </label>

                    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-destructive/5 p-3">
                      <input
                        type="radio"
                        name="policy"
                        value="permanent"
                        checked={deletePolicy === 'permanent'}
                        onChange={() => setDeletePolicy('permanent')}
                      />
                      <div>
                        <span className="block font-medium text-destructive">Permanent Purge</span>
                        <span className="text-xs text-muted-foreground">Erase from database</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="delete-reason" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Offboarding Reason
                  </label>
                  <Input
                    id="delete-reason"
                    placeholder="e.g. Graduated, relocated, voluntary resignation"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2 rounded-xl bg-destructive/10 p-3.5">
                  <p className="text-xs font-medium text-destructive">
                    Type <strong>{selectedWorker.fullName}</strong> below to confirm removal:
                  </p>
                  <Input
                    placeholder={selectedWorker.fullName}
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    className="h-11 rounded-xl border-destructive/40 bg-background"
                    aria-label={`Type ${selectedWorker.fullName} to confirm`}
                  />
                </div>

                <Button
                  variant="destructive"
                  onClick={handleDeleteSubmit}
                  disabled={isPending || !isNameConfirmed}
                  className="min-h-11 w-full"
                >
                  {isPending
                    ? 'Processing…'
                    : deletePolicy === 'archive'
                    ? 'Archive Worker Record'
                    : 'Permanently Delete Worker'}
                </Button>
              </>
            )}
          </div>
        </section>
      )}

      {/* Tab 3: Member Directory Sync */}
      {activeTab === 'sync' && (
        <section className="space-y-5 rounded-2xl bg-card p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Member Directory Sync</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Audit registered congregation records against the EXCO operational database and surface
              missing contact details, unassigned members, and memberships awaiting verification.
            </p>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-xl bg-muted/30 p-4 sm:flex-row sm:items-center">
            <div>
              <span className="block text-sm font-semibold text-foreground">Live member directory audit</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {syncTimestamp
                  ? `Last checked: ${syncTimestamp} · Lagos time`
                  : 'Runs on demand. Registration changes are picked up in real time.'}
              </span>
            </div>
            <Button
              onClick={handleMemberSync}
              disabled={isPending || (!canImport && !canDelete)}
              className="min-h-11 shrink-0 px-5"
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', isPending && 'animate-spin')} />
              Run Member Sync
            </Button>
          </div>

          {syncError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3.5 text-sm font-medium text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{syncError}</span>
            </div>
          )}

          {syncResult && (
            <div className="space-y-3 rounded-xl bg-muted/40 p-4">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  {syncResult.scanned} records scanned
                </span>
                <span
                  className={cn(
                    'text-xs font-medium',
                    syncResult.pendingAnomalies > 0
                      ? 'text-[var(--brand-gold)]'
                      : 'text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {syncResult.pendingAnomalies > 0
                    ? `${syncResult.pendingAnomalies} item${syncResult.pendingAnomalies === 1 ? '' : 's'} need attention`
                    : 'No pending anomalies'}
                </span>
              </div>

              {syncResult.details.length > 0 && (
                <ul className="max-h-56 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {syncResult.details.map((detail, index) => (
                    <li key={index} className="flex gap-1.5">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-[var(--brand-gold)]" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {visibleTabs.length === 0 && (
        <div className="rounded-2xl bg-card p-6 text-sm text-muted-foreground">
          Your role does not have access to any Settings tools.
        </div>
      )}
    </div>
  )
}
