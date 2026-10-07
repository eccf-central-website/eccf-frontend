/**
 * Workers loading state — mirrors the page's future layout (searchable CRM table).
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'

export default function WorkersLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton announce={false} />
      <TableSkeleton label="Loading workers…" />
    </PageContainer>
  )
}
