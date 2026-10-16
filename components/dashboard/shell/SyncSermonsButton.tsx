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

export default function SyncSermonsButton() {
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
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin text-primary' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Sync Sermons (Spotify &amp; YouTube RSS)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
