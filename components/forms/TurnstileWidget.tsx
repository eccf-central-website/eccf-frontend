'use client'

import { useEffect, useRef } from 'react'

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
}

export default function TurnstileWidget({
  onToken,
  resetSignal,
  hideFallbackText,
  size = 'normal',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

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
        theme: 'light',
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
  }, [siteKey, onToken, size])

  useEffect(() => {
    if (resetSignal === 0) return
    if (!siteKey && process.env.NODE_ENV !== 'production') {
      onToken('development-bypass')
      return
    }
    onToken('')
    if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current)
  }, [resetSignal, onToken, siteKey])

  return (
    <div className={siteKey ? "min-h-[66px]" : ""} aria-live="polite">
      {siteKey ? (
        <div ref={containerRef} />
      ) : hideFallbackText ? null : process.env.NODE_ENV === 'production' ? (
        <p className="text-xs text-amber-800" role="status">The security check is not configured yet. Please contact the fellowship administrator.</p>
      ) : (
        <p className="text-xs text-slate-500">Bot-check bypass is available in local development only.</p>
      )}
    </div>
  )
}
