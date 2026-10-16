import PageContainer from '@/components/dashboard/shell/PageContainer'
import { requireSection } from '@/lib/dashboard/auth'
import AnnouncementsClient from '@/components/dashboard/announcements/AnnouncementsClient'

export const dynamic = 'force-dynamic'

export default async function AnnouncementsPage() {
  await requireSection('announcements')

  return (
    <PageContainer>
      <AnnouncementsClient />
    </PageContainer>
  )
}
