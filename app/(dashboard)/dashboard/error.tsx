/**
 * Dashboard page error boundary — catches errors from every page under
 * /dashboard (not the shell layout itself; see ../error.tsx), so the
 * sidebar, top bar and dev switcher stay usable while it shows.
 *
 * redirect()/notFound() are not caught here: Next rethrows them.
 */

'use client'

import { useEffect } from 'react'
import PageContainer from '@/components/dashboard/shell/PageContainer'
import ErrorState from '@/components/dashboard/states/ErrorState'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Dev visibility only; the UI never shows error.message.
    console.error(error)
  }, [error])

  return (
    <PageContainer>
      <ErrorState
        title="This page couldn't load"
        description="Something went wrong while fetching the latest data. Try again in a moment."
        digest={error.digest}
        reset={reset}
        autoFocus
      />
    </PageContainer>
  )
}
