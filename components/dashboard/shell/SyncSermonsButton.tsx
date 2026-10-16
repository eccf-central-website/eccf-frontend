'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/dashboard/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/dashboard/ui/tooltip'

export default function SyncSermonsButton() {
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/sync-sermons', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setMessage(`Synced! Spotify: +${data.spotify?.created ?? 0}. YouTube: +${data.youtube?.created ?? 0}.`)
      } else {
        const err = await res.text()
        setMessage('Sync failed: ' + err)
      }
    } catch {
      setMessage('Network error while triggering sermon sync')
    } finally {
      setSyncing(false)
      // Auto-dismiss message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSync}
            disabled={syncing}
            aria-label="Sync Sermons"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin text-indigo-600' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Sync Sermons (Spotify &amp; YouTube RSS)</p>
        </TooltipContent>
      </Tooltip>
      {message && (
        <span className="absolute top-full right-0 mt-1 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-md z-50">
          {message}
        </span>
      )}
    </div>
  )
}
