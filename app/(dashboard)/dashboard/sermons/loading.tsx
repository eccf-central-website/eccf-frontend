/**
 * Sermons loading skeleton — /dashboard/sermons/loading.tsx
 * Mirrors the sermons media vault geometry: Header, 4-metric KPI strip, and data table.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'

export default function SermonsLoading() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeaderSkeleton announce={false} action={true} />
        <StatGridSkeleton count={4} announce={false} />
        <TableSkeleton label="Loading sermons…" />
      </div>
    </PageContainer>
  )
}
