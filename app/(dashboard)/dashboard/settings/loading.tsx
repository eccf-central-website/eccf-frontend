/**
 * Privileged Settings loading skeleton — /dashboard/settings/loading.tsx
 * Mirrors the settings page geometry: PageHeader, tab strip, and one
 * borderless tonal panel.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import { Skeleton } from '@/components/dashboard/ui/skeleton'

export default function SettingsLoading() {
  return (
    <PageContainer>
      <LoadingRegion label="Loading settings…" announce={true}>
        <div className="space-y-6">
          <PageHeaderSkeleton announce={false} action={false} />

          <div aria-hidden="true" className="flex flex-col gap-6">
            {/* Tab strip */}
            <Skeleton className="h-[52px] w-full max-w-xl rounded-[var(--radius-control)]" />

            {/* Active panel */}
            <div className="space-y-5 rounded-[var(--radius-card)] bg-card p-5 shadow-sm sm:p-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-56 rounded-md" />
                <Skeleton className="h-4 w-full max-w-xl rounded-md" />
              </div>

              <div className="space-y-3 rounded-[var(--radius-card)] bg-surface-raised p-6">
                <Skeleton className="mx-auto h-12 w-12 rounded-full" />
                <Skeleton className="mx-auto h-5 w-44 rounded-md" />
                <Skeleton className="mx-auto h-3.5 w-72 max-w-full rounded-md" />
              </div>

              <div className="flex flex-col justify-end gap-3 sm:flex-row">
                <Skeleton className="h-11 w-full rounded-[var(--radius-control)] sm:w-40" />
              </div>
            </div>
          </div>
        </div>
      </LoadingRegion>
    </PageContainer>
  )
}
