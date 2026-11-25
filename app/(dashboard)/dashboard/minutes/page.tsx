/**
 * Meeting Minutes — /dashboard/minutes
 *
 * Implements the CSGB Secretariat & EXCO Meeting Minutes Archive:
 * - CSGB members: full read/write/organize access (create, edit, folder/type organization,
 *   pin, archive, toggle action items, post for EXCO view or unpost to CSGB draft, delete).
 * - Non-CSGB EXCOs (Team Leads, Finance, Hall Pastors): strictly read-only access to
 *   minutes posted for EXCO view (`isPostedToExcos === true && !archived`).
 * - Uses SSR streaming via <Suspense> + <BlockErrorBoundary> containment.
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import MeetingMinutesClient from '@/components/dashboard/minutes/MeetingMinutesClient'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import BlockErrorBoundary from '@/components/dashboard/states/BlockErrorBoundary'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'
import { requireSection, type DashboardSession } from '@/lib/dashboard/auth'
import { listMeetingMinutes } from '@/lib/dashboard/data'
import { lagosDate } from '@/lib/dashboard/dates'
import { formatDate } from '@/lib/dashboard/format'
import { isCSGBMember } from '@/lib/dashboard/rbac'

export const metadata: Metadata = {
  title: 'Meeting Minutes — ECCF Exco Dashboard',
  description:
    'Write, organize, and share fellowship meeting minutes across CSGB and EXCO leadership.',
}

export const dynamic = 'force-dynamic'

function MinutesContentSkeleton() {
  return (
    <LoadingRegion label="Loading meeting minutes…" announce={false}>
      <div className="space-y-6">
        <PageHeaderSkeleton announce={false} action={true} />
        <StatGridSkeleton count={4} announce={false} />
        <TableSkeleton
          rows={5}
          columns={6}
          pagination={false}
          announce={false}
          label="Loading meeting minutes…"
        />
      </div>
    </LoadingRegion>
  )
}

async function MeetingMinutesContent({ session }: { session: DashboardSession }) {
  const minutes = await listMeetingMinutes(session)
  const canManage = isCSGBMember(session)
  const todayLabel = formatDate(lagosDate())
  const recorderDefaultName = session.name?.trim() || session.excoPosition?.trim() || ''

  return (
    <MeetingMinutesClient
      initialMinutes={minutes}
      canManage={canManage}
      recorderDefaultName={recorderDefaultName}
      today={todayLabel}
    />
  )
}

export default async function MeetingMinutesPage() {
  const session = await requireSection('meetingMinutes')

  return (
    <PageContainer>
      <BlockErrorBoundary title="Meeting minutes couldn't load">
        <Suspense fallback={<MinutesContentSkeleton />}>
          <MeetingMinutesContent session={session} />
        </Suspense>
      </BlockErrorBoundary>
    </PageContainer>
  )
}
