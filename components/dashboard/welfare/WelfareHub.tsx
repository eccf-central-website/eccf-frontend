'use client'

import React, { useState } from 'react'
import type { WelfareLedgerRow, WelfareRequestRow } from '@/types'
import WelfareLedgerClient from './WelfareLedgerClient'
import WelfareClient from './WelfareClient'
import { Badge } from '@/components/dashboard/ui/badge'
import { HeartHandshake, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WelfareHubProps {
  initialLedgerEntries: WelfareLedgerRow[]
  initialRequests: WelfareRequestRow[]
}

export default function WelfareHub({
  initialLedgerEntries,
  initialRequests,
}: WelfareHubProps) {
  const [activeTab, setActiveTab] = useState<'ledger' | 'requests'>('ledger')

  const pendingRequestsCount = initialRequests.filter((r) => r.status === 'Pending').length

  return (
    <div className="space-y-6">
      {/* Tab Navigation Pill Rail */}
      <div className="flex border-b border-border/60 gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={cn(
            'flex items-center gap-2 pb-3 text-sm font-semibold transition-all relative',
            activeTab === 'ledger'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Wallet className="h-4 w-4" />
          <span>Welfare Purse Ledger</span>
          <Badge
            variant="secondary"
            className="text-[11px] h-5 px-1.5 font-mono rounded-full font-normal"
          >
            {initialLedgerEntries.length}
          </Badge>
          {activeTab === 'ledger' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-in fade-in" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={cn(
            'flex items-center gap-2 pb-3 text-sm font-semibold transition-all relative',
            activeTab === 'requests'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <HeartHandshake className="h-4 w-4" />
          <span>Care Requests</span>
          {pendingRequestsCount > 0 ? (
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[11px] h-5 px-1.5 font-mono rounded-full font-semibold">
              {pendingRequestsCount} pending
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-[11px] h-5 px-1.5 font-mono rounded-full font-normal"
            >
              {initialRequests.length}
            </Badge>
          )}
          {activeTab === 'requests' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-in fade-in" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'ledger' ? (
        <WelfareLedgerClient initialEntries={initialLedgerEntries} />
      ) : (
        <WelfareClient initialRequests={initialRequests} />
      )}
    </div>
  )
}
