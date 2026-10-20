'use client'

import React, { useState } from 'react'
import { Button } from '@/components/dashboard/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/dashboard/ui/tooltip'
import { RefreshCw } from 'lucide-react'
import { syncSermonsAction } from '@/app/actions/sermon-sync-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SyncSermonsButtonProps {
  variant?: 'icon' | 'button'
  className?: string
}

export default function SyncSermonsButton({ variant = 'icon', className }: SyncSermonsButtonProps) {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await syncSermonsAction()
      if (res.success) {
        toast.success('Sermons synced successfully from Spotify & YouTube RSS.')
      } else {
        toast.error(res.error || 'Failed to sync sermons.')
      }
    } catch {
      toast.error('Unexpected error while syncing sermons.')
    } finally {
      setSyncing(false)
    }
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={syncing}
        className={cn('inline-flex items-center gap-2 border-border/80 bg-background/50 hover:bg-accent font-medium', className)}
      >
        <RefreshCw className={cn('h-4 w-4 text-primary', syncing && 'animate-spin')} />
        <span>{syncing ? 'Syncing Feeds...' : 'Sync Feeds (RSS)'}</span>
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSync}
            disabled={syncing}
            aria-label="Sync Sermons"
            className={cn('h-9 w-9 text-muted-foreground hover:text-foreground', className)}
          >
            <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin text-primary')} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Sync Sermons (Spotify &amp; YouTube RSS)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
