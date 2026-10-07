/**
 * Prayer Requests loading state — mirrors the page's future layout (intake feed).
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import FeedSkeleton from '@/components/dashboard/states/FeedSkeleton'

export default function PrayerRequestsLoading() {
  return (
    <PageContainer>
      <PageHeaderSkeleton announce={false} />
      <FeedSkeleton label="Loading prayer requests…" />
    </PageContainer>
  )
}
