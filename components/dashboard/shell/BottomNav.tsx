'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, LayoutGrid, Settings } from 'lucide-react'
import type { WorkerRole } from '@/types'
import type { DashboardSection } from '@/lib/dashboard/rbac'
import type { NavigationAttention } from '@/lib/dashboard/types'
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
  attention?: NavigationAttention
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
      return ['overview', 'executives', 'workers', 'attendance']
    case 'team_lead':
      return ['overview', 'workers', 'attendance', 'firstTimers']
    case 'finance':
      return ['overview', 'finance', 'attendance', 'announcements']
    case 'hall_rep':
      return ['overview', 'firstTimers', 'attendance', 'workers']
    default:
      return ['overview', 'workers', 'attendance', 'firstTimers']
  }
}

function isItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
}


export default function BottomNav({
  sections,
  role,
  isPresident,
  actions,
  attention,
}: BottomNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Resolve permitted items. Settings stays in the pinned All-sheet entry and
  // never competes for one of the four primary tabs.
  const permittedItems = NAV_ITEMS.filter(
    (item) => item.section !== 'settings' && sections.includes(item.section)
  )
  
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

  // Work waiting in destinations that live behind the All sheet. The All tab
  // gets a dot so it is obvious there is something to attend to elsewhere.
  const hiddenAttention = permittedItems.reduce(
    (total, item) =>
      primaryKeys.includes(item.section) ? total : total + (attention?.[item.section] ?? 0),
    0
  )

  // The All sheet owns any permitted destination that is not one of the four
  // primary tabs, so it reads as active on those pages and while open.
  const isPrimaryActive = primaryItems.some((item) => isItemActive(pathname, item.href))
  const allActive = open || !isPrimaryActive

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1">
          {primaryItems.map((item) => {
            const active = isItemActive(pathname, item.href)
            const Icon = item.icon
            const count = attention?.[item.section] ?? 0
            const countLabel =
              count > 0
                ? `${count} item${count === 1 ? '' : 's'} awaiting attention`
                : undefined
            return (
              <li key={item.section} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-1 text-xs transition-colors [touch-action:manipulation]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                    active
                      ? 'bg-transparent font-semibold text-foreground'
                      : 'font-medium text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="relative inline-flex shrink-0">
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0 transition-colors',
                        active ? 'text-[#0095ff] dark:text-[#70a3ff]' : 'text-muted-foreground'
                      )}
                      aria-hidden="true"
                    />
                    {count > 0 && (
                      <span
                        aria-hidden="true"
                        title={countLabel}
                        className="absolute -right-2 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[9px] font-bold leading-none tabular-nums text-warning-foreground"
                      >
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </span>
                  <span className="truncate leading-none">{item.label}</span>
                  {count > 0 && <span className="sr-only">{countLabel}</span>}
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
                  aria-label={
                    hiddenAttention > 0
                      ? `All fellowship sections and admin tools, ${hiddenAttention} item${hiddenAttention === 1 ? '' : 's'} awaiting attention`
                      : 'All fellowship sections and admin tools'
                  }
                  aria-expanded={open}
                  className={cn(
                    'flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 py-1 text-xs transition-colors [touch-action:manipulation]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                    allActive
                      ? 'bg-transparent font-semibold text-foreground'
                      : 'font-medium text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="relative inline-flex shrink-0">
                    <LayoutGrid
                      className={cn(
                        'h-5 w-5 shrink-0',
                        allActive ? 'text-[#0095ff] dark:text-[#70a3ff]' : 'text-muted-foreground'
                      )}
                      aria-hidden="true"
                    />
                    {hiddenAttention > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-warning ring-2 ring-background"
                      />
                    )}
                  </span>
                  <span className="truncate leading-none">All</span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="flex max-h-[90vh] flex-col rounded-t-3xl border-t border-border/50 bg-card px-4 pb-6 pt-3"
              >
                <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" aria-hidden="true" />
                <div className="mb-2 flex items-center justify-between px-2">
                  <SheetTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    All Sections
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Complete list of permitted fellowship operational sections and administrative tools.
                  </SheetDescription>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain pr-1">
                  <nav aria-label="All dashboard destinations" className="flex flex-col divide-y divide-border/30 py-1">
                    {permittedItems.map((item) => {
                      const Icon = item.icon
                      const active = isItemActive(pathname, item.href)
                      const count = attention?.[item.section] ?? 0
                      const countLabel =
                        count > 0
                          ? `${count} item${count === 1 ? '' : 's'} awaiting attention`
                          : undefined
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
                              ? 'bg-transparent font-semibold text-foreground'
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
                          <span className="flex-1 truncate">{item.label}</span>
                          {count > 0 && (
                            <span
                              aria-hidden="true"
                              title={countLabel}
                              className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-warning px-1.5 text-[11px] font-semibold leading-none tabular-nums text-warning-foreground"
                            >
                              {count > 99 ? '99+' : count}
                            </span>
                          )}
                          {count > 0 && <span className="sr-only">{countLabel}</span>}
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                        </Link>
                      )
                    })}

                    {/* Pinned Settings item inside All sheet */}
                    {sections.includes('settings') && (
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setOpen(false)}
                        aria-current={isItemActive(pathname, '/dashboard/settings') ? 'page' : undefined}
                        className={cn(
                          'mt-2 flex h-11 items-center gap-3.5 rounded-xl bg-muted/20 px-3 text-sm font-medium transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isItemActive(pathname, '/dashboard/settings')
                            ? 'bg-muted/60 font-semibold text-foreground'
                            : 'text-foreground hover:bg-muted/50'
                        )}
                      >
                        <Settings
                          className={cn(
                            'h-5 w-5 shrink-0',
                            isItemActive(pathname, '/dashboard/settings')
                              ? 'text-[#0095ff] dark:text-[#70a3ff]'
                              : 'text-muted-foreground'
                          )}
                          aria-hidden="true"
                        />
                        <div className="flex flex-1 flex-col leading-tight">
                          <span>Settings</span>
                          <span className="text-xs font-normal text-muted-foreground">Admin tools</span>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                      </Link>
                    )}
                  </nav>
                </div>

                {actions && <div className="mt-3 flex justify-center pt-3">{actions}</div>}
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
