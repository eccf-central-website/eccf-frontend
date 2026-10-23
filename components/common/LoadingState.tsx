'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export interface LoadingStateProps {
  /** When true, renders centered full-viewport overlay with soft glassmorphic backdrop. */
  fullscreen?: boolean
  /** Size variant of the animated emblem and ring. */
  size?: 'sm' | 'md' | 'lg'
  /** Theme palette matching dark dashboard or light public pages. */
  theme?: 'light' | 'dark'
  /** Minimum milliseconds to display before allowing fade-out. */
  minDurationMs?: number
  /** Optional callback fired when the minimum display duration finishes. */
  onReady?: () => void
  /** Primary label message. Set to null or empty string to hide. */
  message?: string | null
  /** Optional secondary subtitle or caption. */
  subtext?: string | null
  /** Additional custom classes for wrapper container. */
  className?: string
}

export default function LoadingState({
  fullscreen = false,
  size = 'md',
  theme = 'light',
  minDurationMs,
  onReady,
  message = 'Connecting to fellowship...',
  subtext,
  className = '',
}: LoadingStateProps) {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!minDurationMs || minDurationMs <= 0) return

    const timer = setTimeout(() => {
      setFading(true)
      const hideTimer = setTimeout(() => {
        setVisible(false)
        onReady?.()
      }, 400) // 400ms fade duration
      return () => clearTimeout(hideTimer)
    }, minDurationMs)

    return () => clearTimeout(timer)
  }, [minDurationMs, onReady])

  if (!visible) return null

  const isDark = theme === 'dark'

  // Dimensions map for outer ring and inner emblem
  const sizeMap = {
    sm: {
      ring: 'h-12 w-12',
      glow: 'h-16 w-16',
      logo: 24,
      logoBox: 'h-6 w-6',
      fontSize: 'text-xs',
    },
    md: {
      ring: 'h-20 w-20',
      glow: 'h-28 w-28',
      logo: 40,
      logoBox: 'h-10 w-10',
      fontSize: 'text-sm',
    },
    lg: {
      ring: 'h-28 w-28',
      glow: 'h-36 w-36',
      logo: 56,
      logoBox: 'h-14 w-14',
      fontSize: 'text-base',
    },
  }[size]

  const content = (
    <div
      className={`flex flex-col items-center justify-center text-center select-none transition-opacity duration-400 ${
        fading ? 'opacity-0' : 'opacity-100'
      } ${className}`}
    >
      {/* Animated Emblem Anchor */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Blue Breathing Glow */}
        <div
          className={`absolute rounded-full bg-gradient-to-tr ${
            isDark
              ? 'from-sky-500/20 via-[#0095ff]/20 to-blue-600/15'
              : 'from-sky-400/25 via-[#0095ff]/20 to-blue-600/10'
          } blur-xl animate-pulse pointer-events-none ${sizeMap.glow}`}
          aria-hidden="true"
        />

        {/* Outer Orbiting Ring 1 (Smooth Clockwise Spin) */}
        <div
          className={`rounded-full border-2 border-transparent border-t-[#0095ff] border-r-sky-300/40 animate-spin transition-all duration-700 ease-linear ${sizeMap.ring}`}
          style={{ animationDuration: '1.4s' }}
          aria-hidden="true"
        />

        {/* Counter Orbiting Subtle Ring 2 (Gentle Counter-clockwise Spin) */}
        <div
          className={`absolute rounded-full border border-transparent border-b-sky-400/30 border-l-[#0095ff]/20 animate-spin pointer-events-none ${sizeMap.ring}`}
          style={{ animationDuration: '2.8s', animationDirection: 'reverse' }}
          aria-hidden="true"
        />

        {/* Centered ECCF Logo with Gentle Breathing Motion */}
        <div className={`absolute flex items-center justify-center ${sizeMap.logoBox}`}>
          <div className="relative h-full w-full animate-pulse transition-transform duration-1000 ease-in-out">
            <Image
              src="/logos/ECCF LOGO.png"
              alt="ECCF Logo"
              width={sizeMap.logo}
              height={sizeMap.logo}
              className="h-full w-full object-contain drop-shadow-sm"
              priority
            />
          </div>
        </div>
      </div>

      {/* Typography & Animated Dots Indicator */}
      {message && (
        <div className="mt-5 space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span
              className={`font-sans font-medium tracking-tight leading-none ${
                isDark ? 'text-slate-100' : 'text-slate-800'
              } ${sizeMap.fontSize}`}
            >
              {message}
            </span>
            {/* Elegant Sequential Bouncing Dots */}
            <span className="inline-flex items-center gap-0.5 ml-0.5 pt-0.5">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0095ff] animate-bounce"
                style={{ animationDelay: '0ms', animationDuration: '1s' }}
              />
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400 animate-bounce"
                style={{ animationDelay: '200ms', animationDuration: '1s' }}
              />
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300 animate-bounce"
                style={{ animationDelay: '400ms', animationDuration: '1s' }}
              />
            </span>
          </div>

          {subtext && (
            <p
              className={`text-xs font-normal tracking-wide max-w-xs mx-auto ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  )

  if (fullscreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-400 ${
          fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
        } ${isDark ? 'bg-slate-950/95 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md'}`}
      >
        {content}
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full py-12 flex items-center justify-center transition-opacity duration-400 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {content}
    </div>
  )
}
