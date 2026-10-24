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
import { SECTION_PATHS, sectionForPath, isMediaTeam, type DashboardSection } from '@/lib/dashboard/rbac'
import MobileNav from './MobileNav'
import UserMenu from './UserMenu'
import { navItemForSection } from './nav-items'
import { ThemeToggle } from '@/components/dashboard/theme/ThemeToggle'
import InstallPwaButton from '@/components/dashboard/pwa/InstallPwaButton'

interface TopBarProps {
  sections: readonly DashboardSection[]
  name?: string
  email?: string
  role: WorkerRole
  team: string
  teams?: string[]
  excoPosition?: string
  leadingTeam?: string
  /** Right-side page/global actions, e.g. "Sync sermons" (later feature). */
  actions?: React.ReactNode
  devTools?: React.ReactNode
}

export default function TopBar({ sections, name, email, role, team, teams, excoPosition, leadingTeam, actions, devTools }: TopBarProps) {
  const pathname = usePathname()
  const section = sectionForPath(pathname || '') ?? 'overview'
  const title = navItemForSection(section).label
  const SectionIcon = navItemForSection(section).icon
  const isMediaLeaderUser = isMediaTeam({ team, teams, excoPosition, leadingTeam }) && (role === 'team_lead' || role === 'admin')

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-1 bg-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:h-16 sm:gap-2 sm:px-4 lg:h-16 lg:px-6">
      <MobileNav sections={sections} />

      <div className="min-w-0 flex-1">
        {/* The overview page renders its own big greeting as the h1, so the
            top bar stays empty there — one title, like the reference app. */}
        {section !== 'overview' && (
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
                <ChevronRight className="h-4 w-4 shrink-0" />
              </li>
              <li className="min-w-0">
                <h1 aria-current="page" className="truncate font-sans font-semibold text-base text-foreground sm:text-lg lg:text-xl">
                  <SectionIcon className="h-4 w-4 shrink-0 mr-2" aria-hidden="true" />
                  {title}
                </h1>
              </li>
            </ol>
          </nav>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {isMediaLeaderUser && actions && <div className="hidden sm:block">{actions}</div>}
        <ThemeToggle />
        <InstallPwaButton />
        <UserMenu name={name} email={email} role={role} team={team} teams={teams} excoPosition={excoPosition} devTools={devTools} />
      </div>
    </header>
  )
}
