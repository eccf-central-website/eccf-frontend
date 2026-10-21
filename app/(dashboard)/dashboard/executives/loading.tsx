/**
 * Executive Appointments Console loading skeleton — app/(dashboard)/dashboard/executives/loading.tsx
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'

export default function ExecutivesLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton announce={false} />
      <TableSkeleton label="Loading executive applications…" />
    </PageContainer>
  )
}
