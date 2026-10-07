/**
 * NavLinks — the dashboard link list, shared by the lg+ sidebar and the
 * mobile Sheet so both always show the same role-filtered items.
 *
 * Active section comes from sectionForPath() (longest prefix wins, so
 * Overview isn't lit on sub-pages). Follows the public Navbar's
 * pending-link pattern: the clicked link shows a spinner until the
 * pathname changes. In `collapsed` mode labels become sr-only and each
 * link gets a right-side tooltip.
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
  const activeSection = sectionForPath(pathname)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  // Reset pending state on route change
  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  const items = NAV_ITEMS.filter((item) => sections.includes(item.section))

  return (
    <ul className="flex flex-col gap-1">
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
              'relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
              'before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-ring before:opacity-0 before:transition-opacity',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground before:opacity-100'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn('h-[18px] w-[18px] shrink-0', isPending && 'animate-spin text-sidebar-ring')}
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
