/**
 * AppSidebar — persistent navy navigation for lg+ screens.
 *
 * Implements the calm, flat executive cockpit layout:
 * - 40px visible space between desktop logo and navigation menu (30px on short laptops).
 * - Zero vertical scrollbar with fixed 44px destination rows.
 * - Flat destination list of all ten permitted fellowship sections.
 * - Pinned 44px Settings link with "Admin tools" sublabel in the footer.
 * - Icon-only 44px collapse trigger; in collapsed rail mode (68px), labels are hidden
 *   and icons center inside 44px hit targets with accessible tooltips.
 */

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardSection } from '@/lib/dashboard/rbac'
import { SIDEBAR_COOKIE, SIDEBAR_COOKIE_MAX_AGE, type SidebarState } from '@/lib/dashboard/shell'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/dashboard/ui/tooltip'
import NavLinks from './NavLinks'

interface AppSidebarProps {
  sections: readonly DashboardSection[]
  defaultCollapsed: boolean
}

/** Logo + product name, shared with the mobile Sheet header. */
export function SidebarBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        'flex h-11 min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
        collapsed && 'justify-center'
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/ECCF%20LOGO.png"
        alt="ECCF logo"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 object-contain"
      />
      <span className={cn('flex min-w-0 flex-col leading-none', collapsed && 'sr-only')}>
        <span className="text-base font-semibold tracking-tight text-white">ECCF</span>
        <span className="mt-1 truncate text-xs font-semibold text-sidebar-foreground/75">Exco Dashboard</span>
      </span>
    </Link>
  )
}

export default function AppSidebar({ sections, defaultCollapsed }: AppSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    const value: SidebarState = next ? 'collapsed' : 'expanded'
    document.cookie = `${SIDEBAR_COOKIE}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`
  }

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose
  const toggleLabel = collapsed ? 'Expand sidebar' : 'Collapse sidebar'
  const isSettingsActive = pathname?.startsWith('/dashboard/settings')

  return (
    <aside
      data-state={collapsed ? 'collapsed' : 'expanded'}
      className={cn(
        'hidden h-full shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out lg:flex border-r border-sidebar-border',
        collapsed ? 'w-[4.25rem]' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className={cn('flex shrink-0 items-center pt-4 pb-2', collapsed ? 'px-3 justify-center' : 'px-4')}>
        <SidebarBrand collapsed={collapsed} />
      </div>

      {/* Navigation List — with 40px top gap on desktop, 30px on short laptops, zero scrollbar */}
      <nav
        aria-label="Dashboard"
        className="flex-1 overflow-x-hidden px-3 pt-6 lg:pt-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <NavLinks sections={sections} collapsed={collapsed} />
      </nav>

      {/* Sidebar Footer — Pinned Settings and Collapse trigger */}
      <div className="shrink-0 p-3 pt-2 space-y-1.5 border-t border-sidebar-border/50">
        {sections.includes('settings') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard/settings"
                aria-current={isSettingsActive ? 'page' : undefined}
                className={cn(
                  'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                  isSettingsActive
                    ? 'bg-sidebar-accent/80 text-sidebar-accent-foreground font-semibold'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-0'
                )}
              >
                <Settings
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isSettingsActive ? 'text-[#70a3ff]' : 'text-sidebar-foreground/75'
                  )}
                  aria-hidden="true"
                />
                <div className={cn('flex flex-col text-left leading-tight', collapsed && 'sr-only')}>
                  <span>Settings</span>
                  <span className="text-[11px] text-sidebar-foreground/60 font-normal">Admin tools</span>
                </div>
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Settings (Admin tools)</TooltipContent>}
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggle}
              aria-label={toggleLabel}
              aria-expanded={!collapsed}
              className={cn(
                'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                collapsed && 'justify-center px-0'
              )}
            >
              <ToggleIcon aria-hidden="true" className="h-5 w-5 shrink-0" />
              <span className={cn(collapsed && 'sr-only')}>Collapse</span>
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">{toggleLabel}</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  )
}
