/**
 * MobileNav — below lg, a top-bar hamburger opens a left Sheet with the
 * same role-filtered NavLinks as the sidebar. Closes on link click and,
 * as a safety net, whenever the pathname changes.
 */

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Moon, Sun } from 'lucide-react'
import type { DashboardSection } from '@/lib/dashboard/rbac'
import { Button } from '@/components/dashboard/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/dashboard/ui/sheet'
import { useTheme } from '@/components/dashboard/theme/ThemeProvider'
import { SidebarBrand } from './AppSidebar'
import NavLinks from './NavLinks'

export default function MobileNav({ sections }: { sections: readonly DashboardSection[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 focus-visible:ring-2 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="!size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-72 max-w-[85vw] flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground [&>button]:ring-offset-sidebar"
      >
        <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
        <SheetDescription className="sr-only">Links to each dashboard section you can access.</SheetDescription>
        <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4 pr-14">
          <SidebarBrand />
        </div>
        <nav aria-label="Dashboard" className="flex-1 overflow-y-auto p-3">
          <NavLinks sections={sections} onNavigate={() => setOpen(false)} />
        </nav>
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            {isDark ? (
              <>
                <Sun className="h-[18px] w-[18px] text-amber-400 shrink-0" aria-hidden="true" />
                <span>Light theme</span>
              </>
            ) : (
              <>
                <Moon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span>Dark theme</span>
              </>
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
