/**
 * UserMenu — top-bar account menu: role badge and team, a link to the
 * public site, and Sign out (disabled until feature/dashboard-auth).
 *
 * The session only carries { id, role, team }, so nothing personal is
 * shown or sent to the browser. `devTools` renders the dev-only switcher
 * section; the server layout passes it only when mock auth is enabled.
 */

'use client'

import { ChevronDown, ExternalLink, LogOut, Moon, Sun, UserRound } from 'lucide-react'
import { signOut } from 'next-auth/react'
import type { WorkerRole } from '@/types'
import { ROLE_LABELS } from '@/lib/dashboard/rbac'
import { Badge } from '@/components/dashboard/ui/badge'
import { Button } from '@/components/dashboard/ui/button'
import { useTheme } from '@/components/dashboard/theme/ThemeProvider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dashboard/ui/dropdown-menu'

interface UserMenuProps {
  role: WorkerRole
  team: string
  devTools?: React.ReactNode
}

export default function UserMenu({ role, team, devTools }: UserMenuProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 px-2 focus-visible:ring-2 sm:px-3"
          aria-label={`Account menu, signed in as ${ROLE_LABELS[role]}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar text-sidebar-accent-foreground">
            <UserRound aria-hidden="true" />
          </span>
          <span className="hidden text-sm font-medium sm:inline">{ROLE_LABELS[role]}</span>
          <ChevronDown aria-hidden="true" className="hidden text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-1.5 font-normal">
          <span className="text-xs text-muted-foreground">Signed in as</span>
          <span className="flex items-center gap-2">
            <Badge>{ROLE_LABELS[role]}</Badge>
            <span className="truncate text-sm text-foreground">{team} team</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleTheme} className="h-10 cursor-pointer">
          {isDark ? (
            <>
              <Sun aria-hidden="true" className="text-amber-400" />
              Switch to light theme
            </>
          ) : (
            <>
              <Moon aria-hidden="true" className="text-muted-foreground" />
              Switch to dark theme
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-10 cursor-pointer">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden="true" />
            View public site
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="h-10 cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
        {devTools && (
          <>
            <DropdownMenuSeparator />
            {devTools}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
