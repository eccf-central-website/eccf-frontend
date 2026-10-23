/**
 * Welfare — /dashboard/welfare
 *
 * Welfare desk feed of student assistance requests submitted via Connect page.
 * Authenticated Exco coordinators can review and mark requests resolved.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import SectionEmpty from '@/components/dashboard/shell/SectionEmpty'
import WelfareClient from '@/components/dashboard/welfare/WelfareClient'
import { requireSection } from '@/lib/dashboard/auth'
import { listWelfare } from '@/lib/dashboard/data'
import { HeartHandshake } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WelfarePage() {
  await requireSection('welfare')
  const rows = await listWelfare()

  if (rows.length === 0) {
    return (
      <SectionEmpty
        section="welfare"
        title="No welfare requests yet"
        description="Welfare assistance requests submitted on the Connect page will appear here."
      />
    )
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-2 border-b pb-5">
        <div className="flex items-center gap-2.5 text-primary">
          <HeartHandshake className="h-6 w-6 shrink-0" />
          <h2 className="font-serif text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            Welfare Desk
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Review confidential welfare and student care requests. All personal contact records remain encrypted and restricted.
        </p>
      </div>

      <WelfareClient initialRequests={rows} />
    </PageContainer>
  )
}
