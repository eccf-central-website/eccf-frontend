'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import type { DashboardSection } from '@/lib/dashboard/rbac'
import { NAV_ITEMS } from './nav-items'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/dashboard/ui/sheet'
import { useTheme } from '@/components/dashboard/theme/ThemeProvider'
import { cn } from '@/lib/utils'

const MAX_TABS = 4

export default function BottomNav({
  sections,
  actions,
}: {
  sections: readonly DashboardSection[]
  actions?: React.ReactNode
}) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const items = NAV_ITEMS.filter((item) => sections.includes(item.section))
  const primary = items.slice(0, MAX_TABS)
  const overflow = items.slice(MAX_TABS)

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around">

          {primary.map((item) => {
            const active = pathname?.startsWith(item.href) ?? false
            const Icon = item.icon
            return (
              <li key={item.section} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                    active
                      ? 'text-primary border-t-2 border-primary rounded-lg bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="truncate leading-none">{item.label}</span>
                </Link>
              </li>
            )
          })}
          <li className="flex-1">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="More navigation and actions"
                    className={cn(
                      'flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium transition-colors',
                      'text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
                    )}
                  >
                    <MoreHorizontal className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="truncate leading-none">More</span>
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="max-h-[85vh] rounded-t-2xl px-4 pb-6 pt-4"
                >
                  <SheetTitle className="sr-only">More navigation</SheetTitle>
                  <SheetDescription className="sr-only">Additional dashboard sections and settings.</SheetDescription>
                  {overflow.length > 0 && (
                    <>
                      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" aria-hidden="true" />
                      <nav aria-label="Additional sections" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {overflow.map((item) => {
                          const Icon = item.icon
                          const active = pathname?.startsWith(item.href) ?? false
                          return (
                            <Link
                              key={item.section}
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                'flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-medium transition-colors',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                active ? 'bg-primary/10 text-primary border-t-2 border-primary' : 'hover:bg-muted'
                              )}
                            >
                              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          )
                        })}
                      </nav>
                    </>
                  )}
                  <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                    {actions && <div className="flex justify-center">{actions}</div>}
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex h-11 items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {isDark ? 'Light theme' : 'Dark theme'}
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </li>
        </ul>
      </nav>
      <div className="h-14 shrink-0 sm:hidden" aria-hidden="true" style={{ height: 'calc(3.5rem + env(safe-area-inset-bottom))' }} />
    </>
  )
}
