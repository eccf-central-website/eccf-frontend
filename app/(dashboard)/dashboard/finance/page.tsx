/**
 * Finance Ledger — /dashboard/finance
 *
 * Exco Finance ledger: tracks tithes, offerings, project levies, online giving,
 * and fellowship expenses. Records are securely stored as private drafts.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import FinanceClient from '@/components/dashboard/finance/FinanceClient'
import { requireSection } from '@/lib/dashboard/auth'
import { listFinance } from '@/lib/dashboard/data'
import { Wallet } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
  await requireSection('finance')
  const rows = await listFinance()

  return (
    <PageContainer>
      <div className="flex flex-col gap-2 border-b pb-5">
        <div className="flex items-center gap-2.5 text-primary">
          <Wallet className="h-6 w-6" />
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Finance Ledger
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Track fellowship income and expenditures. Records are kept in private draft storage per SDD financial compliance guidelines.
        </p>
      </div>

      <FinanceClient initialEntries={rows} />
    </PageContainer>
  )
}
