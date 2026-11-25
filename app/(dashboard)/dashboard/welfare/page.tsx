/**
 * Welfare Operations — /dashboard/welfare
 *
 * Implements the unified Welfare Hub:
 * - Care Requests queue (pastoral care, medical & student distress assistance)
 * - Welfare Purse Ledger (tracking inflows, outflows, bank charges, and running purse balance)
 *
 * Access is restricted to:
 * - Welfare & Medical Team Leaders and Members
 * - Christian Student Governing Board (CSGB)
 * - Fellowship Chaplain
 */

import { Suspense } from 'react'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import BlockErrorBoundary from '@/components/dashboard/states/BlockErrorBoundary'
import FeedSkeleton from '@/components/dashboard/states/FeedSkeleton'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import WelfareHub from '@/components/dashboard/welfare/WelfareHub'
import { requireSection } from '@/lib/dashboard/auth'
import { listWelfare, listWelfareLedger } from '@/lib/dashboard/data'
import { lagosDate } from '@/lib/dashboard/dates'
import { formatDate } from '@/lib/dashboard/format'
import type { ECCFSession } from '@/types'

export const dynamic = 'force-dynamic'

function WelfareContentSkeleton() {
  return (
    <div className="space-y-6">
      <LoadingRegion announce={false} className="space-y-6">
        <div className="inline-flex gap-1 rounded-[var(--radius-control)] bg-card p-1 shadow-sm">
          <Skeleton className="h-11 w-40 rounded-[calc(var(--radius-control)-2px)]" />
          <Skeleton className="h-11 w-44 rounded-[calc(var(--radius-control)-2px)]" />
        </div>

        <div className="rounded-[var(--radius-card)] bg-card p-1.5 shadow-sm sm:p-2">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-1.5">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-2 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-8 w-8 shrink-0 rounded-[var(--radius-control)]" />
                </div>
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-3.5 w-32 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </LoadingRegion>

      <FeedSkeleton label="Loading welfare workspace…" tabs items={4} />
    </div>
  )
}

async function WelfareContent({
  session,
  initialTab,
}: {
  session: ECCFSession
  initialTab?: 'requests' | 'ledger'
}) {
  const [ledgerEntries, requests] = await Promise.all([
    listWelfareLedger(session),
    listWelfare(session),
  ])

  return (
    <WelfareHub
      initialLedgerEntries={ledgerEntries}
      initialRequests={requests}
      initialTab={initialTab}
    />
  )
}

export default async function WelfarePage({
  searchParams,
}: {
  searchParams?: { tab?: string }
}) {
  const session = await requireSection('welfare')
  const initialTab =
    searchParams?.tab === 'ledger'
      ? 'ledger'
      : searchParams?.tab === 'requests'
        ? 'requests'
        : undefined

  return (
    <PageContainer>
      <PageHeader
        eyebrow={formatDate(lagosDate())}
        title="Welfare"
        description="Review requests, respond with care, and close the loop."
      />

      <BlockErrorBoundary title="Welfare workspace couldn't load">
        <Suspense fallback={<WelfareContentSkeleton />}>
          <WelfareContent session={session} initialTab={initialTab} />
        </Suspense>
      </BlockErrorBoundary>
    </PageContainer>
  )
}
