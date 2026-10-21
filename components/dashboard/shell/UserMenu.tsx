/**
 * UserMenu — top-bar account menu: role badge and team, public site link,
 * and Clerk authenticated Sign out.
 *
 * Displays authenticated user's name, primary email, role badge,
 * official leadership title ([excoPosition] without em-dash), and operational teams.
 */

'use client'

import { ChevronDown, ExternalLink, LogOut, Moon, Sun, UserRound } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
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
  name?: string
  email?: string
  role: WorkerRole
  team: string
  teams?: string[]
  excoPosition?: string
  devTools?: React.ReactNode
}

export default function UserMenu({ name, email, role, team, teams, excoPosition, devTools }: UserMenuProps) {
  const { theme, toggleTheme } = useTheme()
  const { signOut } = useClerk()
  const isDark = theme === 'dark'
  const displayTeam = teams && teams.length > 0 ? teams.join(', ') : team
  const displayName = name || excoPosition || ROLE_LABELS[role]
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : null

  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: '/login' })
    } catch {
      window.location.href = '/login'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 px-2 focus-visible:ring-2 sm:px-3"
          aria-label={`Account menu, signed in as ${displayName}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar text-sidebar-accent-foreground text-xs font-semibold">
            {initials ? initials : <UserRound aria-hidden="true" className="h-4 w-4" />}
          </span>
          <span className="hidden text-sm font-medium sm:inline truncate max-w-[150px]">{displayName}</span>
          <ChevronDown aria-hidden="true" className="hidden text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-1.5 font-normal">
          <span className="text-xs text-muted-foreground">Signed in as</span>
          {name && (
            <span className="text-sm font-semibold text-foreground truncate">{name}</span>
          )}
          {email && (
            <span className="text-xs text-muted-foreground truncate">{email}</span>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge>{ROLE_LABELS[role]}</Badge>
            {excoPosition ? (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                [{excoPosition}]
              </span>
            ) : (
              <span className="truncate text-xs font-medium text-muted-foreground">
                {displayTeam} team
              </span>
            )}
          </div>
          {excoPosition && (
            <span className="text-xs text-muted-foreground">{displayTeam} team</span>
          )}
          {teams && teams.length > 1 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {teams.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-md bg-secondary/80 px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
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
          onClick={handleSignOut}
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
