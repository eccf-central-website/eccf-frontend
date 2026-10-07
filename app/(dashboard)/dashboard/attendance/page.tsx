/**
 * Attendance — /dashboard/attendance
 *
 * Stub from feature/dashboard-layout: guards direct-URL access with
 * requireSection() so RBAC is testable before feature/dashboard-ledger-forms lands.
 */

import SectionPlaceholder from '@/components/dashboard/shell/SectionPlaceholder'
import { requireSection } from '@/lib/dashboard/auth'

export default async function AttendancePage() {
  await requireSection('attendance')

  return (
    <SectionPlaceholder
      section="attendance"
      branch="feature/dashboard-ledger-forms"
      description="Attendance ledger with an Add entry form for each service."
    />
  )
}
