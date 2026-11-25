/**
 * Sermons loading skeleton — /dashboard/sermons/loading.tsx
 * Mirrors the sermons media vault geometry: PageHeader, 4-metric KpiStrip, and data table.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'

export default function SermonsLoading() {
  return (
    <PageContainer>
      <LoadingRegion label="Loading sermons…" announce={true}>
        <div className="space-y-6">
          <PageHeaderSkeleton announce={false} action={true} />
          <StatGridSkeleton count={4} announce={false} />
          <TableSkeleton
            rows={6}
            columns={6}
            pagination={false}
            announce={false}
            label="Loading sermons…"
          />
        </div>
      </LoadingRegion>
    </PageContainer>
  )
}
