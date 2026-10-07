/**
 * Dashboard Shell Layout — wraps every /dashboard/* page.
 *
 * Server Component: resolves the session (redirecting to /login without
 * one), filters the nav by role via the RBAC matrix and reads the sidebar
 * cookie so the first paint has the right width. Only section keys cross
 * into the client shell; pages still guard themselves with
 * requireSection() for direct-URL access.
 */

import { cookies } from 'next/headers'
import { requireSession } from '@/lib/dashboard/auth'
import { canAccessSection } from '@/lib/dashboard/rbac'
import { SIDEBAR_COOKIE } from '@/lib/dashboard/shell'
import { NAV_ITEMS } from '@/components/dashboard/shell/nav-items'
import AppSidebar from '@/components/dashboard/shell/AppSidebar'
import SkipLink from '@/components/dashboard/shell/SkipLink'

export default async function DashboardShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireSession()
  const sections = NAV_ITEMS.filter((item) => canAccessSection(session.role, item.section)).map(
    (item) => item.section
  )
  const sidebarCollapsed = cookies().get(SIDEBAR_COOKIE)?.value === 'collapsed'

  return (
    <div className="flex min-h-dvh flex-1">
      <SkipLink />
      <AppSidebar sections={sections} defaultCollapsed={sidebarCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
