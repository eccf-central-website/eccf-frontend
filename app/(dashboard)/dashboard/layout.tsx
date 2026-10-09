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
import { isMockAuthEnabled, requireSession } from '@/lib/dashboard/auth'
import { DEV_MOCK_STATE_COOKIE } from '@/lib/dashboard/data'
import { canAccessSection } from '@/lib/dashboard/rbac'
import { isDevMockState, SIDEBAR_COOKIE } from '@/lib/dashboard/shell'
import { NAV_ITEMS } from '@/components/dashboard/shell/nav-items'
import DevSwitcher from '@/components/dashboard/shell/DevSwitcher'
import AppSidebar from '@/components/dashboard/shell/AppSidebar'
import SkipLink from '@/components/dashboard/shell/SkipLink'
import TopBar from '@/components/dashboard/shell/TopBar'

// Per-request session for every /dashboard/* page. Without this, production
// builds (no mock session, no auth yet) prerender pages as static redirects.
export const dynamic = 'force-dynamic'

export default async function DashboardShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireSession()
  const sections = NAV_ITEMS.filter((item) => canAccessSection(session.role, item.section)).map(
    (item) => item.section
  )
  const cookieStore = cookies()
  const sidebarCollapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === 'collapsed'

  // Dev-only: rendered (and its actions usable) only with the mock session on.
  let devTools: React.ReactNode = null
  if (isMockAuthEnabled()) {
    const mockState = cookieStore.get(DEV_MOCK_STATE_COOKIE)?.value
    devTools = <DevSwitcher role={session.role} mockState={isDevMockState(mockState) ? mockState : 'normal'} />
  }

  return (
    <div className="flex min-h-dvh flex-1">
      <SkipLink />
      <AppSidebar sections={sections} defaultCollapsed={sidebarCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          sections={sections}
          role={session.role}
          team={session.team}
          excoPosition={session.excoPosition}
          devTools={devTools}
        />
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
