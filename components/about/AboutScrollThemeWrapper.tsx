/**
 * AboutScrollThemeWrapper — Scroll-Driven Dynamic Page Background Animation
 *
 * Implements an interactive scroll animation where the page background
 * dynamically and gradually transitions from light (#fafaf9) to midnight dark (#0d1117)
 * on scroll advance as the user enters the Leadership gallery, and smoothly
 * returns to light (#fafaf9) as the user advances into Operational Teams.
 */

'use client'

import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface AboutScrollThemeWrapperProps {
  pillars: React.ReactNode
  leadership: React.ReactNode
  teams: React.ReactNode
}

export default function AboutScrollThemeWrapper({
  pillars,
  leadership,
  teams,
}: AboutScrollThemeWrapperProps) {
  const entrySentinelRef = useRef<HTMLDivElement>(null)
  const exitSentinelRef = useRef<HTMLDivElement>(null)

  // Track the entry transition: As the Pillars/Leadership boundary scrolls into view
  const { scrollYProgress: entryProgress } = useScroll({
    target: entrySentinelRef,
    offset: ['start 0.9', 'start 0.25'],
  })

  // Track the exit transition: As the Leadership/Teams boundary scrolls into view
  const { scrollYProgress: exitProgress } = useScroll({
    target: exitSentinelRef,
    offset: ['start 0.75', 'start 0.15'],
  })

  // Dynamic continuous RGB interpolation:
  // Starts at light stone #fafaf9 (rgb 250, 250, 249)
  // Gradually darkens to midnight dark #0d1117 (rgb 13, 17, 23) as the user scrolls into Leadership
  // Holds at #0d1117 throughout all leadership tiers & cards
  // Gradually returns to light #fafaf9 as the user scrolls down into Operational Teams
  const backgroundColor = useTransform(
    [entryProgress, exitProgress],
    (values: number[]) => {
      const entry = values[0] ?? 0
      const exit = values[1] ?? 0
      if (exit <= 0) {
        const t = Math.max(0, Math.min(1, entry))
        const r = Math.round(250 + (13 - 250) * t)
        const g = Math.round(250 + (17 - 250) * t)
        const b = Math.round(249 + (23 - 249) * t)
        return `rgb(${r}, ${g}, ${b})`
      } else {
        const t = Math.max(0, Math.min(1, exit))
        const r = Math.round(13 + (250 - 13) * t)
        const g = Math.round(17 + (250 - 17) * t)
        const b = Math.round(23 + (249 - 23) * t)
        return `rgb(${r}, ${g}, ${b})`
      }
    }
  )

  return (
    <motion.div
      style={{ backgroundColor }}
      className="relative w-full"
    >
      {pillars}
      <div
        ref={entrySentinelRef}
        className="h-px w-full pointer-events-none opacity-0"
        aria-hidden="true"
      />
      {leadership}
      <div
        ref={exitSentinelRef}
        className="h-px w-full pointer-events-none opacity-0"
        aria-hidden="true"
      />
      {teams}
    </motion.div>
  )
}
