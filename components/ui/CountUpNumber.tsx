/**
 * CountUpNumber — Animated Scroll-Triggered Counter Component
 *
 * Smoothly counts up from 0 to the target number when scrolled into view.
 * Supports optional suffix strings (e.g. "+", "yrs").
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useInView } from 'framer-motion'

interface CountUpProps {
  end: number
  suffix?: string
  duration?: number
}

export default function CountUpNumber({ end, suffix = '', duration = 2 }: CountUpProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!isInView) return

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
  }, [isInView, end, duration])

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  )
}
