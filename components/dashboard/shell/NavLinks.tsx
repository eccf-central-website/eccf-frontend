/**
 * NavLinks — the dashboard link list, shared by the lg+ sidebar and the
 * mobile All-sections sheet so both always show the same role-filtered items.
 *
 * Active section comes from sectionForPath() (longest prefix wins, so
 * Overview isn't lit on sub-pages). In `collapsed` mode labels become sr-only
 * and each link gets a right-side tooltip. All items meet the 44px touch target.
 */

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sectionForPath, type DashboardSection } from '@/lib/dashboard/rbac'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/dashboard/ui/tooltip'
import { NAV_ITEMS } from './nav-items'

interface NavLinksProps {
  sections: readonly DashboardSection[]
  collapsed?: boolean
  onNavigate?: () => void
}

export default function NavLinks({ sections, collapsed = false, onNavigate }: NavLinksProps) {
  const pathname = usePathname()
  const activeSection = sectionForPath(pathname || '')
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  // Reset pending state on route change
  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  const items = NAV_ITEMS.filter((item) => sections.includes(item.section))

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => {
        const active = item.section === activeSection
        const isPending = pendingHref === item.href && !active
        const Icon = isPending ? Loader2 : item.icon

        const link = (
          <Link
            href={item.href}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              if (item.href !== pathname) setPendingHref(item.href)
              onNavigate?.()
            }}
            className={cn(
              'relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
              active
                ? 'bg-sidebar-accent/80 text-sidebar-accent-foreground font-semibold'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5 shrink-0 transition-colors',
                active ? 'text-[#70a3ff] dark:text-[#70a3ff]' : 'text-sidebar-foreground/75',
                isPending && 'animate-spin text-sidebar-ring'
              )}
            />
            <span className={cn('truncate', collapsed && 'sr-only')}>{item.label}</span>
          </Link>
        )

        return (
          <li key={item.section}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            )}
          </li>
        )
      })}
    </ul>
  )
}
