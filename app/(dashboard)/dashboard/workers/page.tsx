/**
 * Workers — /dashboard/workers
 *
 * Role-scoped workforce directory, pending membership approvals queue,
 * and team/fellowship email communications.
 */

import { Suspense } from 'react'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import SectionEmpty from '@/components/dashboard/shell/SectionEmpty'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'
import WorkersClient from '@/components/dashboard/workers/WorkersClient'
import { requireSection } from '@/lib/dashboard/auth'
import { listWorkers } from '@/lib/dashboard/data'
import { lagosDate } from '@/lib/dashboard/dates'
import { formatDate } from '@/lib/dashboard/format'
import { getTeamUnitOptions } from '@/lib/teams'
import { getHallNames } from '@/lib/halls'

export const dynamic = 'force-dynamic'

interface WorkersPageProps {
  searchParams?:
    | Promise<{
        tab?: string
        search?: string
      }>
    | {
        tab?: string
        search?: string
      }
}

export default async function WorkersPage({ searchParams }: WorkersPageProps) {
  const session = await requireSection('workers')
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  const [rows, teamOptions, hallOptions] = await Promise.all([
    listWorkers(session),
    getTeamUnitOptions(),
    getHallNames(),
  ])

  if (rows.length === 0) {
    return (
      <SectionEmpty
        section="workers"
        title="No workers registered yet"
        description="Workers who register on the fellowship portal will appear here for Team Lead review and verification."
      />
    )
  }

  const today = formatDate(lagosDate())
  const initialTab =
    typeof resolvedSearchParams?.tab === 'string'
      ? resolvedSearchParams.tab
      : undefined
  const initialSearch =
    typeof resolvedSearchParams?.search === 'string'
      ? resolvedSearchParams.search
      : ''

  return (
    <PageContainer>
      <Suspense fallback={<TableSkeleton label="Loading workers…" columns={5} rows={6} />}>
        <WorkersClient
          rows={rows}
          session={session}
          teamOptions={teamOptions}
          hallOptions={hallOptions}
          initialTab={initialTab}
          initialSearch={initialSearch}
          today={today}
        />
      </Suspense>
    </PageContainer>
  )
}
