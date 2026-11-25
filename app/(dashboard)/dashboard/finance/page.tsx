/**
 * Finance Ledger — /dashboard/finance
 *
 * Implements the calm finance cockpit:
 * - PageHeader with Lagos date eyebrow, Belleza <h1> Finance, Export CSV, and Record transaction CTA.
 * - Single unified tonal KPI strip (Income, Expenses, Net position) without saturated card fills.
 * - Tabular Work Sans currency figures, consistent dates, and 44px touch targets.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import FinanceClient from '@/components/dashboard/finance/FinanceClient'
import { requireSection } from '@/lib/dashboard/auth'
import { listFinance } from '@/lib/dashboard/data'
import { lagosDate } from '@/lib/dashboard/dates'
import { formatDate } from '@/lib/dashboard/format'

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
  await requireSection('finance')
  const rows = await listFinance()

  const todayIso = lagosDate()
  const dateEyebrow = formatDate(todayIso)

  return (
    <PageContainer>
      <FinanceClient
        initialEntries={rows}
        dateEyebrow={dateEyebrow}
        todayIso={todayIso}
      />
    </PageContainer>
  )
}
