/**
 * Attendance loading state — /dashboard/attendance/loading.tsx
 * Mirrors the attendance geometry: Header with primary action, 3-metric KPI strip, and records table.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'

export default function AttendanceLoading() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeaderSkeleton announce={false} action={true} />
        <StatGridSkeleton count={3} gridClassName="grid grid-cols-3 gap-3" announce={false} />
        <TableSkeleton label="Loading attendance…" columns={4} />
      </div>
    </PageContainer>
  )
}
