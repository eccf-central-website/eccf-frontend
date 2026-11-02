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
import type { NavigationAttention } from '@/lib/dashboard/types'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/dashboard/ui/tooltip'
import { NAV_ITEMS } from './nav-items'

interface NavLinksProps {
  sections: readonly DashboardSection[]
  attention?: NavigationAttention
  collapsed?: boolean
  onNavigate?: () => void
}

export default function NavLinks({
  sections,
  attention,
  collapsed = false,
  onNavigate,
}: NavLinksProps) {
  const pathname = usePathname()
  const activeSection = sectionForPath(pathname || '')
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  // Reset pending state on route change
  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  // Settings is pinned in the sidebar footer, not the flat destination list.
  const items = NAV_ITEMS.filter(
    (item) => item.section !== 'settings' && sections.includes(item.section)
  )

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => {
        const active = item.section === activeSection
        const isPending = pendingHref === item.href && !active
        const Icon = isPending ? Loader2 : item.icon
        const count = attention?.[item.section] ?? 0
        const countLabel =
          count > 0
            ? `${count} item${count === 1 ? '' : 's'} awaiting attention`
            : undefined

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
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring/40',
              active
                ? 'bg-sidebar-accent/80 text-sidebar-accent-foreground font-semibold'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            <span className="relative inline-flex shrink-0">
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  active ? 'text-[#70a3ff] dark:text-[#70a3ff]' : 'text-sidebar-foreground/75',
                  isPending && 'animate-spin text-sidebar-ring'
                )}
              />
              {count > 0 && collapsed && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-warning ring-2 ring-sidebar"
                />
              )}
            </span>
            <span className={cn('truncate', collapsed ? 'sr-only' : 'flex-1')}>
              {item.label}
            </span>
            {count > 0 && !collapsed && (
              <span
                aria-hidden="true"
                title={countLabel}
                className="ml-1 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-warning px-1.5 text-[11px] font-semibold leading-none tabular-nums text-warning-foreground"
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
            {count > 0 && <span className="sr-only">{countLabel}</span>}
          </Link>
        )

        return (
          <li key={item.section}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">
                  {count > 0 ? `${item.label} — ${countLabel}` : item.label}
                </TooltipContent>
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
