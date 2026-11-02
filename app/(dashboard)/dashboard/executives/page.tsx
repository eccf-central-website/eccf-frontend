import PageContainer from '@/components/dashboard/shell/PageContainer'
import { requireSection } from '@/lib/dashboard/auth'
import { listExecutives, listPendingExecutiveApplications } from '@/lib/dashboard/data'
import { canApproveExecutiveAppointments } from '@/lib/dashboard/rbac'
import ExecutivesClient from '@/components/dashboard/executives/ExecutivesClient'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export default async function ExecutivesPage() {
  const session = await requireSection('executives')
  const canManage = canApproveExecutiveAppointments(session)

  const [executives, pendingApplications] = await Promise.all([
    listExecutives(session),
    canManage ? listPendingExecutiveApplications(session) : Promise.resolve([]),
  ])

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <PageContainer>
      <ExecutivesClient
        initialExecutives={executives}
        initialPendingApplications={pendingApplications}
        canManage={canManage}
        today={todayStr}
      />
    </PageContainer>
  )
}
