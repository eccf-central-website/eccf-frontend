/**
 * TopBar — sticky app bar above every dashboard page.
 *
 * Left: the mobile nav trigger (below lg) and a title/breadcrumb derived
 * from the pathname via sectionForPath(). Right: an `actions` slot (the
 * future "Sync sermons" button) and the user menu.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import type { WorkerRole } from '@/types'
import { SECTION_PATHS, sectionForPath, type DashboardSection } from '@/lib/dashboard/rbac'
import MobileNav from './MobileNav'
import UserMenu from './UserMenu'
import { navItemForSection } from './nav-items'
import { ThemeToggle } from '@/components/dashboard/theme/ThemeToggle'

interface TopBarProps {
  sections: readonly DashboardSection[]
  role: WorkerRole
  team: string
  /** Right-side page/global actions, e.g. "Sync sermons" (later feature). */
  actions?: React.ReactNode
  devTools?: React.ReactNode
}

export default function TopBar({ sections, role, team, actions, devTools }: TopBarProps) {
  const pathname = usePathname()
  const section = sectionForPath(pathname) ?? 'overview'
  const title = navItemForSection(section).label

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-4 lg:h-16 lg:px-6">
      <MobileNav sections={sections} />

      <div className="min-w-0 flex-1">
        {section === 'overview' ? (
          <h1 className="truncate font-serif text-xl text-foreground">{title}</h1>
        ) : (
          <nav aria-label="Breadcrumb">
            <ol className="flex min-w-0 items-center gap-1.5 text-sm">
              <li className="hidden sm:block">
                <Link
                  href={SECTION_PATHS.overview}
                  className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Dashboard
                </Link>
              </li>
              <li aria-hidden="true" className="hidden text-muted-foreground sm:block">
                <ChevronRight className="h-4 w-4" />
              </li>
              <li className="min-w-0">
                <h1 aria-current="page" className="truncate font-serif text-xl text-foreground">
                  {title}
                </h1>
              </li>
            </ol>
          </nav>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {actions}
        <ThemeToggle />
        <UserMenu role={role} team={team} devTools={devTools} />
      </div>
    </header>
  )
}
