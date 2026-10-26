/**
 * Executive Appointments loading skeleton — /dashboard/executives/loading.tsx
 * Mirrors the executives geometry: Header, 4-metric category KPI strip, and applications queue.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'

export default function ExecutivesLoading() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeaderSkeleton announce={false} action={true} />
        <StatGridSkeleton count={4} gridClassName="grid grid-cols-2 sm:grid-cols-4 gap-3" announce={false} />
        <TableSkeleton label="Loading executive appointments…" />
      </div>
    </PageContainer>
  )
}
