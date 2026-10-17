'use client'

import React from 'react'
import Link from 'next/link'
import { Eye, X } from 'lucide-react'

interface PreviewBannerProps {
  exitUrl?: string
}

export default function PreviewBanner({ exitUrl = '/api/exit-preview' }: PreviewBannerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-slate-900/95 text-white px-4 py-2.5 rounded-full shadow-2xl border border-sky-500/40 backdrop-blur-md text-xs font-medium">
      <span className="flex h-2 w-2 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <div className="flex items-center gap-1.5 text-slate-200">
        <Eye className="h-3.5 w-3.5 text-sky-400" />
        <span>Live Preview Mode (Unpublished Drafts)</span>
      </div>
      <Link
        href={exitUrl}
        prefetch={false}
        className="ml-2 inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded-full text-[11px] transition-colors"
        title="Exit preview mode"
      >
        <span>Exit</span>
        <X className="h-3 w-3" />
      </Link>
    </div>
  )
}
