import PageContainer from '@/components/dashboard/shell/PageContainer'
import { requireSection } from '@/lib/dashboard/auth'
import WelfareClient from '@/components/dashboard/welfare/WelfareClient'

export const dynamic = 'force-dynamic'

export default async function WelfarePage() {
  await requireSection('welfare')

  return (
    <PageContainer>
      <WelfareClient />
    </PageContainer>
  )
}
