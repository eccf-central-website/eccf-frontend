/**
 * Finance Ledger — /dashboard/finance
 *
 * Implements the calm finance cockpit:
 * - One clear h1: Finance
 * - Subtitle: Income, expenses, and the monthly position.
 * - Single neutral KPI panel (Inflow, Outflow, Net) without saturated card fills.
 * - Tabular Work Sans numbers and 44px action targets.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import FinanceClient from '@/components/dashboard/finance/FinanceClient'
import { requireSection } from '@/lib/dashboard/auth'
import { listFinance } from '@/lib/dashboard/data'

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
  await requireSection('finance')
  const rows = await listFinance()

  const todayStr = new Intl.DateTimeFormat('en-GB', {
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
          Finance
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Income, expenses, and the monthly position.
        </p>
      </div>

      <FinanceClient initialEntries={rows} />
    </PageContainer>
  )
}
