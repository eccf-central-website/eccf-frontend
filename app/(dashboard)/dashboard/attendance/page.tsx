/**
 * Attendance — /dashboard/attendance
 *
 * Stub until feature/dashboard-ledger-forms:
 * guards direct-URL access with requireSection() and
 * already fetches the section's data, so the dev switcher's slow / empty /
 * error states exercise loading.tsx, SectionEmpty and error.tsx here.
 */

import SectionEmpty from '@/components/dashboard/shell/SectionEmpty'
import SectionPlaceholder from '@/components/dashboard/shell/SectionPlaceholder'
import { requireSection } from '@/lib/dashboard/auth'
import { listAttendance } from '@/lib/dashboard/data'

export default async function AttendancePage() {
  await requireSection('attendance')
  const rows = await listAttendance()

  if (rows.length === 0) {
    return (
      <SectionEmpty
        section="attendance"
        title="No attendance entries yet"
        description="Record the first service's headcount and it will show up here."
      />
    )
  }

  return (
    <SectionPlaceholder
      section="attendance"
      branch="feature/dashboard-ledger-forms"
      description="Attendance ledger with an Add entry form for each service."
      count={rows.length}
    />
  )
}
