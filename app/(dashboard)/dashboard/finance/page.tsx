/**
 * Finance — /dashboard/finance
 *
 * Stub until feature/dashboard-ledger-forms:
 * guards direct-URL access with requireSection() and
 * already fetches the section's data, so the dev switcher's slow / empty /
 * error states exercise loading.tsx, SectionEmpty and error.tsx here.
 */

import SectionEmpty from '@/components/dashboard/shell/SectionEmpty'
import SectionPlaceholder from '@/components/dashboard/shell/SectionPlaceholder'
import { requireSection } from '@/lib/dashboard/auth'
import { listFinance } from '@/lib/dashboard/data'

export default async function FinancePage() {
  await requireSection('finance')
  const rows = await listFinance()

  if (rows.length === 0) {
    return (
      <SectionEmpty
        section="finance"
        title="No finance entries yet"
        description="Add the first income or expense entry and the ledger will start here."
      />
    )
  }

  return (
    <SectionPlaceholder
      section="finance"
      branch="feature/dashboard-ledger-forms"
      description="Finance ledger for expenses and cash income, with an Add entry form."
      count={rows.length}
    />
  )
}
