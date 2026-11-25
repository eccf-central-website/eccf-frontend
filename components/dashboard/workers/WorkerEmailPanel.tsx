'use client'

import * as React from 'react'
import { useMemo } from 'react'
import { Info, Mail, Shield, Users } from 'lucide-react'
import type { ECCFSession, WorkerRow } from '@/types'
import type { TeamUnitOption } from '@/lib/dashboard/attendance-constants'
import { ROLE_LABELS, getLeaderPostTitle } from '@/lib/dashboard/rbac'
import { formatCount } from '@/lib/dashboard/format'
import SendWorkerEmailCard, { getEligibleEmailWorkers } from './SendWorkerEmailCard'

interface WorkerEmailPanelProps {
  session: ECCFSession
  workers: WorkerRow[]
  teamOptions: TeamUnitOption[]
}

export default function WorkerEmailPanel({
  session,
  workers,
  teamOptions,
}: WorkerEmailPanelProps) {
  const isAdmin = session.role === 'admin'
  const senderTitle = getLeaderPostTitle(session) || ROLE_LABELS[session.role]

  const eligibleWorkers = useMemo(
    () => getEligibleEmailWorkers(workers, session),
    [workers, session]
  )

  const withEmailCount = useMemo(
    () => eligibleWorkers.filter((w) => Boolean(w.email?.trim())).length,
    [eligibleWorkers]
  )
  const missingEmailCount = eligibleWorkers.length - withEmailCount

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <SendWorkerEmailCard
        session={session}
        workers={workers}
        teamOptions={teamOptions}
        defaultExpanded={true}
        hideHeader={false}
      />

      <aside
        aria-label="Communication scope and readiness"
        className="space-y-4"
      >
        <div className="rounded-[var(--radius-card)] bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-primary/10 text-accent-foreground dark:text-primary">
              <Shield className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sender Profile
              </p>
              <h2 className="font-sans text-base font-semibold text-foreground">
                {senderTitle}
              </h2>
            </div>
          </div>

          <dl className="space-y-3 text-[13px]">
            <div className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] bg-surface-raised px-3.5 py-2.5">
              <dt className="inline-flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Reachable workers</span>
              </dt>
              <dd className="font-semibold text-foreground tabular-nums">
                {formatCount(withEmailCount)}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] bg-surface-raised px-3.5 py-2.5">
              <dt className="inline-flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Missing email</span>
              </dt>
              <dd className="font-semibold text-foreground tabular-nums">
                {formatCount(missingEmailCount)}
              </dd>
            </div>
          </dl>

          <div className="flex items-start gap-2.5 rounded-[var(--radius-control)] bg-surface-raised p-3.5 text-[13px] leading-relaxed text-muted-foreground">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="[text-wrap:pretty]">
              {isAdmin
                ? 'As CSGB Executive, you can message all fellowship workers, all EXCOs, a specific operational unit, or an individual worker.'
                : `You can broadcast updates to ${session.leadingTeam || session.team} or send direct emails to individual team members.`}
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}
