'use client'

import React, { useState, useEffect, useMemo, useTransition, useRef } from 'react'
import {
  CheckCircle2,
  Circle,
  Search,
  Printer,
  RefreshCw,
  Plus,
  RotateCcw,
  User,
  ChevronDown,
  ChevronUp,
  Bug,
  Sparkles,
  ExternalLink,
  Lock,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  QA_TEST_SUITES,
  QA_TEST_CASES,
  type QATestCase,
  type QATestItemState,
  type QADefect,
  type QAChecklistDoc,
} from '@/lib/qa/test-suites'
import {
  toggleQATestItem,
  addQADefect,
  updateQADefectStatus,
  resetAllQATests,
  getQAChecklist,
  registerOrVerifyTester,
  validateTesterSession,
  verifyLeadPin,
} from '@/app/actions/qa-actions'

interface QAPortalProps {
  initialData: QAChecklistDoc
}

export default function QAPortal({ initialData }: QAPortalProps) {
  // Centralized state
  const [testItems, setTestItems] = useState<Record<string, QATestItemState>>(initialData.testItems || {})
  const [defects, setDefects] = useState<QADefect[]>(initialData.defects || [])
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date())

  // In-flight mutation tracking to prevent background polling from clobbering active clicks
  const pendingMutationsRef = useRef<Map<string, { targetChecked: boolean; timestamp: number }>>(new Map())

  // Tester identity & session
  const [testerName, setTesterName] = useState<string>('')
  const [testerToken, setTesterToken] = useState<string>('')
  const [, setTesterId] = useState<string>('')
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false)
  const [tempNameInput, setTempNameInput] = useState<string>('')
  const [tempPinInput, setTempPinInput] = useState<string>('')
  const [showPin, setShowPin] = useState<boolean>(false)
  const [regError, setRegError] = useState<string>('')
  const [isRegistering, setIsRegistering] = useState<boolean>(false)

  // QA Lead Override
  const [isLeadOverride, setIsLeadOverride] = useState<boolean>(false)
  const [leadPin, setLeadPin] = useState<string>('')
  const [isLeadModalOpen, setIsLeadModalOpen] = useState<boolean>(false)
  const [leadModalPinInput, setLeadModalPinInput] = useState<string>('')
  const [leadModalError, setLeadModalError] = useState<string>('')

  // Reset Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false)
  const [resetLeadPinInput, setResetLeadPinInput] = useState<string>('')
  const [resetError, setResetError] = useState<string>('')
  const [isResetting, setIsResetting] = useState<boolean>(false)

  // UI Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [selectedSuiteId, setSelectedSuiteId] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [collapsedSuites, setCollapsedSuites] = useState<Record<number, boolean>>({})

  // Defect Modal
  const [isDefectModalOpen, setIsDefectModalOpen] = useState<boolean>(false)
  const [defectTitle, setDefectTitle] = useState('')
  const [defectModule, setDefectModule] = useState('Public Website')
  const [defectSeverity, setDefectSeverity] = useState<'Blocker' | 'High' | 'Med' | 'Low'>('Med')
  const [defectNotes, setDefectNotes] = useState('')

  // Loading & Transitions
  const [, startTransition] = useTransition()
  const [isSyncing, setIsSyncing] = useState(false)

  // 1. Initialize Tester Session from LocalStorage
  useEffect(() => {
    const savedName = localStorage.getItem('eccf_qa_tester_name')
    const savedToken = localStorage.getItem('eccf_qa_tester_token')
    const savedId = localStorage.getItem('eccf_qa_tester_id')

    if (savedName && savedToken) {
      setTesterName(savedName)
      setTesterToken(savedToken)
      if (savedId) setTesterId(savedId)

      // Silently validate session in background
      validateTesterSession({ testerName: savedName, testerToken: savedToken }).then((res) => {
        if (!res.valid) {
          toast.error(`Session for ${savedName} needs verification. Please enter your 4-digit PIN.`)
          setTempNameInput(savedName)
          setIsNameModalOpen(true)
        }
      })
    } else {
      setIsNameModalOpen(true)
    }
  }, [])

  // Handle Register or Verify Name + PIN
  const handleRegisterOrVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError('')

    const cleanName = tempNameInput.trim()
    const cleanPin = tempPinInput.trim()

    if (!cleanName || cleanName.length < 2) {
      setRegError('Please enter a valid name (at least 2 letters).')
      return
    }
    if (!/^\d{4}$/.test(cleanPin)) {
      setRegError('Please enter a 4-digit numeric PIN (e.g. 1234).')
      return
    }

    setIsRegistering(true)
    try {
      const res = await registerOrVerifyTester({ name: cleanName, pin: cleanPin })
      if (res.success && res.testerName && res.testerToken) {
        localStorage.setItem('eccf_qa_tester_name', res.testerName)
        localStorage.setItem('eccf_qa_tester_token', res.testerToken)
        if (res.testerId) localStorage.setItem('eccf_qa_tester_id', res.testerId)

        setTesterName(res.testerName)
        setTesterToken(res.testerToken)
        if (res.testerId) setTesterId(res.testerId)

        setIsNameModalOpen(false)
        setTempPinInput('')
        setRegError('')

        if (res.isNew) {
          toast.success(`Welcome, ${res.testerName}! Your 4-digit PIN is set and your test ticks are protected.`)
        } else {
          toast.success(`Welcome back, ${res.testerName}! Verified successfully.`)
        }
      } else {
        setRegError(res.error || 'Failed to register. Please try again.')
      }
    } catch {
      setRegError('Connection error. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }

  // 2. Poll for updates every 15s to keep all phones/devices in sync without overwriting in-flight actions
  const refreshLiveState = async (showToast = false) => {
    setIsSyncing(true)
    try {
      const fresh = await getQAChecklist()
      if (fresh) {
        setTestItems((prev) => {
          const merged: Record<string, QATestItemState> = { ...fresh.testItems }
          const pending = pendingMutationsRef.current

          // Preserve any item currently in flight or updated locally more recently
          for (const [key, localItem] of Object.entries(prev)) {
            const cleanKey = key.trim().replace(/-/g, '_')
            const isPending = pending.has(cleanKey) || pending.has(key)

            if (isPending) {
              // Active in-flight local click wins
              merged[key] = localItem
              merged[cleanKey] = localItem
              continue
            }

            const serverItem = merged[cleanKey] || merged[key]
            if (!serverItem) {
              merged[key] = localItem
            } else {
              const localTime = new Date(localItem.testedAt || 0).getTime()
              const serverTime = new Date(serverItem.testedAt || 0).getTime()
              // If local action occurred more recently than this server snapshot, preserve local
              if (localTime > serverTime) {
                merged[key] = localItem
                merged[cleanKey] = localItem
              }
            }
          }
          return merged
        })
        setDefects(fresh.defects || [])
        setLastSyncTime(new Date())
        if (showToast) toast.success('Checklist synced with team updates!')
      }
    } catch {
      if (showToast) toast.error('Could not sync with central database.')
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      refreshLiveState(false)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  // 3. Toggle Test Item (Optimistic + Direct Server Action + Retries + Tamper Protection)
  const handleToggle = (testId: string) => {
    const cleanId = testId.trim()
    const underscoreId = cleanId.replace(/-/g, '_')
    const hyphenId = cleanId.replace(/_/g, '-')

    const currentItem = testItems[cleanId] || testItems[underscoreId] || testItems[hyphenId]
    const current = Boolean(currentItem?.checked)
    const ownerName = currentItem?.testerName?.trim() || ''

    // Require tester registration
    if (!testerName || !testerToken) {
      setIsNameModalOpen(true)
      toast.error('Please enter your name and 4-digit PIN to start testing.')
      return
    }

    // STRICT TAMPER PROTECTION:
    // If test is currently checked by another person, prevent editing/unchecking
    if (current && ownerName && ownerName.toLowerCase() !== testerName.toLowerCase() && !isLeadOverride) {
      toast.error(`🔒 Locked: Verified by ${ownerName}`, {
        description: `Only ${ownerName} (or a QA Lead) can change or untick this test report.`,
      })
      return
    }

    const nextChecked = !current
    const activeName = isLeadOverride ? `Lead Override (${testerName})` : testerName
    const now = new Date().toISOString()

    const newItemState: QATestItemState = {
      checked: nextChecked,
      testerName: activeName,
      testedAt: now,
    }

    // Register this mutation as in-flight
    pendingMutationsRef.current.set(underscoreId, { targetChecked: nextChecked, timestamp: Date.now() })
    pendingMutationsRef.current.set(cleanId, { targetChecked: nextChecked, timestamp: Date.now() })

    // Optimistic UI update immediately for all key representations
    setTestItems((prev) => ({
      ...prev,
      [cleanId]: newItemState,
      [underscoreId]: newItemState,
      [hyphenId]: newItemState,
    }))

    // Execute server action asynchronously
    ;(async () => {
      try {
        const res = await toggleQATestItem({
          testId: cleanId,
          checked: nextChecked,
          testerName,
          testerToken,
          leadPin: isLeadOverride ? leadPin : undefined,
        })

        if (!res.success) {
          // Rollback on server failure
          const pending = pendingMutationsRef.current.get(underscoreId)
          if (pending && pending.targetChecked === nextChecked) {
            setTestItems((prev) => ({
              ...prev,
              [cleanId]: currentItem || { checked: current },
              [underscoreId]: currentItem || { checked: current },
              [hyphenId]: currentItem || { checked: current },
            }))
            toast.error(res.error || 'Sync issue saving checkmark. Please click again.')
          }
        }
      } catch (err) {
        console.error('[handleToggle] Error during QA toggle:', err)
        // Rollback
        setTestItems((prev) => ({
          ...prev,
          [cleanId]: currentItem || { checked: current },
          [underscoreId]: currentItem || { checked: current },
          [hyphenId]: currentItem || { checked: current },
        }))
        toast.error('Network error. Check connection and retry.')
      } finally {
        // Clear pending registration
        pendingMutationsRef.current.delete(underscoreId)
        pendingMutationsRef.current.delete(cleanId)
      }
    })()
  }

  // 4. Submit Defect
  const handleAddDefect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!defectTitle.trim()) return

    const activeName = testerName || 'Anonymous Tester'
    const newDefectTemp: QADefect = {
      _key: 'temp-' + Date.now(),
      title: defectTitle.trim(),
      module: defectModule,
      severity: defectSeverity,
      status: 'Open',
      reportedBy: activeName,
      reportedAt: new Date().toISOString(),
      notes: defectNotes.trim(),
    }

    setDefects((prev) => [newDefectTemp, ...prev])
    setIsDefectModalOpen(false)
    setDefectTitle('')
    setDefectNotes('')

    startTransition(async () => {
      const res = await addQADefect({
        title: newDefectTemp.title,
        module: newDefectTemp.module,
        severity: newDefectTemp.severity,
        reportedBy: activeName,
        notes: newDefectTemp.notes,
      })

      if (res.success && res.defect) {
        toast.success('Defect logged to team board!')
        refreshLiveState(false)
      } else {
        toast.error('Failed to log defect. Please retry.')
      }
    })
  }

  // 5. Update Defect Status
  const handleStatusChange = async (defectKey: string, nextStatus: 'Open' | 'In Progress' | 'Resolved') => {
    setDefects((prev) =>
      prev.map((d) => (d._key === defectKey ? { ...d, status: nextStatus } : d))
    )

    startTransition(async () => {
      const res = await updateQADefectStatus({
        defectKey,
        status: nextStatus,
        updatedBy: testerName || 'QA Team',
      })
      if (res.success) {
        toast.success(`Status updated to ${nextStatus}`)
      }
    })
  }

  // 6. Reset Checklist (Protected with QA Lead Passcode)
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError('')
    const cleanPin = resetLeadPinInput.trim()

    if (!cleanPin) {
      setResetError('Please enter the QA Lead Passcode to confirm reset.')
      return
    }

    setIsResetting(true)
    try {
      const res = await resetAllQATests({
        testerName,
        leadPin: cleanPin,
      })

      if (res.success) {
        setTestItems({})
        setIsResetModalOpen(false)
        setResetLeadPinInput('')
        toast.success('Checklist reset for all testers.')
        refreshLiveState(false)
      } else {
        setResetError(res.error || 'Incorrect Lead Passcode.')
      }
    } catch {
      setResetError('Connection error during reset.')
    } finally {
      setIsResetting(false)
    }
  }

  // 7. Toggle Lead Override Mode
  const handleLeadOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLeadModalError('')
    const cleanPin = leadModalPinInput.trim()

    if (!cleanPin) {
      setLeadModalError('Please enter the QA Lead Passcode.')
      return
    }

    const res = await verifyLeadPin(cleanPin)
    if (res.success) {
      setIsLeadOverride(true)
      setLeadPin(cleanPin)
      setIsLeadModalOpen(false)
      setLeadModalPinInput('')
      toast.success('QA Lead Override enabled! You can now modify any test.')
    } else {
      setLeadModalError('Incorrect QA Lead Passcode.')
    }
  }

  const handleDeactivateLeadOverride = () => {
    setIsLeadOverride(false)
    setLeadPin('')
    toast.info('QA Lead Override deactivated.')
  }

  // Metrics
  const totalTests = QA_TEST_CASES.length
  const completedCount = useMemo(() => {
    return QA_TEST_CASES.filter((tc) => {
      const item = testItems[tc.id] || testItems[tc.id.replace(/-/g, '_')] || testItems[tc.id.replace(/_/g, '-')]
      return Boolean(item?.checked)
    }).length
  }, [testItems])

  const completionPercentage = Math.round((completedCount / totalTests) * 100)

  // Contributor Breakdown
  const contributorStats = useMemo(() => {
    const stats: Record<string, number> = {}
    QA_TEST_CASES.forEach((tc) => {
      const item = testItems[tc.id] || testItems[tc.id.replace(/-/g, '_')] || testItems[tc.id.replace(/_/g, '-')]
      if (item?.checked && item.testerName) {
        const clean = item.testerName.replace(/^Lead Override \((.*?)\)$/, '$1')
        stats[clean] = (stats[clean] || 0) + 1
      }
    })
    return Object.entries(stats).sort((a, b) => b[1] - a[1])
  }, [testItems])

  // Filtered Test Cases
  const filteredCases = useMemo(() => {
    return QA_TEST_CASES.filter((tc) => {
      // Status filter
      const item = testItems[tc.id] || testItems[tc.id.replace(/-/g, '_')] || testItems[tc.id.replace(/_/g, '-')]
      const isChecked = Boolean(item?.checked)
      if (statusFilter === 'pending' && isChecked) return false
      if (statusFilter === 'completed' && !isChecked) return false

      // Suite filter
      if (selectedSuiteId !== 'all' && tc.suiteId !== selectedSuiteId) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const text = `${tc.title} ${tc.description} ${tc.section} ${tc.tag || ''}`.toLowerCase()
        if (!text.includes(q)) return false
      }

      return true
    })
  }, [statusFilter, selectedSuiteId, searchQuery, testItems])

  const groupedBySuite = useMemo(() => {
    const map = new Map<number, QATestCase[]>()
    QA_TEST_SUITES.forEach((s) => map.set(s.id, []))
    filteredCases.forEach((tc) => {
      const list = map.get(tc.suiteId) || []
      list.push(tc)
      map.set(tc.suiteId, list)
    })
    return map
  }, [filteredCases])

  const toggleSuiteCollapse = (suiteId: number) => {
    setCollapsedSuites((prev) => ({ ...prev, [suiteId]: !prev[suiteId] }))
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 sm:pb-36">

      {/* Sticky Top Control Header — Mobile First */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 py-2.5 sm:px-6 sm:py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-col gap-2.5">

          {/* Top Row: Brand, Site Shortcut & User Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos/ECCF LOGO.png"
                alt="ECCF"
                className="h-8 w-8 object-contain shrink-0 rounded-full bg-white shadow-2xs"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <h1 className="text-sm sm:text-base font-bold text-slate-950 truncate">
                    ECCF QA Live Testing Portal
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    Open Live Site <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                  <span>·</span>
                  <a
                    href="/dashboard/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    Exco Portal <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Active Tester Pill with Lock Icon */}
              <button
                type="button"
                onClick={() => {
                  setTempNameInput(testerName)
                  setTempPinInput('')
                  setRegError('')
                  setIsNameModalOpen(true)
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  testerName
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100/70'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
                title="Tap to switch tester or update PIN"
              >
                {testerName ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <User className="h-3.5 w-3.5 text-blue-600" />
                )}
                <span className="max-w-[85px] sm:max-w-[130px] truncate">
                  {testerName ? testerName : 'Set Name'}
                </span>
                {testerName && <Lock className="h-2.5 w-2.5 text-emerald-600/70 shrink-0" />}
              </button>

              {/* Lead Override Indicator if Active */}
              {isLeadOverride && (
                <button
                  type="button"
                  onClick={handleDeactivateLeadOverride}
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-purple-300 bg-purple-100 text-purple-900 text-xs font-bold shadow-2xs hover:bg-purple-200"
                  title="Click to turn off QA Lead Override"
                >
                  <KeyRound className="h-3 w-3 text-purple-700" />
                  <span>Lead Mode</span>
                  <span className="text-[10px] text-purple-600">✕</span>
                </button>
              )}

              {/* Refresh / Sync Button */}
              <button
                type="button"
                onClick={() => refreshLiveState(true)}
                disabled={isSyncing}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                title="Sync live changes from team"
                aria-label="Refresh live state"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Progress Bar & Readiness Gauge */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span>Team QA Readiness</span>
                <span className="text-[10px] font-normal text-slate-500">
                  (Auto-syncs live · Protected reports)
                </span>
              </span>
              <span className="text-blue-700 font-mono">
                {completedCount} / {totalTests} ({completionPercentage}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Horizontal Scrollable Status Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-0.5 -mx-1 px-1">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Tests ({totalTests})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pending ({totalTests - completedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Passed ({completedCount})
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-3.5 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">

        {/* Search Bar & Quick Suite Dropdown */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests (e.g. phone, encryption, hall_rep)..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-xs"
            />
          </div>

          <select
            value={selectedSuiteId}
            onChange={(e) => setSelectedSuiteId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-xs"
          >
            <option value="all">All Suites (6 Categories)</option>
            {QA_TEST_SUITES.map((s) => (
              <option key={s.id} value={s.id}>
                Suite {s.id}: {s.name.replace(/`.*?`/g, '')}
              </option>
            ))}
          </select>
        </div>

        {/* Live Contributor Avatars / Stats */}
        {contributorStats.length > 0 && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 sm:p-4 text-xs">
            <div className="font-bold text-blue-950 mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>Active Testing Team Contributors:</span>
              </div>
              <span className="text-[11px] font-normal text-blue-700">
                Ticks are locked to whoever verified them
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {contributorStats.map(([name, count]) => {
                const isCurrent = testerName && name.toLowerCase() === testerName.toLowerCase()
                return (
                  <span
                    key={name}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shadow-2xs border transition-all ${
                      isCurrent
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold ring-1 ring-emerald-400/50'
                        : 'bg-white border-blue-200 text-blue-900'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isCurrent ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    <span>{name}:</span>
                    <strong>{count} tests</strong>
                    {isCurrent && <span className="text-[10px] text-emerald-700 font-normal">(You)</span>}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Test Suites Accordions */}
        <div className="space-y-4">
          {QA_TEST_SUITES.map((suite) => {
            const suiteCases = groupedBySuite.get(suite.id) || []
            if (suiteCases.length === 0 && (selectedSuiteId !== 'all' || searchQuery)) return null

            const isCollapsed = collapsedSuites[suite.id] || false
            const suiteTotal = QA_TEST_CASES.filter((c) => c.suiteId === suite.id).length
            const suitePassed = QA_TEST_CASES.filter((c) => {
              if (c.suiteId !== suite.id) return false
              const item = testItems[c.id] || testItems[c.id.replace(/-/g, '_')] || testItems[c.id.replace(/_/g, '-')]
              return Boolean(item?.checked)
            }).length
            const isAllPassed = suiteTotal > 0 && suitePassed === suiteTotal

            return (
              <div
                key={suite.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all"
              >
                {/* Suite Header Card */}
                <button
                  type="button"
                  onClick={() => toggleSuiteCollapse(suite.id)}
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-600 text-xs sm:text-sm font-bold text-white shrink-0">
                      {suite.id}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {suite.name}
                      </h2>
                      <span className="text-[11px] font-medium text-slate-500 block">
                        {suitePassed} of {suiteTotal} passed ({Math.round((suitePassed / (suiteTotal || 1)) * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isAllPassed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Suite Passed</span>
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                        {suitePassed}/{suiteTotal}
                      </span>
                    )}
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Suite Test Items */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100 p-1 sm:p-2">
                    {suiteCases.length === 0 ? (
                      <div className="p-5 text-center text-xs text-slate-500">
                        {statusFilter === 'completed' && suitePassed === 0 ? (
                          <div className="space-y-1.5">
                            <p>No tests marked as passed in this suite yet.</p>
                            <button
                              type="button"
                              onClick={() => setStatusFilter('all')}
                              className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                            >
                              Show All Tests ({suiteTotal}) →
                            </button>
                          </div>
                        ) : (
                          'No tests match current filter criteria.'
                        )}
                      </div>
                    ) : (
                      suiteCases.map((tc) => {
                        const itemState =
                          testItems[tc.id] ||
                          testItems[tc.id.replace(/-/g, '_')] ||
                          testItems[tc.id.replace(/_/g, '-')]
                        const isChecked = Boolean(itemState?.checked)
                        const rawOwner = itemState?.testerName?.trim() || ''
                        const isMine =
                          isChecked &&
                          Boolean(testerName) &&
                          rawOwner.toLowerCase() === testerName.trim().toLowerCase()
                        const isLockedByOther = isChecked && !isMine && !isLeadOverride

                        return (
                          <div
                            key={tc.id}
                            onClick={() => handleToggle(tc.id)}
                            className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-xl transition-all select-none ${
                              isLockedByOther
                                ? 'bg-slate-50/90 border border-slate-200/80 cursor-not-allowed hover:bg-slate-100/80 opacity-90'
                                : isMine
                                ? 'bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100/50 cursor-pointer active:scale-[0.99]'
                                : isChecked && isLeadOverride
                                ? 'bg-purple-50/70 border border-purple-200/80 hover:bg-purple-100/50 cursor-pointer active:scale-[0.99]'
                                : 'hover:bg-slate-50 cursor-pointer active:scale-[0.99]'
                            }`}
                          >
                            {/* Tap Target / Indicator */}
                            <div className="flex h-8 w-8 items-center justify-center shrink-0 mt-0.5">
                              {isLockedByOther ? (
                                <div
                                  className="h-7 w-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 shadow-2xs"
                                  title={`Verified by ${rawOwner}. Only they can untick.`}
                                >
                                  <Lock className="h-4 w-4" />
                                </div>
                              ) : isMine ? (
                                <CheckCircle2 className="h-6 w-6 text-emerald-600 fill-emerald-100 transition-transform scale-110" />
                              ) : isChecked && isLeadOverride ? (
                                <ShieldCheck className="h-6 w-6 text-purple-600 fill-purple-100 transition-transform scale-110" />
                              ) : (
                                <Circle className="h-6 w-6 text-slate-300 hover:text-blue-500 transition-colors" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                                  {tc.section}
                                </span>
                                {tc.tag && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      tc.tag === 'Security'
                                        ? 'bg-red-100 text-red-800'
                                        : tc.tag === 'RBAC'
                                        ? 'bg-amber-100 text-amber-800'
                                        : tc.tag === 'PWA'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {tc.tag}
                                  </span>
                                )}
                              </div>

                              <h3
                                className={`text-sm sm:text-base font-bold transition-colors ${
                                  isChecked
                                    ? isMine
                                      ? 'text-emerald-950 font-semibold'
                                      : 'text-slate-800'
                                    : 'text-slate-900'
                                }`}
                              >
                                {tc.title}
                              </h3>

                              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                                {tc.description}
                              </p>

                              {/* Tester Stamp / Lock Status Badges */}
                              {isChecked && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  {isMine ? (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-md shadow-2xs">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                      <span>Passed by you ({rawOwner})</span>
                                      <span className="text-[10px] text-emerald-600 font-normal">· Click to uncheck</span>
                                    </span>
                                  ) : isLockedByOther ? (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                                      <Lock className="h-3 w-3 text-slate-500" />
                                      <span>Passed by <strong>{rawOwner}</strong></span>
                                      <span className="text-[10px] text-slate-400 font-normal">· Locked against edits</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-900 bg-white border border-purple-200 px-2 py-0.5 rounded-md shadow-2xs">
                                      <ShieldCheck className="h-3 w-3 text-purple-600" />
                                      <span>Passed by {rawOwner} (Lead Override Mode)</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Live Defect & Bug Tracking Ledger */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bug className="h-5 w-5 text-red-500" />
                <span>Centralized Defect & Issue Tracker</span>
              </h2>
              <p className="text-xs text-slate-500">
                Log bugs found on your phone so developers can fix them immediately.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDefectModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Report a Bug</span>
            </button>
          </div>

          {defects.length === 0 ? (
            <div className="py-8 text-center text-xs sm:text-sm text-slate-500">
              No open defects recorded! If you find an issue while testing, tap &quot;Report a Bug&quot;.
            </div>
          ) : (
            <div className="space-y-3">
              {defects.map((d) => (
                <div
                  key={d._key}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          d.severity === 'Blocker'
                            ? 'bg-red-600 text-white'
                            : d.severity === 'High'
                            ? 'bg-orange-100 text-orange-900'
                            : d.severity === 'Med'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {d.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-600">{d.module}</span>
                    </div>

                    {/* Status Dropdown */}
                    <select
                      value={d.status}
                      onChange={(e) =>
                        handleStatusChange(
                          d._key,
                          e.target.value as 'Open' | 'In Progress' | 'Resolved'
                        )
                      }
                      className={`h-7 px-2 rounded-lg text-xs font-bold border focus:outline-none ${
                        d.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : d.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-red-50 text-red-800 border-red-300'
                      }`}
                    >
                      <option value="Open">🔴 Open</option>
                      <option value="In Progress">🔵 In Progress</option>
                      <option value="Resolved">🟢 Resolved</option>
                    </select>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{d.title}</h4>
                  {d.notes && <p className="text-xs text-slate-600 leading-relaxed">{d.notes}</p>}

                  <div className="text-[11px] text-slate-400">
                    Reported by <strong className="text-slate-600">{d.reportedBy}</strong> ·{' '}
                    {new Date(d.reportedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Global Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Last synced: {lastSyncTime.toLocaleTimeString()}</span>
            <span>·</span>
            <span>Active tester: <strong>{testerName || 'Unregistered'}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {/* QA Lead Override Trigger */}
            {!isLeadOverride ? (
              <button
                type="button"
                onClick={() => {
                  setLeadModalError('')
                  setLeadModalPinInput('')
                  setIsLeadModalOpen(true)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-purple-700 font-semibold hover:bg-purple-50 transition-colors"
                title="Authorize QA Lead Override to unlock/edit any test"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Lead Override</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDeactivateLeadOverride}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 bg-purple-100 text-purple-900 font-bold hover:bg-purple-200 transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-purple-700" />
                <span>Exit Lead Mode</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </button>

            {/* Protected Reset Button */}
            <button
              type="button"
              onClick={() => {
                setResetError('')
                setResetLeadPinInput('')
                setIsResetModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-600 font-semibold hover:bg-red-50 transition-colors"
              title="Reset team checklist (Requires QA Lead Passcode)"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Checklist</span>
            </button>
          </div>
        </div>

      </main>

      {/* Floating Action Button (FAB) for Mobile Bug Reporting */}
      <div className="fixed bottom-5 right-5 sm:hidden z-30">
        <button
          type="button"
          onClick={() => setIsDefectModalOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl hover:bg-red-700 active:scale-95 transition-transform"
          aria-label="Report Defect"
        >
          <Bug className="h-6 w-6" />
        </button>
      </div>

      {/* Modal: Tester Identity & 4-Digit PIN Registration */}
      {isNameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleRegisterOrVerify}
            className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2.5 text-blue-600 border-b border-slate-100 pb-3">
              <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Tester Registration</h3>
                <p className="text-[11px] text-slate-500">Protected QA reports · No complex login</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your name and a <strong>4-digit PIN</strong>. Your PIN protects your test tick reports so other teammates cannot accidentally uncheck or overwrite your work.
            </p>

            {regError && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span className="leading-tight">{regError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Your First Name or Nickname *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={tempNameInput}
                  onChange={(e) => setTempNameInput(e.target.value)}
                  placeholder="e.g. Ransom, Faith, Samuel"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    4-Digit Secret PIN *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{showPin ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={tempPinInput}
                  onChange={(e) => setTempPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="e.g. 1234"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm tracking-widest text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-2xs"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Remember this 4-digit PIN to access your ticks across devices.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {testerName && (
                <button
                  type="button"
                  onClick={() => setIsNameModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isRegistering}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-xs disabled:opacity-50 transition-all"
              >
                {isRegistering ? 'Verifying...' : 'Save & Continue'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: QA Lead Override Login */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleLeadOverrideSubmit}
            className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2.5 text-purple-700 border-b border-slate-100 pb-3">
              <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <KeyRound className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">QA Lead Override</h3>
                <p className="text-[11px] text-slate-500">Override lock on any test</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter the <strong>QA Lead Passcode</strong> to temporarily enable override mode. This allows you to edit or uncheck test reports created by any tester.
            </p>

            {leadModalError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                {leadModalError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                QA Lead Passcode *
              </label>
              <input
                type="password"
                required
                autoFocus
                value={leadModalPinInput}
                onChange={(e) => setLeadModalPinInput(e.target.value)}
                placeholder="Enter lead passcode"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLeadModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-700 text-xs font-bold text-white hover:bg-purple-800 shadow-xs"
              >
                Enable Override
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Protected Reset Confirmation */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmReset}
            className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2.5 text-red-600 border-b border-slate-100 pb-3">
              <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <RotateCcw className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset All Test Checkboxes</h3>
                <p className="text-[11px] text-red-600 font-semibold">Destructive Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action will clear all verified checkboxes for the entire team across all 6 test suites. To prevent accidental wipes, enter the <strong>QA Lead Passcode</strong> below.
            </p>

            {resetError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                {resetError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                QA Lead Passcode *
              </label>
              <input
                type="password"
                required
                autoFocus
                value={resetLeadPinInput}
                onChange={(e) => setResetLeadPinInput(e.target.value)}
                placeholder="Enter lead passcode to wipe"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isResetting}
                className="px-5 py-2 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700 shadow-xs disabled:opacity-50"
              >
                {isResetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Report Defect Form */}
      {isDefectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleAddDefect}
            className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <Bug className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900">Report an Issue / Bug</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDefectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Issue Summary *
                </label>
                <input
                  type="text"
                  required
                  value={defectTitle}
                  onChange={(e) => setDefectTitle(e.target.value)}
                  placeholder="e.g. Audio slider jumps on iOS Safari"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Module
                  </label>
                  <select
                    value={defectModule}
                    onChange={(e) => setDefectModule(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  >
                    <option value="Public Website">Public Website</option>
                    <option value="Sermons">Sermons Vault</option>
                    <option value="Connect Form">Connect Form</option>
                    <option value="Worker Registration">Worker Reg</option>
                    <option value="Exco Login / PWA">Exco Login / PWA</option>
                    <option value="Dashboard Workers">Dashboard Workers</option>
                    <option value="First-Timers">First-Timers</option>
                    <option value="Attendance / Finance">Attendance / Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={defectSeverity}
                    onChange={(e) =>
                      setDefectSeverity(e.target.value as 'Blocker' | 'High' | 'Med' | 'Low')
                    }
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  >
                    <option value="Blocker">🔴 Blocker</option>
                    <option value="High">🟠 High</option>
                    <option value="Med">🟡 Medium</option>
                    <option value="Low">⚪ Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Steps to Reproduce / Notes
                </label>
                <textarea
                  rows={3}
                  value={defectNotes}
                  onChange={(e) => setDefectNotes(e.target.value)}
                  placeholder="Describe what happened, browser, device, or expected behavior..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDefectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
              >
                Submit Bug
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}
