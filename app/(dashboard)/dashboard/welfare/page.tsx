/**
 * Welfare — /dashboard/welfare
 *
 * Implements the welfare care queue:
 * - One semantic h1: Welfare
 * - Subtitle: Review requests, respond with care, and close the loop.
 * - Date-only eyebrow.
 * - Confidential student assistance requests reviewed with pastoral care.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import SectionEmpty from '@/components/dashboard/shell/SectionEmpty'
import WelfareClient from '@/components/dashboard/welfare/WelfareClient'
import { requireSection } from '@/lib/dashboard/auth'
import { listWelfare } from '@/lib/dashboard/data'

export const dynamic = 'force-dynamic'

export default async function WelfarePage() {
  const session = await requireSection('welfare')
  const rows = await listWelfare(session)

  if (rows.length === 0) {
    return (
      <SectionEmpty
        section="welfare"
        title="No welfare requests yet"
        description="Welfare assistance requests submitted on the Connect page will appear here."
      />
    )
  }

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <PageContainer>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {todayStr}
        </p>
        <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Welfare
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Review requests, respond with care, and close the loop.
        </p>
      </div>

      <WelfareClient initialRequests={rows} />
    </PageContainer>
  )
}
