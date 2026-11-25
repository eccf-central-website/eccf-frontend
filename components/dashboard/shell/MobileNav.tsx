/**
 * MobileNav — below lg, a top-bar hamburger opens a left Sheet with the
 * same role-filtered NavLinks as the sidebar, plus pinned Settings, theme
 * control, and PWA install in the footer. Closes on link click and whenever
 * the pathname changes.
 */

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Moon, Settings, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardSection } from '@/lib/dashboard/rbac'
import type { NavigationAttention } from '@/lib/dashboard/types'
import { Button } from '@/components/dashboard/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/dashboard/ui/sheet'
import { useTheme } from '@/components/dashboard/theme/ThemeProvider'
import InstallPwaButton, { InstallPwaGuideDialog } from '@/components/dashboard/pwa/InstallPwaButton'
import { SidebarBrand } from './AppSidebar'
import NavLinks from './NavLinks'

export default function MobileNav({
  sections,
  attention,
}: {
  sections: readonly DashboardSection[]
  attention?: NavigationAttention
}) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [installGuide, setInstallGuide] = useState<{ open: boolean; isIos: boolean }>({
    open: false,
    isIos: false,
  })

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const isDark = theme === 'dark'
  const isSettingsActive = pathname?.startsWith('/dashboard/settings')

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-11 w-11 shrink-0 focus-visible:ring-2 sm:inline-flex lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5 shrink-0" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex w-72 max-w-[80vw] flex-col gap-0 bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground [&>button]:ring-offset-sidebar"
        >
          <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Links to each dashboard section you can access.
          </SheetDescription>
          <div className="flex h-16 shrink-0 items-center px-4 pr-14">
            <SidebarBrand />
          </div>
          <nav aria-label="Dashboard" className="flex-1 overflow-y-auto overscroll-contain p-3">
            <NavLinks sections={sections} attention={attention} onNavigate={() => setOpen(false)} />
          </nav>
          <div className="shrink-0 space-y-1.5 border-t border-sidebar-border/50 p-3">
            {sections.includes('settings') && (
              <Link
                href="/dashboard/settings"
                onClick={() => setOpen(false)}
                aria-current={isSettingsActive ? 'page' : undefined}
                className={cn(
                  'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                  isSettingsActive
                    ? 'bg-sidebar-accent/80 font-semibold text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <Settings
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isSettingsActive ? 'text-sidebar-ring' : 'text-sidebar-foreground/75'
                  )}
                  aria-hidden="true"
                />
                <div className="flex flex-col text-left leading-tight">
                  <span>Settings</span>
                  <span className="text-xs font-normal text-sidebar-foreground/75">Admin tools</span>
                </div>
              </Link>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring [touch-action:manipulation]"
            >
              {isDark ? (
                <>
                  <Sun className="h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
                  <span>Switch to light theme</span>
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 shrink-0 text-sidebar-foreground/75" aria-hidden="true" />
                  <span>Switch to dark theme</span>
                </>
              )}
            </button>

            <InstallPwaButton
              variant="menu"
              className="min-h-11 rounded-lg px-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring md:min-h-11"
              onOpenGuide={(isIos) => {
                setOpen(false)
                setInstallGuide({ open: true, isIos })
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <InstallPwaGuideDialog
        open={installGuide.open}
        onOpenChange={(nextOpen) => setInstallGuide((prev) => ({ ...prev, open: nextOpen }))}
        isIos={installGuide.isIos}
      />
    </>
  )
}
