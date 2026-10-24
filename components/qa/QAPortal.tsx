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
  Lock,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
    X,

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

  // In-flight mutation tracking
  const pendingMutationsRef = useRef<Map<string, { targetChecked: boolean; timestamp: number }>>(new Map())

  // Live Cloud Save Status Indicator ('saved' | 'saving' | 'error')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const saveStatusTimerRef = useRef<NodeJS.Timeout | null>(null)

  const triggerSaveStatus = (status: 'saved' | 'saving' | 'error') => {
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current)
    setSaveStatus(status)
    if (status === 'saved' || status === 'error') {
      saveStatusTimerRef.current = setTimeout(() => {
        setSaveStatus('saved')
      }, 3000)
    }
  }

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

  // UI Filters & View Controls
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [selectedSuiteId, setSelectedSuiteId] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [collapsedSuites, setCollapsedSuites] = useState<Record<number, boolean>>({})
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})

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

  // 2. Poll for updates every 15s to keep all devices in sync
  const refreshLiveState = async (showToast = false) => {
    setIsSyncing(true)
    try {
      const fresh = await getQAChecklist()
      if (fresh) {
        setTestItems((prev) => {
          const merged: Record<string, QATestItemState> = { ...fresh.testItems }
          const pending = pendingMutationsRef.current

          for (const [key, localItem] of Object.entries(prev)) {
            const cleanKey = key.trim().replace(/-/g, '_')
            const isPending = pending.has(cleanKey) || pending.has(key)

            if (isPending) {
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
        triggerSaveStatus('saved')
        if (showToast) toast.success('Checklist synced with team updates!')
      }
    } catch {
      triggerSaveStatus('error')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.error('Please enter your name and 4-digit PIN first.')
      return
    }

    // STRICT TAMPER PROTECTION:
    if (current && ownerName && ownerName.toLowerCase() !== testerName.toLowerCase() && !isLeadOverride) {
      toast.error(`Locked: Verified by ${ownerName}`, {
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

    // Trigger saving status indicator immediately
    triggerSaveStatus('saving')

    // Register mutation as in-flight
    pendingMutationsRef.current.set(underscoreId, { targetChecked: nextChecked, timestamp: Date.now() })
    pendingMutationsRef.current.set(cleanId, { targetChecked: nextChecked, timestamp: Date.now() })

    // Optimistic UI update
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
          triggerSaveStatus('error')
          const pending = pendingMutationsRef.current.get(underscoreId)
          if (pending && pending.targetChecked === nextChecked) {
            setTestItems((prev) => ({
              ...prev,
              [cleanId]: currentItem || { checked: current },
              [underscoreId]: currentItem || { checked: current },
              [hyphenId]: currentItem || { checked: current },
            }))
            toast.error(res.error || 'Sync issue saving checkmark. Please tap again.')
          }
        } else {
          triggerSaveStatus('saved')
          setLastSyncTime(new Date())
        }
      } catch (err) {
        console.error('[handleToggle] Error during QA toggle:', err)
        triggerSaveStatus('error')
        setTestItems((prev) => ({
          ...prev,
          [cleanId]: currentItem || { checked: current },
          [underscoreId]: currentItem || { checked: current },
          [hyphenId]: currentItem || { checked: current },
        }))
        toast.error('Network error. Check connection and retry.')
      } finally {
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
    triggerSaveStatus('saving')

    startTransition(async () => {
      const res = await addQADefect({
        title: newDefectTemp.title,
        module: newDefectTemp.module,
        severity: newDefectTemp.severity,
        reportedBy: activeName,
        notes: newDefectTemp.notes,
      })

      if (res.success && res.defect) {
        triggerSaveStatus('saved')
        toast.success('Defect logged to team board!')
        refreshLiveState(false)
      } else {
        triggerSaveStatus('error')
        toast.error('Failed to log defect. Please retry.')
      }
    })
  }

  // 5. Update Defect Status
  const handleStatusChange = async (defectKey: string, nextStatus: 'Open' | 'In Progress' | 'Resolved') => {
    setDefects((prev) =>
      prev.map((d) => (d._key === defectKey ? { ...d, status: nextStatus } : d))
    )
    triggerSaveStatus('saving')

    startTransition(async () => {
      const res = await updateQADefectStatus({
        defectKey,
        status: nextStatus,
        updatedBy: testerName || 'QA Team',
      })
      if (res.success) {
        triggerSaveStatus('saved')
        toast.success(`Status updated to ${nextStatus}`)
      } else {
        triggerSaveStatus('error')
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
      const item = testItems[tc.id] || testItems[tc.id.replace(/-/g, '_')] || testItems[tc.id.replace(/_/g, '-')]
      const isChecked = Boolean(item?.checked)
      if (statusFilter === 'pending' && isChecked) return false
      if (statusFilter === 'completed' && !isChecked) return false

      if (selectedSuiteId !== 'all' && tc.suiteId !== selectedSuiteId) return false

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

  const toggleExpandDescription = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedDescriptions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 pb-32 sm:pb-36 antialiased">

      {/* Sticky Native-App Header — Ultra-Compact & Responsive */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-4xl mx-auto px-3.5 py-2 sm:px-6 sm:py-2.5 flex flex-col gap-2">

          {/* Top Row: Brand, Save Indicator, Tester Pill, Actions */}
          <div className="flex items-center justify-between gap-2">
            
            {/* Left: Brand + Cloud Save Status Indicator */}
            <div className="flex items-center gap-2 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos/ECCF LOGO.png"
                alt="ECCF"
                className="h-7 w-7 object-contain shrink-0 rounded-full bg-white shadow-2xs border border-slate-100"
              />
              <div className="min-w-0 flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-950 truncate tracking-tight">
                  ECCF QA
                </h1>

                {/* Real-Time Cloud Save Status Pill */}
                <div className="shrink-0 transition-all duration-300">
                  {saveStatus === 'saving' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700 animate-pulse">
                      <RefreshCw className="h-2.5 w-2.5 shrink-0 animate-spin text-blue-600" />
                      <span>Saving...</span>
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800 shadow-2xs">
                      <Check className="h-2.5 w-2.5 shrink-0 text-emerald-600 stroke-[3]" />
                      <span>Saved</span>
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-[10px] font-bold text-red-700">
                      <AlertCircle className="h-2.5 w-2.5 shrink-0 text-red-600" />
                      <span>Retry save</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Tester ID Badge + Quick Sync */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Active Tester Pill */}
              <button
                type="button"
                onClick={() => {
                  setTempNameInput(testerName)
                  setTempPinInput('')
                  setRegError('')
                  setIsNameModalOpen(true)
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all ${
                  testerName
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100/70'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
                title="Tap to switch tester or update PIN"
              >
                {testerName ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <User className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                )}
                <span className="max-w-[80px] sm:max-w-[120px] truncate text-[11px] sm:text-xs font-bold">
                  {testerName ? testerName : 'Set Name'}
                </span>
                {testerName && <Lock className="h-2.5 w-2.5 text-emerald-600/70 shrink-0" />}
              </button>

              {/* Lead Override Indicator if Active */}
              {isLeadOverride && (
                <button
                  type="button"
                  onClick={handleDeactivateLeadOverride}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-purple-300 bg-purple-100 text-purple-900 text-[11px] font-bold shadow-2xs hover:bg-purple-200"
                  title="Click to turn off QA Lead Override"
                >
                  <KeyRound className="h-3 w-3 shrink-0 text-purple-700" />
                  <span className="hidden sm:inline">Lead Mode</span>
                  <span className="text-[10px] text-purple-600"><X className="h-3 w-3 shrink-0" /></span>
                </button>
              )}

              {/* Refresh / Sync Button */}
              <button
                type="button"
                onClick={() => refreshLiveState(true)}
                disabled={isSyncing}
                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs"
                title="Sync live team changes"
                aria-label="Refresh live state"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Bottom Row of Sticky Header: Segmented Filter Control & Progress Metric */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {/* Segmented Filter Pills */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100/90 border border-slate-200/70 text-[11px] font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-950 font-bold shadow-2xs'
                    : 'hover:text-slate-950'
                }`}
              >
                All <span className="font-mono text-[10px] text-slate-400 font-normal">({totalTests})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white font-bold shadow-2xs'
                    : 'hover:text-slate-950'
                }`}
              >
                Pending <span className="font-mono text-[10px] opacity-80">({totalTests - completedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'hover:text-slate-950'
                }`}
              >
                Passed <span className="font-mono text-[10px] opacity-80">({completedCount})</span>
              </button>
            </div>

            {/* Compact Progress Stat */}
            <div className="flex items-center gap-1.5 shrink-0 text-right">
              <span className="text-xs font-mono font-bold text-slate-800">
                {completionPercentage}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({completedCount}/{totalTests})
              </span>
            </div>
          </div>

        </div>

        {/* 2px Gradient Progress Strip on bottom edge of header */}
        <div className="w-full h-[2.5px] bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-3.5 py-3 sm:px-6 sm:py-5 space-y-3.5 sm:space-y-5">

        {/* Search Bar & Quick Suite Dropdown — Mobile Compact */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests (e.g. phone, rbac, audio)..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-300/80 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            />
          </div>

          <select
            value={selectedSuiteId}
            onChange={(e) => setSelectedSuiteId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="h-9 px-3 rounded-xl border border-slate-300/80 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
          >
            <option value="all">All 6 Test Suites</option>
            {QA_TEST_SUITES.map((s) => (
              <option key={s.id} value={s.id}>
                Suite {s.id}: {s.name.replace(/`.*?`/g, '').trim()}
              </option>
            ))}
          </select>
        </div>

        {/* Horizontal Contributor Micro-Bar — Ultra-Clean on Mobile */}
        {contributorStats.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="h-3 w-3 shrink-0 text-blue-500" />
              <span>Team:</span>
            </span>
            {contributorStats.map(([name, count]) => {
              const isCurrent = testerName && name.toLowerCase() === testerName.toLowerCase()
              return (
                <span
                  key={name}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap shadow-2xs border shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold ring-1 ring-emerald-400/30'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isCurrent ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <span>{name}</span>
                  <span className="font-mono text-[10px] opacity-75 font-bold">({count})</span>
                  {isCurrent && <span className="text-[9px] text-emerald-600 font-normal">You</span>}
                </span>
              )
            })}
          </div>
        )}

        {/* Test Suites Accordions */}
        <div className="space-y-3">
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
                className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden transition-all"
              >
                {/* Suite Header Card — Sleek Mobile Accordion */}
                <button
                  type="button"
                  onClick={() => toggleSuiteCollapse(suite.id)}
                  className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-slate-50/70 hover:bg-slate-100/60 border-b border-slate-100 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white shrink-0 shadow-2xs">
                      {suite.id}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {suite.name.replace(/`.*?`/g, '').trim()}
                      </h2>
                      <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 block">
                        {suitePassed} of {suiteTotal} passed ({Math.round((suitePassed / (suiteTotal || 1)) * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isAllPassed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span className="hidden sm:inline">Passed</span>
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 font-mono">
                        {suitePassed}/{suiteTotal}
                      </span>
                    )}
                    {isCollapsed ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Suite Test Items Checklist */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {suiteCases.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No tests match current filter criteria.
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
                        const isExpanded = expandedDescriptions[tc.id] || false

                        return (
                          <div
                            key={tc.id}
                            onClick={() => handleToggle(tc.id)}
                            className={`flex items-start gap-2.5 p-3 transition-all select-none ${
                              isLockedByOther
                                ? 'bg-slate-50/80 cursor-not-allowed hover:bg-slate-100/70'
                                : isMine
                                ? 'bg-emerald-50/50 hover:bg-emerald-100/40 cursor-pointer active:scale-[0.995]'
                                : isChecked && isLeadOverride
                                ? 'bg-purple-50/50 hover:bg-purple-100/40 cursor-pointer active:scale-[0.995]'
                                : 'hover:bg-slate-50/80 cursor-pointer active:scale-[0.995]'
                            }`}
                          >
                            {/* Tap Target / Left Checkmark */}
                            <div className="flex h-6 w-6 items-center justify-center shrink-0 mt-0.5">
                              {isLockedByOther ? (
                                <div
                                  className="h-5 w-5 shrink-0 rounded-md bg-slate-200 flex items-center justify-center text-slate-600 shadow-2xs"
                                  title={`Verified by ${rawOwner}. Only they can untick.`}
                                >
                                  <Lock className="h-3 w-3 shrink-0" />
                                </div>
                              ) : isMine ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 fill-emerald-100 transition-transform scale-105" />
                              ) : isChecked && isLeadOverride ? (
                                <ShieldCheck className="h-5 w-5 shrink-0 text-purple-600 fill-purple-100 transition-transform scale-105" />
                              ) : (
                                <Circle className="h-5 w-5 shrink-0 text-slate-300 hover:text-blue-500 transition-colors" />
                              )}
                            </div>

                            {/* Content Block */}
                            <div className="flex-1 min-w-0 space-y-1">
                              {/* Metadata Line */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {tc.section}
                                </span>
                                {tc.tag && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                                      tc.tag === 'Security'
                                        ? 'bg-red-100 text-red-800'
                                        : tc.tag === 'RBAC'
                                        ? 'bg-amber-100 text-amber-800'
                                        : tc.tag === 'PWA'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {tc.tag}
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h3
                                className={`text-xs sm:text-sm leading-snug font-bold transition-colors ${
                                  isChecked
                                    ? isMine
                                      ? 'text-emerald-950'
                                      : 'text-slate-800'
                                    : 'text-slate-900'
                                }`}
                              >
                                {tc.title}
                              </h3>

                              {/* Description with Clean Mobile Clamp */}
                              <p
                                className={`text-[11px] sm:text-xs text-slate-500 leading-relaxed whitespace-pre-line ${
                                  !isExpanded ? 'line-clamp-2 sm:line-clamp-none' : ''
                                }`}
                              >
                                {tc.description}
                              </p>

                              {/* "Read more" toggle for mobile if description is lengthy */}
                              {tc.description.length > 110 && (
                                <button
                                  type="button"
                                  onClick={(e) => toggleExpandDescription(tc.id, e)}
                                  className="text-[10px] font-semibold text-blue-600 hover:underline sm:hidden block pt-0.5"
                                >
                                  {isExpanded ? 'Show less' : 'Read more...'}
                                </button>
                              )}

                              {/* Stamp Badges */}
                              {isChecked && (
                                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                                  {isMine ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                                      <Check className="h-2.5 w-2.5 shrink-0 text-emerald-700 stroke-[3]" />
                                      <span>Passed by you ({rawOwner})</span>
                                      <span className="text-[9px] text-emerald-600/75">· Tap to uncheck</span>
                                    </span>
                                  ) : isLockedByOther ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                                      <Lock className="h-2.5 w-2.5 shrink-0 text-slate-500" />
                                      <span>Passed by <strong>{rawOwner}</strong></span>
                                      <span className="text-[9px] text-slate-400">· Locked</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-900 bg-purple-100/70 px-2 py-0.5 rounded-md">
                                      <ShieldCheck className="h-2.5 w-2.5 shrink-0 text-purple-700" />
                                      <span>Passed by {rawOwner} (Lead Mode)</span>
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

        {/* Centralized Defect Ledger */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs p-3.5 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Bug className="h-4 w-4 shrink-0 text-red-500" />
                <span>Issue & Defect Tracker</span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                Log bugs found during verification
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDefectModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-2xs transition-colors shrink-0"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>Report Bug</span>
            </button>
          </div>

          {defects.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No open defects recorded yet. If you spot an issue, tap &quot;Report Bug&quot;.
            </div>
          ) : (
            <div className="space-y-2">
              {defects.map((d) => (
                <div
                  key={d._key}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 sm:p-3 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
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
                      <span className="text-[11px] font-bold text-slate-600">{d.module}</span>
                    </div>

                    <select
                      value={d.status}
                      onChange={(e) =>
                        handleStatusChange(
                          d._key,
                          e.target.value as 'Open' | 'In Progress' | 'Resolved'
                        )
                      }
                      className={`h-6 px-2 rounded-lg text-[10px] font-bold border focus:outline-none ${
                        d.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : d.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-red-50 text-red-800 border-red-300'
                      }`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">{d.title}</h4>
                  {d.notes && <p className="text-[11px] text-slate-600 leading-relaxed">{d.notes}</p>}

                  <div className="text-[10px] text-slate-400">
                    Reported by <strong className="text-slate-600">{d.reportedBy}</strong> ·{' '}
                    {new Date(d.reportedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Global Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200/80 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <span>Synced: {lastSyncTime.toLocaleTimeString()}</span>
            <span>·</span>
            <span>Tester: <strong>{testerName || 'Unregistered'}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            {!isLeadOverride ? (
              <button
                type="button"
                onClick={() => {
                  setLeadModalError('')
                  setLeadModalPinInput('')
                  setIsLeadModalOpen(true)
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-200 bg-white text-purple-700 font-semibold hover:bg-purple-50 transition-colors shadow-2xs"
                title="Authorize QA Lead Override"
              >
                <KeyRound className="h-3 w-3 shrink-0" />
                <span>Lead Override</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDeactivateLeadOverride}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-300 bg-purple-100 text-purple-900 font-bold hover:bg-purple-200 transition-colors"
              >
                <ShieldCheck className="h-3 w-3 shrink-0 text-purple-700" />
                <span>Exit Lead</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Printer className="h-3 w-3 shrink-0" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setResetError('')
                setResetLeadPinInput('')
                setIsResetModalOpen(true)
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 bg-white text-red-600 font-semibold hover:bg-red-50 transition-colors shadow-2xs"
              title="Reset team checklist"
            >
              <RotateCcw className="h-3 w-3 shrink-0" />
              <span>Reset</span>
            </button>
          </div>
        </div>

      </main>

      {/* Floating Action Button (FAB) on Mobile — Sleek, Non-Obtrusive Pill */}
      <div className="fixed bottom-4 right-4 sm:hidden z-30">
        <button
          type="button"
          onClick={() => setIsDefectModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-red-600 text-white shadow-xl hover:bg-red-700 active:scale-95 transition-all text-xs font-bold"
          aria-label="Report Defect"
        >
          <Bug className="h-4 w-4 shrink-0" />
          <span>Report Bug</span>
        </button>
      </div>

      {/* Modal: Tester Identity & 4-Digit PIN Registration */}
      {isNameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleRegisterOrVerify}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center gap-2.5 text-blue-600 border-b border-slate-100 pb-2.5">
              <div className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Tester Registration</h3>
                <p className="text-[10px] text-slate-400">Protected QA ticks · Instant setup</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your name and a <strong>4-digit PIN</strong>. Your PIN protects your test tick reports so teammates cannot accidentally change your work.
            </p>

            {regError && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span className="leading-tight">{regError}</span>
              </div>
            )}

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Your First Name or Nickname *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={tempNameInput}
                  onChange={(e) => setTempNameInput(e.target.value)}
                  placeholder="e.g. Ransom, Faith, Samuel"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    4-Digit Secret PIN *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[10px] text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    {showPin ? <EyeOff className="h-2.5 w-2.5 shrink-0" /> : <Eye className="h-2.5 w-2.5 shrink-0" />}
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
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs tracking-widest text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Remember this PIN to access your ticks across devices.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {testerName && (
                <button
                  type="button"
                  onClick={() => setIsNameModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isRegistering}
                className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-xs disabled:opacity-50 transition-all"
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
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center gap-2 text-purple-700 border-b border-slate-100 pb-2.5">
              <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <KeyRound className="h-4 w-4 shrink-0 text-purple-700" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">QA Lead Override</h3>
                <p className="text-[10px] text-slate-500">Edit or unlock any test</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter the <strong>QA Lead Passcode</strong> to temporarily enable override mode.
            </p>

            {leadModalError && (
              <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                {leadModalError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                QA Lead Passcode *
              </label>
              <input
                type="password"
                required
                autoFocus
                value={leadModalPinInput}
                onChange={(e) => setLeadModalPinInput(e.target.value)}
                placeholder="Enter lead passcode"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLeadModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-700 text-xs font-bold text-white hover:bg-purple-800 shadow-xs"
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
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center gap-2 text-red-600 border-b border-slate-100 pb-2.5">
              <div className="h-8 w-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <RotateCcw className="h-4 w-4 shrink-0 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Reset All Test Checkboxes</h3>
                <p className="text-[10px] text-red-600 font-semibold">Destructive Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will clear all verified test tick reports for the entire team. Enter the <strong>QA Lead Passcode</strong> below to confirm.
            </p>

            {resetError && (
              <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                {resetError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                QA Lead Passcode *
              </label>
              <input
                type="password"
                required
                autoFocus
                value={resetLeadPinInput}
                onChange={(e) => setResetLeadPinInput(e.target.value)}
                placeholder="Enter lead passcode to wipe"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isResetting}
                className="px-4 py-2 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700 shadow-xs disabled:opacity-50"
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
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-red-600">
                <Bug className="h-4 w-4 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Report an Issue / Bug</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDefectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold"
              >                <X className="h-4 w-4 shrink-0" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Issue Summary *
                </label>
                <input
                  type="text"
                  required
                  value={defectTitle}
                  onChange={(e) => setDefectTitle(e.target.value)}
                  placeholder="e.g. Audio slider jumps on iOS Safari"
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Module
                  </label>
                  <select
                    value={defectModule}
                    onChange={(e) => setDefectModule(e.target.value)}
                    className="w-full h-9 px-2 rounded-xl border border-slate-300 text-[11px] font-semibold focus:outline-none"
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={defectSeverity}
                    onChange={(e) =>
                      setDefectSeverity(e.target.value as 'Blocker' | 'High' | 'Med' | 'Low')
                    }
                    className="w-full h-9 px-2 rounded-xl border border-slate-300 text-[11px] font-semibold focus:outline-none"
                  >
                    <option value="Blocker">Blocker</option>
                    <option value="High">High</option>
                    <option value="Med">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Steps to Reproduce / Notes
                </label>
                <textarea
                  rows={3}
                  value={defectNotes}
                  onChange={(e) => setDefectNotes(e.target.value)}
                  placeholder="Describe what happened, device, browser..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDefectModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
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
