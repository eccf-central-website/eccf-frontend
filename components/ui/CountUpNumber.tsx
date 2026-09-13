/**
 * CountUpNumber — Animated Scroll-Triggered Counter Component
 *
 * Smoothly counts up from 0 to the target number when scrolled into view.
 * Supports optional suffix strings (e.g. "+", "yrs").
 * Optimized for mobile viewports: eliminates negative horizontal rootMargin
 * that previously prevented leftmost elements from intersecting on narrow screens.
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useInView } from 'framer-motion'

interface CountUpProps {
  end: number
  suffix?: string
  duration?: number
}

export default function CountUpNumber({ end, suffix = '', duration = 1.8 }: CountUpProps) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  
  // Standard inView without negative side margins (default 0px margin)
  const isInView = useInView(ref, { once: true })

  // Ensure animation triggers if already in visible viewport on initial load
  useEffect(() => {
    if (isInView) {
      setHasStarted(true)
      return
    }

    if (ref.current && typeof window !== 'undefined') {
      const rect = ref.current.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setHasStarted(true)
      }
    }
  }, [isInView])

  useEffect(() => {
    if (!hasStarted) return

    if (end <= 0) {
      setCount(end)
      return
    }

    let startTime: number | null = null
    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)

      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easedProgress * end))

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        setCount(end)
      }
    }

    animationFrameId = requestAnimationFrame(step)

    return () => cancelAnimationFrame(animationFrameId)
  }, [hasStarted, end, duration])

  return (
    <span ref={ref} className="inline-block">
      {count}
      {suffix}
    </span>
  )
}
