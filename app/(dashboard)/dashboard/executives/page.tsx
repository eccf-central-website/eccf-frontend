/**
 * President Executive Approval Console — app/(dashboard)/dashboard/executives/page.tsx
 *
 * Implements Executive Leadership Onboarding & Governance:
 * - Accessible to President (full approval/import authority) and CSGB Admin (viewable/read-only).
 * - Redirects unauthorized visitors to `/dashboard?denied=executives`.
 * - Fetches all workers with pending executive applications.
 * - Renders the executive console with categorized groups and review workflows.
 */

import { redirect } from 'next/navigation'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import { requireSession } from '@/lib/dashboard/auth'
import { canAccessSection } from '@/lib/dashboard/rbac'
import { listPendingExecutiveApplications } from '@/lib/dashboard/data'
import ExecutiveApprovalsClient from '@/components/dashboard/executives/ExecutiveApprovalsClient'

export const dynamic = 'force-dynamic'

export default async function ExecutivesPage() {
  const session = await requireSession()

  // Authorization Gate: President or CSGB Admin
  if (!canAccessSection(session.role, 'executives', session)) {
    redirect('/dashboard?denied=executives')
  }

  const applications = await listPendingExecutiveApplications()

  return (
    <PageContainer>
      <ExecutiveApprovalsClient
        applications={applications}
        canImport={Boolean(session.access?.isPresident)}
      />
    </PageContainer>
  )
}
