/**
 * NavigationProgressBar — Global Top Route Transition Progress Bar
 *
 * Provides immediate feedback when users click links across pages,
 * rendering a modern animated glowing progress bar across the top of the browser.
 */

'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function NavigationProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)
  const [progress, setProgress] = useState(0)

  // Reset navigation indicator on route change complete
  useEffect(() => {
    setProgress(100)
    const timer = setTimeout(() => {
      setIsNavigating(false)
      setProgress(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  // Global listener on link clicks to start progress bar
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const anchor = target.closest('a')

      if (anchor && anchor.href) {
        try {
          const targetUrl = new URL(anchor.href, window.location.href)
          const isExternal = targetUrl.origin !== window.location.origin
          const isHashOnly = targetUrl.pathname === window.location.pathname && Boolean(targetUrl.hash)

          if (!isExternal && !isHashOnly && targetUrl.pathname !== window.location.pathname) {
            setIsNavigating(true)
            setProgress(25)
            setTimeout(() => setProgress(65), 100)
            setTimeout(() => setProgress(85), 300)
          }
        } catch {
          // Ignore invalid URLs
        }
      }
    }

    document.addEventListener('click', handleAnchorClick, { capture: true })
    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true })
    }
  }, [])

  return (
    <AnimatePresence>
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none bg-sky-100/20 overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            exit={{ opacity: 0 }}
            transition={{ ease: 'easeOut', duration: 0.25 }}
            className="h-full bg-gradient-to-r from-[#0095ff] via-sky-400 to-[#0095ff] shadow-[0_0_10px_#0095ff]"
          />
        </div>
      )}
    </AnimatePresence>
  )
}
