import PageContainer from '@/components/dashboard/shell/PageContainer'
import { requireSection } from '@/lib/dashboard/auth'
import { listExecutives } from '@/lib/dashboard/data'
import { canApproveExecutiveAppointments } from '@/lib/dashboard/rbac'
import ExecutivesClient from '@/components/dashboard/executives/ExecutivesClient'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export default async function ExecutivesPage() {
  const session = await requireSection('executives')
  const executives = await listExecutives(session)

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <PageContainer>
      <ExecutivesClient
        initialExecutives={executives}
        canManage={canApproveExecutiveAppointments(session)}
        today={todayStr}
      />
    </PageContainer>
  )
}
