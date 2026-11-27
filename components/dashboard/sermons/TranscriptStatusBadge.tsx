'use client'

import { Captions, CaptionsOff, Clock } from 'lucide-react'
import type { SermonTranscriptStatus } from '@/types'
import { StatusBadge } from '@/components/dashboard/ui/status-badge'

export interface TranscriptStatusBadgeProps {
  status?: SermonTranscriptStatus
}

/**
 * Displays sermon caption status with a disabled CC icon when captions are unavailable.
 */
export function TranscriptStatusBadge({ status }: TranscriptStatusBadgeProps) {
  if (status === 'ready') {
    return (
      <StatusBadge variant="success" icon={<Captions className="h-3.5 w-3.5" />}>
        Ready
      </StatusBadge>
    )
  }

  if (status === 'unavailable') {
    return (
      <StatusBadge
        variant="neutral"
        icon={<CaptionsOff className="h-3.5 w-3.5" />}
        title="Captions unavailable"
        className="gap-0 px-2.5 py-1 text-muted-foreground/75 opacity-80"
      >
        <span className="sr-only">Captions unavailable</span>
      </StatusBadge>
    )
  }

  return (
    <StatusBadge variant="warning" icon={<Clock className="h-3.5 w-3.5" />}>
      Waiting
    </StatusBadge>
  )
}
