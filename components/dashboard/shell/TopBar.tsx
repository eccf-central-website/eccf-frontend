/**
 * TopBar — sticky app bar above every dashboard page.
 *
 * Left: the mobile nav trigger (below lg) and a title/breadcrumb derived
 * from the pathname via sectionForPath(). Right: an `actions` slot (the
 * "Sync sermons" button) and the user menu.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import type { WorkerRole } from '@/types'
import { SECTION_PATHS, sectionForPath, isMediaTeam, type DashboardSection } from '@/lib/dashboard/rbac'
import type { NavigationAttention } from '@/lib/dashboard/types'
import MobileNav from './MobileNav'
import UserMenu from './UserMenu'
import { navItemForSection } from './nav-items'

interface TopBarProps {
  sections: readonly DashboardSection[]
  name?: string
  email?: string
  role: WorkerRole
  team: string
  teams?: string[]
  excoPosition?: string
  leadingTeam?: string
  profileImageUrl?: string
  /** Right-side page/global actions, e.g. "Sync sermons". */
  actions?: React.ReactNode
  devTools?: React.ReactNode
  attention?: NavigationAttention
}

export default function TopBar({
  sections,
  name,
  email,
  role,
  team,
  teams,
  excoPosition,
  leadingTeam,
  profileImageUrl,
  actions,
  devTools,
  attention,
}: TopBarProps) {
  const pathname = usePathname()
  const section = sectionForPath(pathname || '') ?? 'overview'
  const title = navItemForSection(section).label
  const SectionIcon = navItemForSection(section).icon
  const isMediaLeaderUser =
    isMediaTeam({ team, teams, excoPosition, leadingTeam }) &&
    (role === 'team_lead' || role === 'admin')

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 bg-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-4 lg:px-6">
      <MobileNav sections={sections} attention={attention} />

      <div className="min-w-0 flex-1">
        {/* The overview page renders its own big greeting as the h1, so the
            top bar stays empty there — one title, like the reference app. */}
        {section !== 'overview' && (
          <nav aria-label="Breadcrumb">
            <ol className="flex min-w-0 items-center gap-1.5 text-sm">
              <li className="hidden sm:block">
                <Link
                  href={SECTION_PATHS.overview}
                  className="inline-flex min-h-11 items-center rounded-md px-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10"
                >
                  Dashboard
                </Link>
              </li>
              <li aria-hidden="true" className="hidden text-muted-foreground sm:block">
                <ChevronRight className="h-4 w-4 shrink-0" />
              </li>
              <li className="min-w-0">
                <span
                  aria-current="page"
                  className="inline-flex items-center truncate font-sans text-base font-semibold text-foreground sm:text-lg"
                >
                  <SectionIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                  {title}
                </span>
              </li>
            </ol>
          </nav>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isMediaLeaderUser && actions && <div className="hidden sm:block">{actions}</div>}
        <UserMenu
          name={name}
          email={email}
          role={role}
          team={team}
          teams={teams}
          excoPosition={excoPosition}
          profileImageUrl={profileImageUrl}
          devTools={devTools}
        />
      </div>
    </header>
  )
}
