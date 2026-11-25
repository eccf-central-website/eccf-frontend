'use client'

import React, { useId, useState } from 'react'
import { HeartHandshake, Wallet } from 'lucide-react'
import type { WelfareLedgerRow, WelfareRequestRow } from '@/types'
import { formatCount } from '@/lib/dashboard/format'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'
import WelfareClient from './WelfareClient'
import WelfareLedgerClient from './WelfareLedgerClient'
import { cn } from '@/lib/utils'

type WelfareTab = 'requests' | 'ledger'

interface WelfareHubProps {
  initialLedgerEntries: WelfareLedgerRow[]
  initialRequests: WelfareRequestRow[]
  initialTab?: WelfareTab
}

export default function WelfareHub({
  initialLedgerEntries,
  initialRequests,
  initialTab,
}: WelfareHubProps) {
  const initialPendingCount = initialRequests.filter((r) => r.status === 'Pending').length

  const [activeTab, setActiveTab] = useState<WelfareTab>(
    () => initialTab ?? (initialPendingCount > 0 ? 'requests' : 'ledger')
  )
  const [pendingRequestsCount, setPendingRequestsCount] = useState(initialPendingCount)
  const [totalRequestsCount, setTotalRequestsCount] = useState(initialRequests.length)
  const [ledgerCount, setLedgerCount] = useState(initialLedgerEntries.length)

  const requestsTabId = useId()
  const ledgerTabId = useId()
  const requestsPanelId = useId()
  const ledgerPanelId = useId()

  const selectTab = (tab: WelfareTab) => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tab)
      window.history.replaceState(null, '', url.toString())
    }
  }

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, current: WelfareTab) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const next: WelfareTab = current === 'requests' ? 'ledger' : 'requests'
      selectTab(next)
      const nextEl = document.getElementById(next === 'requests' ? requestsTabId : ledgerTabId)
      nextEl?.focus()
    }
  }

  return (
    <div className="space-y-6">
      {/* Primary Hub Tabs */}
      <div
        role="tablist"
        aria-label="Welfare sections"
        className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-[var(--radius-control)] bg-card p-1 shadow-sm"
      >
        <button
          id={requestsTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === 'requests'}
          aria-controls={requestsPanelId}
          tabIndex={activeTab === 'requests' ? 0 : -1}
          onClick={() => selectTab('requests')}
          onKeyDown={(e) => handleTabKeyDown(e, 'requests')}
          className={cn(
            'inline-flex min-h-11 items-center gap-2 rounded-[calc(var(--radius-control)-2px)] px-4 py-2 text-sm font-medium transition-colors [touch-action:manipulation] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
            activeTab === 'requests'
              ? 'bg-surface-raised text-foreground ring-1 ring-inset ring-primary/35'
              : 'text-muted-foreground hover:bg-surface-raised/60 hover:text-foreground'
          )}
        >
          <HeartHandshake className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Care Requests</span>
          {pendingRequestsCount > 0 ? (
            <StatusBadge variant="warning" dot>
              {formatCount(pendingRequestsCount)} pending
            </StatusBadge>
          ) : (
            <StatusBadge variant="neutral" dot>
              {formatCount(totalRequestsCount)}
            </StatusBadge>
          )}
        </button>

        <button
          id={ledgerTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === 'ledger'}
          aria-controls={ledgerPanelId}
          tabIndex={activeTab === 'ledger' ? 0 : -1}
          onClick={() => selectTab('ledger')}
          onKeyDown={(e) => handleTabKeyDown(e, 'ledger')}
          className={cn(
            'inline-flex min-h-11 items-center gap-2 rounded-[calc(var(--radius-control)-2px)] px-4 py-2 text-sm font-medium transition-colors [touch-action:manipulation] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
            activeTab === 'ledger'
              ? 'bg-surface-raised text-foreground ring-1 ring-inset ring-primary/35'
              : 'text-muted-foreground hover:bg-surface-raised/60 hover:text-foreground'
          )}
        >
          <Wallet className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Welfare Purse Ledger</span>
          <StatusBadge variant="neutral" dot>
            {formatCount(ledgerCount)}
          </StatusBadge>
        </button>
      </div>

      {/* Tab Panels */}
      <div
        id={requestsPanelId}
        role="tabpanel"
        aria-labelledby={requestsTabId}
        hidden={activeTab !== 'requests'}
      >
        {activeTab === 'requests' && (
          <WelfareClient
            initialRequests={initialRequests}
            onPendingCountChange={setPendingRequestsCount}
            onTotalCountChange={setTotalRequestsCount}
          />
        )}
      </div>

      <div
        id={ledgerPanelId}
        role="tabpanel"
        aria-labelledby={ledgerTabId}
        hidden={activeTab !== 'ledger'}
      >
        {activeTab === 'ledger' && (
          <WelfareLedgerClient
            initialEntries={initialLedgerEntries}
            onEntriesCountChange={setLedgerCount}
          />
        )}
      </div>
    </div>
  )
}
