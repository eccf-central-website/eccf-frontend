/**
 * Workers — /dashboard/workers
 *
 * Stub until feature/dashboard-data-tables:
 * guards direct-URL access with requireSection() and
 * already fetches the section's data, so the dev switcher's slow / empty /
 * error states exercise loading.tsx, SectionEmpty and error.tsx here.
 */

import SectionEmpty from '@/components/dashboard/shell/SectionEmpty'
import SectionPlaceholder from '@/components/dashboard/shell/SectionPlaceholder'
import { requireSection } from '@/lib/dashboard/auth'
import { listWorkers } from '@/lib/dashboard/data'

export default async function WorkersPage() {
  const session = await requireSection('workers')
  const rows = await listWorkers(session)

  if (rows.length === 0) {
    return (
      <SectionEmpty
        section="workers"
        title="No workers yet"
        description="Workers added in the Studio will show up here, filtered to your hall where that applies."
      />
    )
  }

  return (
    <SectionPlaceholder
      section="workers"
      branch="feature/dashboard-data-tables"
      description="Searchable, sortable Worker CRM with team, hall and role filters."
      count={rows.length}
    />
  )
}
