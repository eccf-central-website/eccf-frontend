/**
 * Dashboard navigation config — one entry per RBAC section, in sidebar order.
 *
 * Pure data, imported by the client shell components for labels and icons.
 * The server layout filters by role with canAccessSection() and passes only
 * section keys across the RSC boundary (icon components aren't serialisable).
 * hrefs come from SECTION_PATHS so they always match the page guards and the
 * intake actions' revalidatePath() calls.
 */

import {
  CalendarCheck,
  HandHeart,
  HeartHandshake,
  LayoutDashboard,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { SECTION_PATHS, type DashboardSection } from '@/lib/dashboard/rbac'

export interface NavItem {
  section: DashboardSection
  label: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: readonly NavItem[] = [
  { section: 'overview', label: 'Overview', href: SECTION_PATHS.overview, icon: LayoutDashboard },
  { section: 'workers', label: 'Workers', href: SECTION_PATHS.workers, icon: Users },
  { section: 'attendance', label: 'Attendance', href: SECTION_PATHS.attendance, icon: CalendarCheck },
  { section: 'finance', label: 'Finance', href: SECTION_PATHS.finance, icon: Wallet },
  { section: 'firstTimers', label: 'First-Timers', href: SECTION_PATHS.firstTimers, icon: UserPlus },
  { section: 'welfare', label: 'Welfare', href: SECTION_PATHS.welfare, icon: HeartHandshake },
  {
    section: 'prayerRequests',
    label: 'Prayer Requests',
    href: SECTION_PATHS.prayerRequests,
    icon: HandHeart,
  },
]

export function navItemForSection(section: DashboardSection): NavItem {
  return NAV_ITEMS.find((item) => item.section === section) ?? NAV_ITEMS[0]
}
