import PageContainer from '@/components/dashboard/shell/PageContainer'
import { requireSection } from '@/lib/dashboard/auth'
import FinanceClient from '@/components/dashboard/finance/FinanceClient'

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
  await requireSection('finance')

  return (
    <PageContainer>
      <FinanceClient />
    </PageContainer>
  )
}
