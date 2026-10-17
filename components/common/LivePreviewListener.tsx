'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * LivePreviewListener — eccf-frontend
 *
 * Listens for real-time document change messages posted across the
 * iframe window boundary from Sanity Studio's WebPreviewPane.
 * Calls router.refresh() so Server Components immediately re-fetch
 * and render the latest in-progress draft edits without full-page reloads.
 */
export default function LivePreviewListener() {
  const router = useRouter()
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const followUpTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Only activate when running inside an iframe (Sanity Studio split pane)
    if (typeof window === 'undefined' || window.self === window.top) {
      return
    }

    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'ECCF_STUDIO_LIVE_UPDATE') {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
        if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current)

        // Stage 1: Quick refresh for rapid preview feedback (~350ms)
        refreshTimerRef.current = setTimeout(() => {
          router.refresh()
        }, 350)

        // Stage 2: Follow-up refresh to ensure Sanity Content Lake propagation is caught (~1200ms)
        followUpTimerRef.current = setTimeout(() => {
          router.refresh()
        }, 1200)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current)
    }
  }, [router])

  return null
}
