/**
 * Privileged Settings loading skeleton — /dashboard/settings/loading.tsx
 * Mirrors the settings page geometry with borderless tonal panels and theme-aware shimmer.
 */

import PageContainer from '@/components/dashboard/shell/PageContainer'
import PageHeaderSkeleton from '@/components/dashboard/states/PageHeaderSkeleton'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import LoadingRegion from '@/components/dashboard/states/LoadingRegion'

export default function SettingsLoading() {
  return (
    <PageContainer>
      <LoadingRegion label="Loading settings…" announce={true}>
        <div className="space-y-6">
          <PageHeaderSkeleton announce={false} action={false} />

          <div className="space-y-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-card shadow-sm border-0 p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-start gap-3.5">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-5 w-48 rounded-md" />
                    <Skeleton className="h-3.5 w-80 max-w-full rounded-md" />
                  </div>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Skeleton className="h-11 flex-1 rounded-xl" />
                  <Skeleton className="h-11 w-full sm:w-40 shrink-0 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </LoadingRegion>
    </PageContainer>
  )
}
