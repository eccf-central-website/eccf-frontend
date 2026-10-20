/**
 * Sermon Vault and Media Management Desk — /dashboard/sermons
 *
 * Restricted exclusively to Media Team leaders (team leads and admins).
 * Allows full curation of sermons, manual updates, live audio testing,
 * and automated RSS ingestion synchronization with Spotify & YouTube.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import SermonsClient from '@/components/dashboard/sermons/SermonsClient'
import { requireSection } from '@/lib/dashboard/auth'
import { SERMONS_QUERY } from '@/lib/queries'
import { sanityPrivateClient, sanityClient } from '@/lib/sanity'
import type { SermonVault } from '@/types'

export const dynamic = 'force-dynamic'

export default async function SermonsDashboardPage() {
  // Layer 1 RBAC: Strict Access Restriction for Media Team leaders
  await requireSection('sermons')

  let sermons: SermonVault[] = []
  try {
    const client = sanityPrivateClient.config().token ? sanityPrivateClient : sanityClient
    const res = await client.fetch<SermonVault[]>(SERMONS_QUERY)
    if (res && Array.isArray(res)) {
      sermons = res
    }
  } catch (err) {
    console.error('[SermonsDashboardPage] Failed to fetch live sermons from Sanity:', err)
    try {
      const res = await sanityClient.fetch<SermonVault[]>(SERMONS_QUERY)
      if (res && Array.isArray(res)) {
        sermons = res
      }
    } catch {
      // client fetch error fallback
    }
  }

  return (
    <PageContainer>
      <SermonsClient initialSermons={sermons} />
    </PageContainer>
  )
}
