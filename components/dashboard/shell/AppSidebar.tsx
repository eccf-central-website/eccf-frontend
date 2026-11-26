/**
 * AppSidebar — persistent navy navigation for lg+ screens.
 *
 * Implements the calm, grouped executive cockpit layout:
 * - Compact vertical rhythm keeping all groups + footer scroll-free at 900px height.
 * - Semantic destination groups (Today, People, Care & services, Stewardship) at 44px row height.
 * - Pinned 44px Settings link with "Admin tools" sublabel in the footer.
 * - Icon-only 44px collapse trigger; in collapsed rail mode (68px), labels are hidden
 *   and icons center inside 44px hit targets with accessible tooltips.
 */

'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardSection } from '@/lib/dashboard/rbac'
import type { NavigationAttention } from '@/lib/dashboard/types'
import { SIDEBAR_COOKIE, SIDEBAR_COOKIE_MAX_AGE, type SidebarState } from '@/lib/dashboard/shell'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/dashboard/ui/tooltip'
import NavLinks from './NavLinks'

interface AppSidebarProps {
  sections: readonly DashboardSection[]
  defaultCollapsed: boolean
  attention?: NavigationAttention
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
        <span className="text-base font-semibold tracking-tight text-sidebar-accent-foreground">ECCF</span>
        <span className="mt-1 truncate text-xs font-semibold text-sidebar-foreground/75">Exco Dashboard</span>
      </span>
    </Link>
  )
}

export default function AppSidebar({ sections, defaultCollapsed, attention }: AppSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const navRef = useRef<HTMLElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    const value: SidebarState = next ? 'collapsed' : 'expanded'
    document.cookie = `${SIDEBAR_COOKIE}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`
  }

  const checkScroll = useCallback(() => {
    const el = navRef.current
    if (!el) return
    const hasScrollable = el.scrollHeight > el.clientHeight + 4
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8
    setCanScrollDown(hasScrollable && !atBottom)
    setCanScrollUp(el.scrollTop > 8)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = navRef.current
    if (!el) return

    window.addEventListener('resize', checkScroll, { passive: true })
    const observer = new ResizeObserver(() => checkScroll())
    observer.observe(el)

    return () => {
      window.removeEventListener('resize', checkScroll)
      observer.disconnect()
    }
  }, [checkScroll, collapsed, sections])

  useEffect(() => {
    // If active section is off-screen, ensure it's scrolled into view
    const activeEl = navRef.current?.querySelector('[aria-current="page"]')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    }
    checkScroll()
  }, [pathname, checkScroll])

  const scrollDown = () => {
    navRef.current?.scrollBy({ top: 140, behavior: 'smooth' })
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

      {/* Navigation List Container with dynamic top/bottom scroll affordances */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Top gradient shadow when scrolled down */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-0 right-0 top-0 z-10 h-6 bg-gradient-to-b from-sidebar to-transparent transition-opacity duration-200',
            canScrollUp ? 'opacity-100' : 'opacity-0'
          )}
        />

        <nav
          ref={navRef}
          onScroll={checkScroll}
          aria-label="Dashboard"
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-4 lg:pt-5 pb-8 [scrollbar-width:thin] [scrollbar-color:hsl(var(--sidebar-border))_transparent] hover:[scrollbar-color:hsl(var(--sidebar-ring)/0.4)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border hover:[&::-webkit-scrollbar-thumb]:bg-sidebar-ring/40"
        >
          <NavLinks sections={sections} attention={attention} collapsed={collapsed} />
        </nav>

        {/* Bottom gradient fade when more items exist below */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-16 bg-gradient-to-t from-sidebar via-sidebar/85 to-transparent transition-opacity duration-200',
            canScrollDown ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Interactive "More below" cue pill */}
        <div
          className={cn(
            'pointer-events-none absolute bottom-2 left-0 right-0 z-20 flex justify-center transition-all duration-200',
            canScrollDown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          )}
        >
          <button
            type="button"
            onClick={scrollDown}
            className={cn(
              'pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-sidebar-border/80 bg-sidebar-accent/95 px-2.5 py-1 text-[11px] font-semibold text-sidebar-accent-foreground shadow-md backdrop-blur-xs transition-all hover:bg-sidebar-accent hover:border-sidebar-ring/50 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              collapsed && 'px-1.5 py-1'
            )}
            title="Scroll down to view Meeting Minutes & more"
            aria-label="Scroll down to view more navigation sections"
          >
            <ChevronDown
              className="h-3.5 w-3.5 animate-bounce motion-reduce:animate-none text-sidebar-ring"
              aria-hidden="true"
            />
            {!collapsed && <span>More below</span>}
          </button>
        </div>
      </div>

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
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                  isSettingsActive
                    ? 'bg-sidebar-accent/80 text-sidebar-accent-foreground font-semibold'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-0'
                )}
              >
                <Settings
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isSettingsActive ? 'text-sidebar-ring' : 'text-sidebar-foreground/75'
                  )}
                  aria-hidden="true"
                />
                <div className={cn('flex flex-col text-left leading-tight', collapsed && 'sr-only')}>
                  <span>Settings</span>
                  <span className="text-xs text-sidebar-foreground/75 font-normal">Admin tools</span>
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
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
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
