/**
 * InstallPwaButton — Interactive PWA Installation Control
 *
 * Allows Exco members to install the ECCF Portal as a standalone web application
 * on Mobile (Android / iOS) and Desktop (Windows / Mac / Linux).
 *
 * Capabilities:
 * - Captures the native `beforeinstallprompt` event for 1-click install on Chrome, Edge & Android
 * - Provides step-by-step guidance for iOS Safari (Share -> Add to Home Screen)
 * - Automatically hides when the app is already running in standalone/installed mode
 */

'use client'

import { useState, useEffect } from 'react'
import { Download, Smartphone, Share, Plus, X } from 'lucide-react'
import { Button } from '@/components/dashboard/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosModal, setShowIosModal] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // 1. Check if already installed / running as standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://')

      setIsStandalone(isStandaloneMode)
    }

    checkStandalone()

    // 2. Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIos(isIosDevice)

    // 3. Listen for browser install prompt (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      setShowIosModal(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // If already running in standalone mode or just installed, hide the button
  if (isStandalone || installed) {
    return null
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Native Chromium / Android prompt
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true)
      }
      setDeferredPrompt(null)
    } else if (isIos) {
      // Show iOS Safari Instructions modal
      setShowIosModal(true)
    } else {
      // Fallback for browsers without direct prompt (e.g. desktop Chrome where prompt hasn't triggered yet)
      setShowIosModal(true)
    }
  }

  return (
    <>
      {/* Topbar / Action Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleInstallClick}
        className="h-8 w-8 shrink-0 justify-center rounded-full border-sky-300/80 bg-sky-50/70 p-0 text-[#0077cc] hover:bg-sky-100/80 hover:text-sky-900 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3 transition-all shadow-2xs"
        title="Install ECCF Exco Portal on this PC or Phone"
        aria-label="Install ECCF Exco Portal"
      >
        <Download className="h-4 w-4 shrink-0 text-[#0095ff]" />
        <span className="hidden sm:inline">Install App</span>
      </Button>

      {/* Guidance Modal for iOS Safari / Unsupported Browsers */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[24px] bg-background border border-border p-5 sm:p-6 shadow-2xl text-left relative">
            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 shrink-0" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#0077cc] border border-sky-200/60 dark:bg-sky-950/50 dark:border-sky-800">
                <Smartphone className="h-5 w-5 shrink-0" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-foreground leading-tight">
                  Install ECCF Portal
                </h3>
                <p className="text-xs text-muted-foreground">Add to Home Screen or Desktop</p>
              </div>
            </div>

            {isIos ? (
              <div className="space-y-3 text-xs text-muted-foreground">
                <p className="text-foreground font-medium">To install on your iPhone or iPad:</p>
                <ol className="space-y-2.5 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                      1
                    </span>
                    <span>
                      Tap the <strong className="text-foreground">Share</strong> icon{' '}
                      <Share className="inline h-3.5 w-3.5 shrink-0 text-[#0077cc] align-text-bottom" /> at the
                      bottom of Safari.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                      2
                    </span>
                    <span>
                      Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong>{' '}
                      <Plus className="inline h-3.5 w-3.5 shrink-0 text-[#0077cc] align-text-bottom" />.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                      3
                    </span>
                    <span>
                      Tap <strong className="text-foreground">Add</strong> in the top-right corner.
                    </span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-muted-foreground">
                <p className="text-foreground font-medium">To install on your PC or Android:</p>
                <ol className="space-y-2 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                      1
                    </span>
                    <span>
                      Click the <strong className="text-foreground">Install icon</strong> in your browser&apos;s address bar (top right).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                      2
                    </span>
                    <span>
                      Select <strong className="text-foreground">Install</strong> to pin ECCF Portal to your taskbar or app drawer.
                    </span>
                  </li>
                </ol>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-border flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={() => setShowIosModal(false)}
                className="rounded-full text-xs font-bold px-4"
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
