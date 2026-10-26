import PageContainer from '@/components/dashboard/shell/PageContainer'
import { requireSection } from '@/lib/dashboard/auth'
import { listExecutives } from '@/lib/dashboard/data'
import ExecutivesClient from '@/components/dashboard/executives/ExecutivesClient'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export default async function ExecutivesPage() {
  const session = await requireSection('executives')
  const executives = await listExecutives(session)

  const isPresident = Boolean(session.access?.isPresident)
  const isVp = Boolean(session.access?.isVP)
  const isChaplain = Boolean(session.access?.isChaplain)
  const isAdmin = session.role === 'admin'
  const canManage = isPresident || isVp || isChaplain || isAdmin

  return (
    <PageContainer>
      <ExecutivesClient
        initialExecutives={executives}
        canManage={canManage}
      />
    </PageContainer>
  )
}
