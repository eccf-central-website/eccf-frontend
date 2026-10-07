/**
 * Finance loading state — mirrors the page's future layout (ledger table with an Add entry action).
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'

export default function FinanceLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton announce={false} action />
      <TableSkeleton label="Loading finance entries…" />
    </PageContainer>
  )
}
