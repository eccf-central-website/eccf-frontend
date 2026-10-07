/**
 * Welfare — /dashboard/welfare
 *
 * Stub from feature/dashboard-layout: guards direct-URL access with
 * requireSection() so RBAC is testable before feature/dashboard-data-tables lands.
 */

import SectionPlaceholder from '@/components/dashboard/shell/SectionPlaceholder'
import { requireSection } from '@/lib/dashboard/auth'

export default async function WelfarePage() {
  await requireSection('welfare')

  return (
    <SectionPlaceholder
      section="welfare"
      branch="feature/dashboard-data-tables"
      description="Pending and resolved welfare requests, with Mark resolved."
    />
  )
}
