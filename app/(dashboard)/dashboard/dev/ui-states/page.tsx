/**
 * UI states gallery — /dashboard/dev/ui-states (dev only)
 *
 * Renders every F4 primitive in one place so they can be reviewed at each
 * breakpoint before F2/F3/F5 consume them, including states no page can
 * reach yet (the no-results EmptyState). Not in the nav; 404s unless the
 * mock session is enabled, which is never true in production (where the
 * shell layout has already redirected to /login anyway).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarCheck, HeartHandshake, Plus, Scale, TrendingUp, UserPlus } from 'lucide-react'
import { isMockAuthEnabled } from '@/lib/dashboard/auth'
import { formatNaira } from '@/lib/dashboard/format'
import ActivityList, { ActivityItem, RelativeTime } from '@/components/dashboard/overview/ActivityList'
import StatCard from '@/components/dashboard/overview/StatCard'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import EmptyState from '@/components/dashboard/states/EmptyState'
import ErrorState from '@/components/dashboard/states/ErrorState'
import FeedSkeleton from '@/components/dashboard/states/FeedSkeleton'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import { StatGridSkeleton } from '@/components/dashboard/states/StatCardSkeleton'
import TableSkeleton from '@/components/dashboard/states/TableSkeleton'
import { ClearFiltersDemo, ToastDemo } from '@/components/dashboard/states/dev/ToastDemo'
import { Button } from '@/components/dashboard/ui/button'

export const metadata: Metadata = {
  title: 'UI states gallery — Exco Dashboard',
}

function GallerySection({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-serif text-lg text-foreground">{title}</h3>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

export default function UiStatesGalleryPage() {
  if (!isMockAuthEnabled()) notFound()

  return (
    <PageContainer className="space-y-10">
      <div className="space-y-1">
        <h2 className="font-serif text-2xl text-foreground">UI states gallery</h2>
        <p className="text-sm text-muted-foreground">
          Dev only. Every loading, empty, error and toast primitive from{' '}
          <code className="font-mono text-xs">components/dashboard/states</code>.
        </p>
      </div>

      <GallerySection title="Page header + stat grid" note="1 column, 2 from sm, 4 from xl.">
        <PageHeaderSkeleton action announce={false} />
        <StatGridSkeleton />
      </GallerySection>

      <GallerySection
        title="Stat cards"
        note="Every tone, linked and unlinked. Tone colours the icon chip only; the caption carries the meaning."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard id="g-primary" label="First-timers this month" icon={<UserPlus />} value="12" rawValue={12} caption="Since 1 October" tone="primary" href="/dashboard/first-timers" linkLabel="View first-timers" />
          <StatCard id="g-warning" label="Pending welfare requests" icon={<HeartHandshake />} value="3" rawValue={3} caption="Needs follow-up" tone="warning" href="/dashboard/welfare" linkLabel="View welfare" />
          <StatCard id="g-success" label="Income this month" icon={<TrendingUp />} value={formatNaira(143500)} rawValue={143500} caption="Since 1 October" tone="success" />
          <StatCard id="g-destructive" label="Net this month" icon={<Scale />} value={formatNaira(-4000)} rawValue={-4000} caption="Deficit" tone="destructive" />
          <StatCard id="g-muted" label="Last service attendance" icon={<CalendarCheck />} value="—" caption="No services recorded yet" tone="muted" />
        </div>
      </GallerySection>

      <GallerySection title="Recent activity" note="List, empty and inline block error. Stacked below lg.">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ActivityList id="g-activity" title="Recent first-timers" viewAllHref="/dashboard/first-timers" viewAllNoun="first-timers">
            <ul className="divide-y">
              <ActivityItem aside={<RelativeTime value="2026-10-08" title="8 Oct 2026" label="yesterday" />}>
                <p className="truncate text-sm font-medium text-foreground">Sample Person</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">Economics · 100 level · Hall A</p>
              </ActivityItem>
            </ul>
          </ActivityList>
          <ActivityList id="g-activity-empty" title="Recent welfare requests" viewAllHref="/dashboard/welfare" viewAllNoun="welfare requests">
            <EmptyState
              headingLevel="h4"
              icon={<HeartHandshake />}
              title="No welfare requests yet"
              description="Requests submitted through the Connect form will show up here."
              className="rounded-none border-0 bg-transparent py-10 sm:py-10"
            />
          </ActivityList>
        </div>
        <ErrorState
          headingLevel="h3"
          title="This section couldn't load"
          description="Something went wrong while fetching it. The rest of the page is unaffected."
          digest="1234567890"
          backHref={null}
          className="py-8 sm:py-10"
        />
      </GallerySection>

      <GallerySection title="Table" note="Table from md; stacked cards below md.">
        <TableSkeleton rows={4} />
      </GallerySection>

      <GallerySection title="Feed" note="With welfare's status tabs.">
        <FeedSkeleton items={2} tabs />
      </GallerySection>

      <GallerySection title="Empty — nothing yet">
        <EmptyState
          headingLevel="h3"
          title="No attendance entries yet"
          description="Record the first service's headcount and it will show up here."
          action={
            <Button asChild className="h-10">
              <Link href="/dashboard/attendance">
                <Plus aria-hidden="true" />
                Add the first entry
              </Link>
            </Button>
          }
        />
      </GallerySection>

      <GallerySection title="Empty — no results">
        <EmptyState
          variant="no-results"
          headingLevel="h3"
          title="No workers match those filters"
          description="Try a different search, or clear the filters to see everyone."
          action={<ClearFiltersDemo />}
        />
      </GallerySection>

      <GallerySection title="Error" note="Inline use: Retry refreshes; no reset() outside an error.tsx.">
        <ErrorState headingLevel="h3" digest="1234567890" backHref={null} />
      </GallerySection>

      <GallerySection title="Toasts" note="Success 4s, error 8s; same-id toasts replace each other.">
        <ToastDemo />
      </GallerySection>
    </PageContainer>
  )
}
