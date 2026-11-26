'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export const THEME_STORAGE_KEY = 'eccf_dashboard_theme'

export interface LoadingStateProps {
  /** When true, renders centered full-viewport overlay with soft glassmorphic backdrop. */
  fullscreen?: boolean
  /** Size variant of the animated emblem and ring. */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Theme palette: 'light', 'dark', or 'auto'.
   * When 'auto' (default), dynamically adapts to the user's dashboard theme setting
   * (stored in localStorage under 'eccf_dashboard_theme'), the active <html> dark class,
   * or the current route context.
   */
  theme?: 'light' | 'dark' | 'auto'
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

function resolveThemeSetting(explicitTheme?: 'light' | 'dark' | 'auto'): 'light' | 'dark' {
  if (explicitTheme === 'light' || explicitTheme === 'dark') {
    return explicitTheme
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') return stored

      // If document element already has dark class, respect it
      if (document.documentElement.classList.contains('dark')) return 'dark'

      // Dashboard routes default to dark mode identity
      const pathname = window.location.pathname || ''
      if (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/sign-up')
      ) {
        return 'dark'
      }

      // Check OS/system preference as secondary fallback
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
    } catch {
      // In restricted environments, fallback below
    }
  }
  return 'light'
}

export default function LoadingState({
  fullscreen = false,
  size = 'md',
  theme = 'auto',
  minDurationMs,
  onReady,
  message = 'Connecting to fellowship...',
  subtext,
  className = '',
}: LoadingStateProps) {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveThemeSetting(theme)
  )

  useEffect(() => {
    if (theme === 'light' || theme === 'dark') {
      setResolvedTheme(theme)
      return
    }

    const syncTheme = () => {
      setResolvedTheme(resolveThemeSetting('auto'))
    }

    syncTheme()

    // Sync across tabs/windows when user toggles dashboard theme
    window.addEventListener('storage', syncTheme)

    // Observe class attribute changes on <html> (e.g. ThemeToggle clicking)
    const observer = new MutationObserver(() => {
      syncTheme()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      window.removeEventListener('storage', syncTheme)
      observer.disconnect()
    }
  }, [theme])

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

  const isDark = resolvedTheme === 'dark'

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
      className={`relative z-10 flex flex-col items-center justify-center text-center select-none transition-opacity duration-400 ${
        fading ? 'opacity-0' : 'opacity-100'
      } ${className}`}
    >
      {/* Animated Emblem Anchor */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Blue Breathing Glow */}
        <div
          className={`absolute rounded-full bg-gradient-to-tr transition-all duration-700 pointer-events-none ${
            isDark
              ? 'from-sky-500/25 via-[#0095ff]/30 to-blue-600/20 blur-2xl animate-pulse'
              : 'from-sky-400/25 via-[#0095ff]/20 to-blue-600/10 blur-xl animate-pulse'
          } ${sizeMap.glow}`}
          aria-hidden="true"
        />

        {/* Outer Orbiting Ring 1 (Smooth Clockwise Spin) */}
        <div
          className={`rounded-full border-2 border-transparent border-t-[#0095ff] animate-spin transition-all duration-700 ease-linear ${
            isDark
              ? 'border-r-sky-400/60 shadow-[0_0_18px_rgba(0,149,255,0.35)]'
              : 'border-r-sky-300/40'
          } ${sizeMap.ring}`}
          style={{ animationDuration: '1.4s' }}
          aria-hidden="true"
        />

        {/* Counter Orbiting Subtle Ring 2 (Gentle Counter-clockwise Spin) */}
        <div
          className={`absolute rounded-full border border-transparent animate-spin pointer-events-none transition-colors duration-500 ${
            isDark
              ? 'border-b-sky-300/40 border-l-[#0095ff]/30'
              : 'border-b-sky-400/30 border-l-[#0095ff]/20'
          } ${sizeMap.ring}`}
          style={{ animationDuration: '2.8s', animationDirection: 'reverse' }}
          aria-hidden="true"
        />

        {/* Centered ECCF Logo with Gentle Breathing Motion */}
        <div
          className={`absolute flex items-center justify-center rounded-full transition-all duration-500 ${
            isDark
              ? 'p-1.5 bg-white/[0.04] shadow-[0_0_16px_rgba(0,149,255,0.22)] border border-white/5'
              : ''
          } ${sizeMap.logoBox}`}
        >
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
              className={`font-sans font-semibold tracking-tight leading-none transition-colors duration-300 ${
                isDark ? 'text-slate-100 drop-shadow-sm' : 'text-slate-800'
              } ${sizeMap.fontSize}`}
            >
              {message}
            </span>
            {/* Elegant Sequential Bouncing Dots */}
            <span className="inline-flex items-center gap-1 ml-1 pt-0.5">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full bg-[#0095ff] animate-bounce transition-all ${
                  isDark ? 'shadow-[0_0_8px_rgba(0,149,255,0.7)]' : ''
                }`}
                style={{ animationDelay: '0ms', animationDuration: '1s' }}
              />
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400 animate-bounce transition-all ${
                  isDark ? 'shadow-[0_0_8px_rgba(56,189,248,0.7)]' : ''
                }`}
                style={{ animationDelay: '200ms', animationDuration: '1s' }}
              />
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300 animate-bounce transition-all ${
                  isDark ? 'shadow-[0_0_8px_rgba(125,211,252,0.7)]' : ''
                }`}
                style={{ animationDelay: '400ms', animationDuration: '1s' }}
              />
            </span>
          </div>

          {subtext && (
            <p
              className={`text-xs font-normal tracking-wide max-w-xs mx-auto transition-colors duration-300 ${
                isDark ? 'text-slate-400/90' : 'text-slate-500'
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
        } ${
          isDark
            ? 'bg-[#0a0e19]/96 backdrop-blur-xl text-slate-100'
            : 'bg-[#fafaf9]/92 backdrop-blur-md text-slate-800'
        }`}
      >
        {/* Soft Radial Atmospheric Aura */}
        {isDark ? (
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(0,149,255,0.14)_0%,rgba(10,14,25,0)_65%)]"
            aria-hidden="true"
          />
        ) : (
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(0,149,255,0.06)_0%,rgba(250,250,249,0)_70%)]"
            aria-hidden="true"
          />
        )}
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
