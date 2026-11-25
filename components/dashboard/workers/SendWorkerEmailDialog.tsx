'use client'

import * as React from 'react'
import { Mail } from 'lucide-react'
import type { WorkerRow, ECCFSession } from '@/types'
import type { TeamUnitOption } from '@/lib/dashboard/attendance-constants'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'
import { type EmailAudienceType } from '@/app/actions/worker-email-actions'
import { WorkerEmailComposer } from './SendWorkerEmailCard'

interface SendWorkerEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: ECCFSession
  workers: WorkerRow[]
  teamOptions: TeamUnitOption[]
  preselectedWorker?: WorkerRow | null
  preselectedAudience?: EmailAudienceType
}

export default function SendWorkerEmailDialog({
  open,
  onOpenChange,
  session,
  workers,
  teamOptions,
  preselectedWorker,
  preselectedAudience,
}: SendWorkerEmailDialogProps) {
  const isAdmin = session.role === 'admin'
  const teamLabel = session.leadingTeam || session.team

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-6 bg-card text-card-foreground">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>Workforce Communications</span>
          </div>
          <DialogTitle className="font-sans text-lg font-semibold leading-snug text-foreground">
            {preselectedWorker
              ? `Email ${preselectedWorker.fullName}`
              : 'Send Email to Workers'}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground leading-relaxed [text-wrap:pretty]">
            {preselectedWorker
              ? `Compose a direct official communication to ${preselectedWorker.fullName}.`
              : isAdmin
                ? 'Broadcast fellowship-wide notifications, email all EXCOs, or message specific operational units and individuals.'
                : `Compose and dispatch official email updates to workers in ${teamLabel}.`}
          </DialogDescription>
        </DialogHeader>

        <WorkerEmailComposer
          session={session}
          workers={workers}
          teamOptions={teamOptions}
          preselectedWorker={preselectedWorker}
          preselectedAudience={preselectedAudience}
          syncKey={open}
          onCancel={() => onOpenChange(false)}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
