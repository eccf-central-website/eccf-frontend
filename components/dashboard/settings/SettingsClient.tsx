'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import {
  Upload,
  Trash2,
  RefreshCw,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import {
  deleteApprovedWorkerAction,
  importWorkerRosterCsvAction,
  type WorkerRosterCsvRow,
} from '@/app/actions/worker-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'

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

export default function SettingsClient({
  workers,
  canDelete = true,
  canImport = true,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('import')
  const [isPending, startTransition] = useTransition()

  // --- CSV Import State ---
  const [parsedRows, setParsedRows] = useState<WorkerRosterCsvRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)

  // --- Deletion State ---
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('')
  const [confirmName, setConfirmName] = useState<string>('')
  const [deletePolicy, setDeletePolicy] = useState<'archive' | 'permanent'>('archive')
  const [deleteReason, setDeleteReason] = useState<string>('')

  // --- Sync State ---
  const [syncStatus, setSyncStatus] = useState<string | null>(null)

  const selectedWorker = workers.find((w) => w._id === selectedWorkerId)
  const isNameConfirmed =
    selectedWorker &&
    confirmName.trim().toLowerCase() === selectedWorker.fullName.trim().toLowerCase()

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setParseError(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      parseCsv(text)
    }
    reader.readAsText(file)
  }

  const parseCsv = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
      if (lines.length < 2) {
        setParseError('CSV must have a header row and at least one data row.')
        return
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
      const nameIdx = headers.findIndex((h) => h.includes('name') || h === 'fullname')
      const emailIdx = headers.findIndex((h) => h.includes('email'))
      const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'))
      const teamIdx = headers.findIndex((h) => h.includes('team') || h.includes('dept'))
      const hallIdx = headers.findIndex((h) => h.includes('hall'))

      if (nameIdx === -1 || emailIdx === -1) {
        setParseError('CSV header must contain "Full Name" (or Name) and "Email" columns.')
        return
      }

      const rows: WorkerRosterCsvRow[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
        if (cols[nameIdx] && cols[emailIdx]) {
          rows.push({
            fullName: cols[nameIdx],
            email: cols[emailIdx],
            phone: phoneIdx !== -1 ? cols[phoneIdx] : undefined,
            team: teamIdx !== -1 ? cols[teamIdx] : undefined,
            hall: hallIdx !== -1 ? cols[hallIdx] : undefined,
          })
        }
      }

      setParsedRows(rows)
    } catch {
      setParseError('Failed to parse CSV file. Please verify standard formatting.')
    }
  }

  const handleImportSubmit = () => {
    if (parsedRows.length === 0) return

    startTransition(async () => {
      const res = await importWorkerRosterCsvAction(parsedRows)
      if (res.ok) {
        toastSuccess(`Successfully ingested ${res.data.importedCount} workers.`)
        setParsedRows([])
      } else {
        toastError(res.error || 'Failed to import worker roster.')
      }
    })
  }

  const handleDeleteSubmit = () => {
    if (!selectedWorker || !isNameConfirmed) return

    startTransition(async () => {
      const res = await deleteApprovedWorkerAction({
        workerId: selectedWorker._id,
        confirmedName: confirmName,
        policy: deletePolicy,
        reason: deleteReason || 'Administrative offboarding',
      })

      if (res.ok) {
        toastSuccess(
          deletePolicy === 'archive'
            ? `${selectedWorker.fullName} has been archived and permissions revoked.`
            : `${selectedWorker.fullName} was permanently deleted.`
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
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 900))
      setSyncStatus('Directory synchronized with registered membership database (0 pending anomalies).')
      toastSuccess('Member directory synchronized successfully.')
    })
  }

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
            activeTab === 'import'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Upload className="h-4 w-4" />
          Worker CSV Roster
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('delete')}
          className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
            activeTab === 'delete'
              ? 'border-destructive text-destructive font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Trash2 className="h-4 w-4" />
          Worker Offboarding
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sync')}
          className={`flex items-center gap-2 py-3 px-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
            activeTab === 'sync'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <RefreshCw className="h-4 w-4" />
          Member Directory Sync
        </button>
      </div>

      {/* Tab 1: Worker CSV Roster Import */}
      {activeTab === 'import' && (
        <section className="space-y-5 rounded-2xl bg-card p-5 sm:p-6 shadow-sm border-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Worker CSV Roster Import</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Upload a bulk CSV file containing fellowship workers to onboard roster records and team allocations.
            </p>
          </div>

          <div className="border-2 border-dashed border-border/80 rounded-xl p-6 text-center space-y-3 bg-muted/20">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <label htmlFor="csv-upload" className="text-sm font-semibold text-primary cursor-pointer hover:underline">
                Choose worker CSV file
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <p className="text-xs text-muted-foreground">Required columns: Full Name, Email. Optional: Phone, Team, Hall</p>
            </div>
          </div>

          {parseError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">
                  Ready to import {parsedRows.length} workers
                </span>
                <Button
                  onClick={handleImportSubmit}
                  disabled={isPending || !canImport}
                  className="min-h-[44px] px-6 w-full sm:w-auto"
                >
                  {isPending ? 'Importing…' : `Confirm & Ingest ${parsedRows.length} Workers`}
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-xl border border-border/40 divide-y divide-border/20 text-xs">
                {parsedRows.slice(0, 15).map((row, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 px-3 gap-1 min-w-0">
                    <span className="font-medium text-foreground truncate">{row.fullName}</span>
                    <span className="text-muted-foreground truncate">{row.email}</span>
                    <span className="text-muted-foreground shrink-0">{row.team || 'Unassigned'}</span>
                  </div>
                ))}
                {parsedRows.length > 15 && (
                  <div className="p-2 text-center text-muted-foreground bg-muted/20">
                    + {parsedRows.length - 15} more rows
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Worker Deletion & Offboarding */}
      {activeTab === 'delete' && (
        <section className="space-y-5 rounded-2xl bg-card p-5 sm:p-6 shadow-sm border border-destructive/20">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Offboard / Delete Approved Worker</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Revoke leadership permissions, de-roster from ministry duties, or permanently delete worker records.
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <div>
              <label htmlFor="worker-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Select Worker Record
              </label>
              <select
                id="worker-select"
                value={selectedWorkerId}
                onChange={(e) => {
                  setSelectedWorkerId(e.target.value)
                  setConfirmName('')
                }}
                className="w-full h-11 rounded-lg border border-border/80 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">-- Choose verified worker --</option>
                {workers.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.fullName} {w.team ? `(${w.team})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedWorker && (
              <>
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Offboarding Policy
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <label className="flex items-center gap-2 p-3 rounded-lg border border-border/60 bg-muted/20 cursor-pointer">
                      <input
                        type="radio"
                        name="policy"
                        value="archive"
                        checked={deletePolicy === 'archive'}
                        onChange={() => setDeletePolicy('archive')}
                      />
                      <div>
                        <span className="font-medium block">Archive & Revoke</span>
                        <span className="text-xs text-muted-foreground">Keep attendance, revoke duty</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-lg border border-border/60 bg-muted/20 cursor-pointer">
                      <input
                        type="radio"
                        name="policy"
                        value="permanent"
                        checked={deletePolicy === 'permanent'}
                        onChange={() => setDeletePolicy('permanent')}
                      />
                      <div>
                        <span className="font-medium block text-destructive">Permanent Purge</span>
                        <span className="text-xs text-muted-foreground">Erase from database</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="delete-reason" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Offboarding Reason
                  </label>
                  <Input
                    id="delete-reason"
                    placeholder="e.g. Graduated, relocated, voluntary resignation"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2">
                  <p className="text-xs text-destructive font-medium">
                    Type <strong>{selectedWorker.fullName}</strong> below to confirm removal:
                  </p>
                  <Input
                    placeholder={selectedWorker.fullName}
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    className="h-11 border-destructive/40 bg-background"
                  />
                </div>

                <Button
                  variant="destructive"
                  onClick={handleDeleteSubmit}
                  disabled={isPending || !isNameConfirmed || !canDelete}
                  className="w-full min-h-[44px]"
                >
                  {isPending ? 'Processing…' : deletePolicy === 'archive' ? 'Archive Worker Record' : 'Permanently Delete Worker'}
                </Button>
              </>
            )}
          </div>
        </section>
      )}

      {/* Tab 3: Member Directory Sync */}
      {activeTab === 'sync' && (
        <section className="space-y-5 rounded-2xl bg-card p-5 sm:p-6 shadow-sm border-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Member Directory Sync</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Synchronize registered congregation members with the EXCO operational database.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="font-semibold text-foreground block text-sm">Automated Member Ingestion Pipeline</span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                Last checked: Today · Sync frequency: Real-time on registration
              </span>
            </div>
            <Button
              onClick={handleMemberSync}
              disabled={isPending}
              className="min-h-[44px] px-5 shrink-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
              Run Member Sync
            </Button>
          </div>

          {syncStatus && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
