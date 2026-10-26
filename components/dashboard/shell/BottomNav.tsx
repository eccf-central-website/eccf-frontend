'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, LayoutGrid, Settings } from 'lucide-react'
import type { WorkerRole } from '@/types'
import type { DashboardSection } from '@/lib/dashboard/rbac'
import { NAV_ITEMS } from './nav-items'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/dashboard/ui/sheet'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  sections: readonly DashboardSection[]
  role?: WorkerRole
  isPresident?: boolean
  actions?: React.ReactNode
}

/** Explicit role-priority order for the 4 primary tabs on mobile. */
function getRolePrimarySections(
  role: WorkerRole | undefined,
  isPresident: boolean | undefined
): DashboardSection[] {
  if (isPresident) {
    return ['overview', 'executives', 'workers', 'attendance']
  }
  switch (role) {
    case 'admin':
      return ['overview', 'workers', 'attendance', 'executives']
    case 'team_lead':
      return ['overview', 'workers', 'attendance', 'firstTimers']
    case 'finance':
      return ['overview', 'finance', 'attendance', 'announcements']
    case 'hall_rep':
      return ['overview', 'firstTimers', 'attendance', 'welfare']
    default:
      return ['overview', 'workers', 'attendance', 'firstTimers']
  }
}

export default function BottomNav({
  sections,
  role,
  isPresident,
  actions,
}: BottomNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Resolve permitted items
  const permittedItems = NAV_ITEMS.filter((item) => sections.includes(item.section))
  
  // Resolve 4 role-prioritised primary tabs that the user is permitted to view
  const rolePreferred = getRolePrimarySections(role, isPresident)
  const primaryKeys: DashboardSection[] = []
  
  for (const key of rolePreferred) {
    if (sections.includes(key) && !primaryKeys.includes(key) && primaryKeys.length < 4) {
      primaryKeys.push(key)
    }
  }
  // Fill remaining slots up to 4 if user has other permitted sections
  for (const item of permittedItems) {
    if (!primaryKeys.includes(item.section) && primaryKeys.length < 4) {
      primaryKeys.push(item.section)
    }
  }

  const primaryItems = primaryKeys
    .map((key) => permittedItems.find((i) => i.section === key))
    .filter(Boolean) as typeof permittedItems

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 border-t border-border/40 sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1">
          {primaryItems.map((item) => {
            const active = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname?.startsWith(item.href) ?? false
            const Icon = item.icon
            return (
              <li key={item.section} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-1 text-xs transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                    active
                      ? 'bg-transparent text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground font-medium'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      active ? 'text-[#0095ff] dark:text-[#70a3ff]' : 'text-muted-foreground'
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate leading-none">{item.label}</span>
                </Link>
              </li>
            )
          })}

          {/* 5th Tab: All-Sections Trigger using LayoutGrid icon */}
          <li className="flex-1">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="All fellowship sections and admin tools"
                  className={cn(
                    'flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 py-1 text-xs font-medium transition-colors',
                    'text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                    open && 'text-foreground'
                  )}
                >
                  <LayoutGrid
                    className={cn('h-5 w-5 shrink-0', open ? 'text-[#0095ff] dark:text-[#70a3ff]' : 'text-muted-foreground')}
                    aria-hidden="true"
                  />
                  <span className="truncate leading-none">All</span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[90vh] rounded-t-3xl px-4 pb-6 pt-3 flex flex-col bg-card border-t border-border/50"
              >
                <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" aria-hidden="true" />
                <div className="mb-2 px-2 flex items-center justify-between">
                  <SheetTitle className="text-sm font-semibold tracking-tight text-foreground uppercase tracking-wider text-muted-foreground">
                    All Sections
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Complete list of permitted fellowship operational sections and administrative tools.
                  </SheetDescription>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain pr-1 divide-y divide-border/30">
                  <nav aria-label="All dashboard destinations" className="flex flex-col py-1">
                    {permittedItems.map((item) => {
                      const Icon = item.icon
                      const active = item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname?.startsWith(item.href) ?? false
                      return (
                        <Link
                          key={item.section}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex h-11 items-center gap-3.5 rounded-xl px-3 text-sm font-medium transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            active
                              ? 'bg-transparent text-foreground font-semibold'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-5 w-5 shrink-0',
                              active ? 'text-[#0095ff] dark:text-[#70a3ff]' : 'text-muted-foreground'
                            )}
                            aria-hidden="true"
                          />
                          <span className="truncate flex-1">{item.label}</span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                        </Link>
                      )
                    })}

                    {/* Pinned Settings item inside All sheet */}
                    {sections.includes('settings') && (
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setOpen(false)}
                        aria-current={pathname?.startsWith('/dashboard/settings') ? 'page' : undefined}
                        className={cn(
                          'mt-2 flex h-11 items-center gap-3.5 rounded-xl px-3 text-sm font-medium transition-colors border border-border/40 bg-muted/20',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          pathname?.startsWith('/dashboard/settings')
                            ? 'bg-muted/60 text-foreground font-semibold'
                            : 'text-foreground hover:bg-muted/50'
                        )}
                      >
                        <Settings
                          className={cn(
                            'h-5 w-5 shrink-0',
                            pathname?.startsWith('/dashboard/settings') ? 'text-[#0095ff] dark:text-[#70a3ff]' : 'text-muted-foreground'
                          )}
                          aria-hidden="true"
                        />
                        <div className="flex flex-col flex-1 leading-tight">
                          <span>Settings</span>
                          <span className="text-[11px] text-muted-foreground font-normal">Admin tools</span>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                      </Link>
                    )}
                  </nav>
                </div>

                {actions && <div className="mt-3 pt-3 border-t border-border/40 flex justify-center">{actions}</div>}
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
      <div
        className="h-14 shrink-0 sm:hidden"
        aria-hidden="true"
        style={{ height: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
      />
    </>
  )
}
