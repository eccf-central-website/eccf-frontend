/**
 * President Executive Approval Console — app/(dashboard)/dashboard/executives/page.tsx
 *
 * Implements Phase 4 of Clerk Migration:
 * - Exclusively accessible if `session.access.isPresident === true`.
 * - Redirects unauthorized visitors to `/dashboard?denied=executives`.
 * - Fetches all workers with pending executive applications.
 * - Renders the presidential console with categorized groups and 1-tap approvals.
 */

import { redirect } from 'next/navigation'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import { requireSession } from '@/lib/dashboard/auth'
import { listPendingExecutiveApplications } from '@/lib/dashboard/data'
import ExecutiveApprovalsClient from '@/components/dashboard/executives/ExecutiveApprovalsClient'

export const dynamic = 'force-dynamic'

export default async function ExecutivesPage() {
  const session = await requireSession()

  // Strict Presidential Authorization Gate
  if (!session.access?.isPresident) {
    redirect('/dashboard?denied=executives')
  }

  const applications = await listPendingExecutiveApplications()

  return (
    <PageContainer>
      <ExecutiveApprovalsClient applications={applications} />
    </PageContainer>
  )
}
