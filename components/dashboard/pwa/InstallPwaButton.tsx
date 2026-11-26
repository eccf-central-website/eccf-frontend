/**
 * InstallPwaButton — Interactive PWA Installation Control
 *
 * Allows Exco members to install the ECCF Portal as a standalone web application
 * on Mobile (Android / iOS) and Desktop (Windows / Mac / Linux).
 *
 * Capabilities:
 * - Captures the native `beforeinstallprompt` event for 1-click install on Chrome, Edge & Android
 * - Provides accessible Dialog guidance for iOS Safari (Share -> Add to Home Screen) & desktop fallbacks
 * - Automatically hides when the app is already running in standalone/installed mode
 */

'use client'

import { useState, useEffect } from 'react'
import { Download, Smartphone, Share, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/dashboard/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export interface InstallPwaGuideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isIos: boolean
}

export function InstallPwaGuideDialog({
  open,
  onOpenChange,
  isIos,
}: InstallPwaGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5 shrink-0" aria-hidden="true" />
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="font-sans text-base font-semibold leading-tight text-foreground">
                Install ECCF Exco Dashboard
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-[13px] text-muted-foreground">
                Add to Home Screen or Desktop
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isIos ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">To install on your iPhone or iPad:</p>
            <ol className="space-y-2.5 pl-1">
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </span>
                <span>
                  Tap the <strong className="text-foreground">Share</strong> icon{' '}
                  <Share
                    className="inline h-4 w-4 shrink-0 align-text-bottom text-primary"
                    aria-hidden="true"
                  />{' '}
                  at the bottom of Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong>{' '}
                  <Plus
                    className="inline h-4 w-4 shrink-0 align-text-bottom text-primary"
                    aria-hidden="true"
                  />
                  .
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  3
                </span>
                <span>
                  Tap <strong className="text-foreground">Add</strong> in the top-right corner.
                </span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">To install on your PC or Android:</p>
            <ol className="space-y-2.5 pl-1">
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </span>
                <span>
                  Click the <strong className="text-foreground">Install icon</strong> in your
                  browser&apos;s address bar (top right).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  2
                </span>
                <span>
                  Select <strong className="text-foreground">Install</strong> to pin ECCF Exco
                  Dashboard to your taskbar or app drawer.
                </span>
              </li>
            </ol>
          </div>
        )}

        <DialogFooter className="border-t border-border pt-3">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="min-h-11 rounded-full px-5 text-sm font-semibold md:min-h-10"
          >
            Got It
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export interface InstallPwaButtonProps {
  variant?: 'button' | 'menu'
  className?: string
  /** Optional handler to open the guidance dialog outside a closing menu/sheet. */
  onOpenGuide?: (isIosDevice: boolean) => void
}

export default function InstallPwaButton({
  variant = 'button',
  className,
  onOpenGuide,
}: InstallPwaButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosModal, setShowIosModal] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://')

      setIsStandalone(isStandaloneMode)
    }

    checkStandalone()

    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIos(isIosDevice)

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

  if (isStandalone || installed) {
    return null
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true)
      }
      setDeferredPrompt(null)
    } else if (onOpenGuide) {
      onOpenGuide(isIos)
    } else {
      setShowIosModal(true)
    }
  }

  return (
    <>
      {variant === 'menu' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={cn(
            'group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-accent focus:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]',
            className
          )}
          aria-label="Install ECCF Exco Portal"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
          </div>
          <span className="flex-1 truncate text-[13px] text-foreground font-medium">Install App</span>
          <span className="rounded-full border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            PWA
          </span>
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleInstallClick}
          className={cn(
            'min-h-11 min-w-11 shrink-0 justify-center gap-2 rounded-full border-primary/25 bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15 hover:text-primary md:min-h-10',
            className
          )}
          title="Install ECCF Exco Portal on this PC or Phone"
          aria-label="Install ECCF Exco Portal"
        >
          <Download className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="hidden sm:inline">Install App</span>
        </Button>
      )}

      {!onOpenGuide && (
        <InstallPwaGuideDialog
          open={showIosModal}
          onOpenChange={setShowIosModal}
          isIos={isIos}
        />
      )}
    </>
  )
}
