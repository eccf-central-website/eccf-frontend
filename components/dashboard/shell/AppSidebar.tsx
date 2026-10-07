/**
 * AppSidebar — persistent navy navigation for lg+ screens.
 *
 * Collapses to an icon rail with tooltips. The state lives in the
 * SIDEBAR_COOKIE so the server layout renders the right width on first
 * paint (no flash); toggling updates local state and rewrites the cookie.
 * Below lg the sidebar is hidden and MobileNav's Sheet takes over.
 */

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
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
        'flex h-10 min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
        collapsed && 'justify-center'
      )}
    >
      {/* Plain <img> on purpose: next/image here gets split into a chunk shared
          with the public pages and shifts their First Load JS. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/ECCF%20LOGO.png"
        alt="ECCF logo"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 object-contain"
      />
      <span className={cn('flex min-w-0 flex-col leading-none', collapsed && 'sr-only')}>
        <span className="text-base font-black tracking-tight text-white">ECCF</span>
        <span className="mt-0.5 truncate text-xs font-semibold text-sidebar-foreground">Exco Dashboard</span>
      </span>
    </Link>
  )
}

export default function AppSidebar({ sections, defaultCollapsed }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    const value: SidebarState = next ? 'collapsed' : 'expanded'
    document.cookie = `${SIDEBAR_COOKIE}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`
  }

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose
  const toggleLabel = collapsed ? 'Expand sidebar' : 'Collapse sidebar'

  return (
    <aside
      data-state={collapsed ? 'collapsed' : 'expanded'}
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out lg:flex',
        collapsed ? 'w-[4.25rem]' : 'w-64'
      )}
    >
      <div className={cn('flex h-16 shrink-0 items-center border-b border-sidebar-border', collapsed ? 'px-3' : 'px-4')}>
        <SidebarBrand collapsed={collapsed} />
      </div>

      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        <NavLinks sections={sections} collapsed={collapsed} />
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggle}
              aria-label={toggleLabel}
              aria-expanded={!collapsed}
              className={cn(
                'flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                collapsed && 'justify-center px-0'
              )}
            >
              <ToggleIcon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
              <span className={cn(collapsed && 'sr-only')}>Collapse</span>
            </button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">{toggleLabel}</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  )
}
