'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, X } from 'lucide-react'

interface PreviewBannerProps {
  exitUrl?: string
}

export default function PreviewBanner({ exitUrl = '/api/exit-preview' }: PreviewBannerProps) {
  const [isInsideIframe, setIsInsideIframe] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // If rendered inside Sanity Studio iframe, hide the banner completely to avoid blocking page content
    if (typeof window !== 'undefined' && window.self !== window.top) {
      setIsInsideIframe(true)
      return
    }

    if (typeof window !== 'undefined' && sessionStorage.getItem('dismiss_preview_banner') === '1') {
      setIsDismissed(true)
    }
  }, [])

  if (isInsideIframe || isDismissed) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    try {
      sessionStorage.setItem('dismiss_preview_banner', '1')
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 flex items-center gap-2.5 bg-slate-900/90 text-white pl-3.5 pr-2 py-2 rounded-full shadow-2xl border border-sky-500/30 backdrop-blur-md text-xs font-medium transition-all animate-in fade-in slide-in-from-bottom-2">
      <span className="flex h-2 w-2 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <div className="flex items-center gap-1.5 text-slate-200">
        <Eye className="h-3.5 w-3.5 text-sky-400" />
        <span className="hidden sm:inline">Preview Mode (Unpublished Drafts)</span>
        <span className="sm:hidden">Previewing</span>
      </div>
      <Link
        href={exitUrl}
        prefetch={false}
        className="ml-1 inline-flex items-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded-full text-[11px] transition-colors"
        title="Exit preview mode"
      >
        Exit
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors focus:outline-none"
        title="Dismiss notice"
        aria-label="Dismiss notice"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
