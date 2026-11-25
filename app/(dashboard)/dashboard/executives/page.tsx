import PageContainer from '@/components/dashboard/shell/PageContainer'
import ExecutivesClient from '@/components/dashboard/executives/ExecutivesClient'
import { requireSection } from '@/lib/dashboard/auth'
import { listExecutives, listPendingExecutiveApplications } from '@/lib/dashboard/data'
import { lagosDate } from '@/lib/dashboard/dates'
import { formatDate } from '@/lib/dashboard/format'
import { canApproveExecutiveAppointments } from '@/lib/dashboard/rbac'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export default async function ExecutivesPage() {
  const session = await requireSection('executives')
  const canManage = canApproveExecutiveAppointments(session)

  const [executives, pendingApplications] = await Promise.all([
    listExecutives(session),
    canManage ? listPendingExecutiveApplications(session) : Promise.resolve([]),
  ])

  const today = formatDate(lagosDate())

  return (
    <PageContainer>
      <ExecutivesClient
        initialExecutives={executives}
        initialPendingApplications={pendingApplications}
        canManage={canManage}
        today={today}
      />
    </PageContainer>
  )
}
