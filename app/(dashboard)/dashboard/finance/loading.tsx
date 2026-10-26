/**
 * Finance loading state — /dashboard/finance/loading.tsx
 * Mirrors the finance ledger geometry: Header with "Record transaction", 3-metric KPI strip (Income, Expenses, Net), and ledger table.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'

export default function FinanceLoading() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeaderSkeleton announce={false} action={true} />
        <StatGridSkeleton count={3} gridClassName="grid grid-cols-1 sm:grid-cols-3 gap-3" announce={false} />
        <TableSkeleton label="Loading finance entries…" />
      </div>
    </PageContainer>
  )
}
