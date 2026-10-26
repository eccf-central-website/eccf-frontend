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
  HeartHandshake,
  LayoutDashboard,
  Megaphone,
  Radio,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { PrayingHands } from '@/components/dashboard/icons/PrayingHands'
import { SECTION_PATHS, type DashboardSection } from '@/lib/dashboard/rbac'

export interface NavItem {
  section: DashboardSection
  label: string
  href: string
  icon: LucideIcon | React.ComponentType<{ className?: string; size?: number | string }>
}

export const NAV_ITEMS: readonly NavItem[] = [
  { section: 'overview', label: 'Overview', href: SECTION_PATHS.overview, icon: LayoutDashboard },
  { section: 'workers', label: 'Workers', href: SECTION_PATHS.workers, icon: Users },
  { section: 'firstTimers', label: 'First-Timers', href: SECTION_PATHS.firstTimers, icon: UserPlus },
  { section: 'attendance', label: 'Attendance', href: SECTION_PATHS.attendance, icon: CalendarCheck },
  { section: 'welfare', label: 'Welfare', href: SECTION_PATHS.welfare, icon: HeartHandshake },
  {
    section: 'prayerRequests',
    label: 'Prayer Requests',
    href: SECTION_PATHS.prayerRequests,
    icon: PrayingHands as unknown as LucideIcon,
  },
  { section: 'finance', label: 'Finance', href: SECTION_PATHS.finance, icon: Wallet },
  {
    section: 'announcements',
    label: 'Announcements',
    href: SECTION_PATHS.announcements,
    icon: Megaphone,
  },
  {
    section: 'sermons',
    label: 'Sermons',
    href: SECTION_PATHS.sermons,
    icon: Radio,
  },
]

export function navItemForSection(section: DashboardSection): NavItem {
  return NAV_ITEMS.find((item) => item.section === section) ?? NAV_ITEMS[0]
}
