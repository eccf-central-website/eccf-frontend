/**
 * Dashboard group error boundary — catches errors thrown by the shell
 * layout (dashboard/layout.tsx), e.g. a failed session lookup, which the
 * segment's own error.tsx cannot. The shell is gone at this point, so this
 * renders a standalone panel; it still sits inside the group layout, so the
 * theme and Toaster are available. No "back" link: the overview shares the
 * failing layout.
 */

'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/dashboard/states/ErrorState'

export default function DashboardGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <ErrorState
        title="The dashboard couldn't load"
        description="We couldn't start your dashboard session. Try again, and if it keeps happening, let the tech team know the reference below."
        digest={error.digest}
        reset={reset}
        backHref={null}
        autoFocus
        headingLevel="h1"
        className="w-full max-w-lg"
      />
    </main>
  )
}
