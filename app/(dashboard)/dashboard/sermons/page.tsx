/**
 * Sermon Vault and Media Management Desk — /dashboard/sermons
 *
 * Restricted exclusively to Media Team leaders (team leads and admins).
 * Allows full curation of sermons, transcript caption indexing, AI Search
 * configuration, and automated RSS synchronization with Spotify & YouTube.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import SermonsClient from '@/components/dashboard/sermons/SermonsClient'
import { requireSection } from '@/lib/dashboard/auth'
import { lagosDate } from '@/lib/dashboard/dates'
import { formatDate } from '@/lib/dashboard/format'
import { getSermonDashboardData } from '@/lib/sermon-ai/admin-data'

export const dynamic = 'force-dynamic'

export default async function SermonsDashboardPage() {
  // Layer 1 RBAC: Strict Access Restriction for Media Team leaders
  await requireSection('sermons')

  const { sermons, aiConfig, secretStatus, cacheStats } =
    await getSermonDashboardData()
  const today = formatDate(lagosDate())

  return (
    <PageContainer>
      <SermonsClient
        sermons={sermons}
        aiConfig={aiConfig}
        secretStatus={secretStatus}
        cacheStats={cacheStats}
        today={today}
      />
    </PageContainer>
  )
}
