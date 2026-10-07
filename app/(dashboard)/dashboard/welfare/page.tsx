/**
 * Welfare — /dashboard/welfare
 *
 * Stub until feature/dashboard-data-tables:
 * guards direct-URL access with requireSection() and
 * already fetches the section's data, so the dev switcher's slow / empty /
 * error states exercise loading.tsx, SectionEmpty and error.tsx here.
 */

import SectionEmpty from '@/components/dashboard/shell/SectionEmpty'
import SectionPlaceholder from '@/components/dashboard/shell/SectionPlaceholder'
import { requireSection } from '@/lib/dashboard/auth'
import { listWelfare } from '@/lib/dashboard/data'

export default async function WelfarePage() {
  await requireSection('welfare')
  const rows = await listWelfare()

  if (rows.length === 0) {
    return (
      <SectionEmpty
        section="welfare"
        title="No welfare requests yet"
        description="Welfare requests submitted on the Connect page will appear here."
      />
    )
  }

  return (
    <SectionPlaceholder
      section="welfare"
      branch="feature/dashboard-data-tables"
      description="Pending and resolved welfare requests, with Mark resolved."
      count={rows.length}
    />
  )
}
