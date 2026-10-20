/**
 * Sermons Dashboard loading skeleton — matches PageContainer layout.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'

export default function SermonsLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton announce={false} action />
      <TableSkeleton label="Loading Sermon Vault and Media Desk…" />
    </PageContainer>
  )
}
