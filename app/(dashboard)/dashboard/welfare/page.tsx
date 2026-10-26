/**
 * Welfare Operations — /dashboard/welfare
 *
 * Implements the unified Welfare Hub:
 * - Welfare Purse Ledger (tracking inflows, outflows, bank charges, and running purse balance)
 * - Care Requests queue (pastoral care, medical & student distress assistance)
 *
 * Access is restricted to:
 * - Welfare & Medical Team Leaders and Members
 * - Christian Student Governing Board (CSGB)
 * - Fellowship Chaplain
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import WelfareHub from '@/components/dashboard/welfare/WelfareHub'
import { requireSection } from '@/lib/dashboard/auth'
import { listWelfare, listWelfareLedger } from '@/lib/dashboard/data'

export const dynamic = 'force-dynamic'

export default async function WelfarePage() {
  const session = await requireSection('welfare')
  const [ledgerEntries, requests] = await Promise.all([
    listWelfareLedger(session),
    listWelfare(session),
  ])

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <PageContainer>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {todayStr}
        </p>
        <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Welfare Operations
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage the Welfare Purse ledger, monitor inflows and disbursements, and respond to care requests.
        </p>
      </div>

      <WelfareHub initialLedgerEntries={ledgerEntries} initialRequests={requests} />
    </PageContainer>
  )
}
