/**
 * Privileged Settings loading skeleton — /dashboard/settings/loading.tsx
 * Mirrors the settings page geometry: date eyebrow, title, tab strip and one
 * borderless tonal panel.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'

export default function SettingsLoading() {
  return (
    <PageContainer>
      <LoadingRegion label="Loading settings…" announce={true}>
        <div className="space-y-6">
          {/* Date-only eyebrow + title */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 rounded-md" />
            <Skeleton className="h-8 w-72 max-w-full rounded-xl sm:h-9" />
            <Skeleton className="h-4 w-full max-w-lg rounded-md" />
          </div>

          <div className="flex flex-col gap-6">
            {/* Tab strip */}
            <Skeleton className="h-[52px] w-full max-w-xl rounded-xl" />

            {/* One active panel */}
            <div className="space-y-5 rounded-2xl bg-card p-5 sm:p-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-56 rounded-md" />
                <Skeleton className="h-3.5 w-full max-w-xl rounded-md" />
              </div>

              <div className="space-y-3 rounded-xl bg-muted/30 p-6">
                <Skeleton className="mx-auto h-12 w-12 rounded-full" />
                <Skeleton className="mx-auto h-5 w-44 rounded-md" />
                <Skeleton className="mx-auto h-3 w-72 max-w-full rounded-md" />
              </div>

              <div className="flex flex-col justify-end gap-3 sm:flex-row">
                <Skeleton className="h-11 w-full rounded-xl sm:w-40" />
              </div>
            </div>
          </div>
        </div>
      </LoadingRegion>
    </PageContainer>
  )
}
