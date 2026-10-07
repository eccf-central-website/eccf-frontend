/**
 * Dashboard Shell Layout — wraps every /dashboard/* page.
 *
 * Server Component: resolves the session (redirecting to /login without
 * one) and filters the nav by role via the RBAC matrix. Only section keys
 * cross into the client shell; pages still guard themselves with
 * requireSection() for direct-URL access.
 */

import { requireSession } from '@/lib/dashboard/auth'
import { canAccessSection } from '@/lib/dashboard/rbac'
import { NAV_ITEMS } from '@/components/dashboard/shell/nav-items'
import NavLinks from '@/components/dashboard/shell/NavLinks'
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

  return (
    <div className="flex min-h-dvh flex-1">
      <SkipLink />
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-sidebar p-3 lg:flex">
        <nav aria-label="Dashboard">
          <NavLinks sections={sections} />
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
