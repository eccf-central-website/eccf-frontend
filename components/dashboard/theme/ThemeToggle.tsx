'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { Button } from '@/components/dashboard/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/dashboard/ui/tooltip'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  alignTooltip?: 'top' | 'bottom' | 'left' | 'right'
}

export function ThemeToggle({ className, alignTooltip = 'bottom' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={label}
          className={cn(
            'relative h-10 w-10 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring transition-colors',
            className
          )}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700 transition-transform duration-200" aria-hidden="true" />
          )}
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side={alignTooltip}>{label}</TooltipContent>
    </Tooltip>
  )
}
