/**
 * Workers loading state — /dashboard/workers/loading.tsx
 * Mirrors the page geometry: Header with primary action, 3-metric KPI strip, and data table.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'

export default function WorkersLoading() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeaderSkeleton announce={false} action={true} />
        <StatGridSkeleton count={3} gridClassName="grid grid-cols-3 gap-3" announce={false} />
        <TableSkeleton label="Loading workers…" />
      </div>
    </PageContainer>
  )
}
