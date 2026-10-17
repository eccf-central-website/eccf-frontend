/**
 * Workers — /dashboard/workers
 *
 * Stub until feature/dashboard-data-tables:
 * guards direct-URL access with requireSection() and
 * already fetches the section's data, so the dev switcher's slow / empty /
 * error states exercise loading.tsx, SectionEmpty and error.tsx here.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import SectionEmpty from '@/components/dashboard/shell/SectionEmpty'
import WorkersClient from '@/components/dashboard/workers/WorkersClient'
import { requireSection } from '@/lib/dashboard/auth'
import { listWorkers } from '@/lib/dashboard/data'

export default async function WorkersPage() {
  const session = await requireSection('workers')
  const rows = await listWorkers(session)

  if (rows.length === 0) {
    return (
      <SectionEmpty
        section="workers"
        title="No workers registered yet"
        description="Workers who register on the fellowship portal will appear here for Team Lead review and verification."
      />
    )
  }

  return (
    <PageContainer>
      <WorkersClient rows={rows} session={session} />
    </PageContainer>
  )
}
