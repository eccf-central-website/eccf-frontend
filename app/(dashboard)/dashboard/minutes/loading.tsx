/**
 * Meeting Minutes loading skeleton — /dashboard/minutes/loading.tsx
 * Mirrors the PageHeader, 4-metric KpiStrip, and desktop table / mobile cards layout.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'

export default function MeetingMinutesLoading() {
  return (
    <PageContainer>
      <LoadingRegion label="Loading meeting minutes…" announce={true}>
        <div className="space-y-6">
          <PageHeaderSkeleton announce={false} action={true} />
          <StatGridSkeleton count={4} announce={false} />
          <TableSkeleton
            rows={5}
            columns={6}
            pagination={false}
            announce={false}
            label="Loading meeting minutes…"
          />
        </div>
      </LoadingRegion>
    </PageContainer>
  )
}
