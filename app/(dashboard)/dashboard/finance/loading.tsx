/**
 * Finance loading state — /dashboard/finance/loading.tsx
 * Mirrors the finance ledger geometry: PageHeader with Record transaction + Export CSV,
 * unified 3-metric KPI strip (Income, Expenses, Net position), and 6-column ledger table/cards.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'
import { Skeleton } from '@/components/dashboard/ui/skeleton'

export default function FinanceLoading() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeaderSkeleton announce={false} action={true} />

        {/* Unified 3-metric KPI strip placeholder */}
        <LoadingRegion announce={false}>
          <div className="rounded-[var(--radius-card)] bg-card p-2 shadow-sm">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {[0, 1, 2].map((tile) => (
                <div key={tile} className="space-y-3 p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-[var(--radius-control)]" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-7 w-28 rounded-md" />
                    <Skeleton className="h-3.5 w-32 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </LoadingRegion>

        <TableSkeleton label="Loading finance entries…" columns={6} />
      </div>
    </PageContainer>
  )
}
