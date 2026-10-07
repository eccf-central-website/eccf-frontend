/**
 * Finance — /dashboard/finance
 *
 * Stub from feature/dashboard-layout: guards direct-URL access with
 * requireSection() so RBAC is testable before feature/dashboard-ledger-forms lands.
 */

import SectionPlaceholder from '@/components/dashboard/shell/SectionPlaceholder'
import { requireSection } from '@/lib/dashboard/auth'

export default async function FinancePage() {
  await requireSection('finance')

  return (
    <SectionPlaceholder
      section="finance"
      branch="feature/dashboard-ledger-forms"
      description="Finance ledger for expenses and cash income, with an Add entry form."
    />
  )
}
