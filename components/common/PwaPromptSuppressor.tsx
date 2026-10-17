'use client'

import { useEffect } from 'react'

/**
 * PwaPromptSuppressor — Prevents the browser's native PWA install prompt
 * from automatically popping up on public website pages.
 *
 * PWA installation is strictly reserved for authenticated Exco executives
 * within the /dashboard shell via the dedicated TopBar control.
 */
export default function PwaPromptSuppressor() {
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chromium / Edge / Android from automatically showing the install banner
      e.preventDefault()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  return null
}
