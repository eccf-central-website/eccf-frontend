/**
 * Workers — /dashboard/workers
 *
 * Stub from feature/dashboard-layout: guards direct-URL access with
 * requireSection() so RBAC is testable before feature/dashboard-data-tables lands.
 */

import SectionPlaceholder from '@/components/dashboard/shell/SectionPlaceholder'
import { requireSection } from '@/lib/dashboard/auth'

export default async function WorkersPage() {
  await requireSection('workers')

  return (
    <SectionPlaceholder
      section="workers"
      branch="feature/dashboard-data-tables"
      description="Searchable, sortable Worker CRM with team, hall and role filters."
    />
  )
}
