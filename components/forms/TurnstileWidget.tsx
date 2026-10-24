'use client'

import { useEffect, useRef, useState } from 'react'

interface TurnstileOptions {
  sitekey: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
}

interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileOptions): string
  reset(widgetId: string): void
  remove(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

interface Props {
  onToken: (token: string) => void
  resetSignal: number
  hideFallbackText?: boolean
  size?: 'normal' | 'compact' | 'flexible'
  /** Cloudflare widget theme. Use `dark` on dark panels so the badge blends in. */
  theme?: 'light' | 'dark' | 'auto'
}

/**
 * Cloudflare renders a fixed-size iframe (300×65 for `normal`, 150×140 for
 * `compact`) and refuses to shrink below that, which made the badge overflow
 * narrow mobile cards. We measure the available width and scale the whole
 * widget down (and reserve the matching height) so it always fits its box.
 */
const BASE_SIZES = {
  normal: { width: 300, height: 65 },
  compact: { width: 150, height: 140 },
  flexible: { width: 300, height: 65 },
} as const

export default function TurnstileWidget({
  onToken,
  resetSignal,
  hideFallbackText,
  size = 'normal',
  theme = 'light',
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const base = BASE_SIZES[size]
  const [scale, setScale] = useState(1)

  // Shrink to fit the parent card, however narrow the viewport is.
  useEffect(() => {
    if (!siteKey) return
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const measure = () => {
      const available = wrapper.clientWidth
      if (!available) return
      setScale(available < base.width ? available / base.width : 1)
    }

    measure()
    window.addEventListener('resize', measure)
    if (typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(wrapper)
    return () => {
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [siteKey, base.width])

  useEffect(() => {
    if (!siteKey) {
      if (process.env.NODE_ENV !== 'production') onToken('development-bypass')
      return
    }

    let disposed = false
    let script = document.querySelector<HTMLScriptElement>('script[data-eccf-turnstile]')
    const renderWidget = () => {
      if (disposed || !window.turnstile || !containerRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else if (script) {
      script.addEventListener('load', renderWidget)
    } else {
      script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.eccfTurnstile = 'true'
      script.addEventListener('load', renderWidget)
      document.head.appendChild(script)
    }

    return () => {
      disposed = true
      script?.removeEventListener('load', renderWidget)
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey, onToken, size, theme])

  useEffect(() => {
    if (resetSignal === 0) return
    if (!siteKey && process.env.NODE_ENV !== 'production') {
      onToken('development-bypass')
      return
    }
    onToken('')
    if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current)
  }, [resetSignal, onToken, siteKey])

  if (!siteKey) {
    return (
      <div aria-live="polite">
        {hideFallbackText ? null : process.env.NODE_ENV === 'production' ? (
          <p className="text-xs text-amber-800" role="status">The security check is not configured yet. Please contact the fellowship administrator.</p>
        ) : (
          <p className="text-xs text-slate-500">Bot-check bypass is available in local development only.</p>
        )}
      </div>
    )
  }

  return (
    <div
      ref={wrapperRef}
      className="w-full max-w-full"
      style={{ height: Math.ceil(base.height * scale), overflow: 'hidden' }}
      aria-live="polite"
    >
      <div
        style={
          scale < 1
            ? { width: base.width, transform: `scale(${scale})`, transformOrigin: 'top left' }
            : { width: size === 'flexible' ? '100%' : base.width, marginInline: size === 'flexible' ? undefined : 'auto' }
        }
      >
        <div ref={containerRef} />
      </div>
    </div>
  )
}
