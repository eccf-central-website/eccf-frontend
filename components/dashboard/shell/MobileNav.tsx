/**
 * MobileNav — below lg, a top-bar hamburger opens a left Sheet with the
 * same role-filtered NavLinks as the sidebar. Closes on link click and,
 * as a safety net, whenever the pathname changes.
 */

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import type { DashboardSection } from '@/lib/dashboard/rbac'
import { Button } from '@/components/dashboard/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/dashboard/ui/sheet'
import { SidebarBrand } from './AppSidebar'
import NavLinks from './NavLinks'

export default function MobileNav({ sections }: { sections: readonly DashboardSection[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-9 w-9 shrink-0 focus-visible:ring-2 sm:inline-flex lg:hidden"
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
        <SheetDescription className="sr-only">Links to each dashboard section you can access.</SheetDescription>
        <div className="flex h-16 shrink-0 items-center px-4 pr-14">
          <SidebarBrand />
        </div>
        <nav aria-label="Dashboard" className="flex-1 overflow-y-auto p-3">
          <NavLinks sections={sections} onNavigate={() => setOpen(false)} />
        </nav>
        <div className="shrink-0 p-3">
          <p className="px-3 text-xs text-sidebar-foreground/70">Theme lives in the account menu at the top right.</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
