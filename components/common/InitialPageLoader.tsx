'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import LoadingState from './LoadingState'

/**
 * Routes that ship their own shell and loading states (the dashboard and its
 * auth pages). The branded intro must never mount over them: it only appears
 * after hydration, so it would paint *on top of* a fully rendered page and
 * look like the app flickering back to a splash screen.
 */
const APP_SHELL_PREFIXES = ['/dashboard', '/login', '/sign-up', '/register']
const INTRO_DURATION_MS = 400

export default function InitialPageLoader() {
  const pathname = usePathname() ?? ''
  const hasOwnShell = APP_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (hasOwnShell) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
    }, INTRO_DURATION_MS)

    return () => clearTimeout(timer)
  }, [hasOwnShell])

  if (!visible || hasOwnShell) return null

  return (
    <div className="pointer-events-none">
      <LoadingState
        fullscreen
        size="md"
        theme="light"
        message="Welcome to ECCF Family"
        subtext="Preparing fellowship space..."
      />
    </div>
  )
}
