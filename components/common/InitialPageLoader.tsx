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

export default function InitialPageLoader() {
  const pathname = usePathname() ?? ''
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(true)

  useEffect(() => {
    setMounted(true)
    // Hold the loading animation for 2.2 seconds so visitors can enjoy the branded transition
    const timer = setTimeout(() => {
      setActive(false)
    }, 2200)

    return () => clearTimeout(timer)
  }, [])

  const hasOwnShell = APP_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (!mounted || !active || hasOwnShell) return null

  return (
    <LoadingState
      fullscreen
      size="md"
      theme="light"
      message="Welcome to ECCF Family"
      subtext="Preparing fellowship space..."
    />
  )
}
