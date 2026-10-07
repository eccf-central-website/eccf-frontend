/**
 * Welfare loading state — mirrors the page's future layout (intake feed with Pending/Resolved tabs).
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import FeedSkeleton from '@/components/dashboard/states/FeedSkeleton'

export default function WelfareLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton announce={false} />
      <FeedSkeleton label="Loading welfare requests…" tabs />
    </PageContainer>
  )
}
