/**
 * PageMaintenance — the visitor-facing screen shown when an editor ticks a
 * page under "Maintenance Mode" in Sanity Studio.
 *
 * Deliberately chrome-free: the public layout renders this INSTEAD of the
 * Navbar / Footer / launcher so the page reads as intentionally paused rather
 * than broken. Copy is fully editable from Sanity (Site Settings → Maintenance
 * Mode), with sensible fallbacks here.
 */

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Clock3, Mail, RotateCw, Wrench } from 'lucide-react'

interface PageMaintenanceProps {
  headline?: string
  message?: string
  eta?: string
  contactEmail?: string
  showHomeLink?: boolean
}

export default function PageMaintenance({
  headline,
  message,
  eta,
  contactEmail,
  showHomeLink = true,
}: PageMaintenanceProps) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0d1117] px-6 py-20 text-white">
      {/* Meta */}
      <meta name="robots" content="noindex, nofollow" />

      {/* Ambient light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,149,255,0.16),transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-sky-500/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-10 h-72 w-72 rounded-full bg-emerald-400/10 blur-[130px]"
      />

      <div className="relative z-10 w-full max-w-xl text-center">
        <Image
          src="/logos/ECCF LOGO.png"
          alt="ECCF crest"
          width={56}
          height={56}
          className="mx-auto h-14 w-14 object-contain drop-shadow-[0_6px_18px_rgba(0,149,255,0.35)]"
          priority
        />

        <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-sky-300 ring-1 ring-white/10">
          <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
          Page under maintenance
        </span>

        <h1 className="mt-5 font-serif text-3xl leading-[1.12] tracking-tight sm:text-4xl">
          {headline || 'We will be right back.'}
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">
          {message ||
            'We are updating this page with fresh information. Please check back shortly.'}
        </p>

        {eta && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-300 ring-1 ring-white/10">
            <Clock3 className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
            {eta}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0095ff] px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-[#0080e0] sm:w-auto ${
              showHomeLink ? '' : 'hidden'
            }`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>

          <Link
            href="."
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-200 transition-colors hover:border-sky-400/50 hover:text-white sm:w-auto"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Link>
        </div>

        {contactEmail && (
          <p className="mt-8 text-xs text-slate-400">
            Need something urgently?{' '}
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center gap-1.5 font-semibold text-sky-300 underline-offset-4 hover:underline"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              {contactEmail}
            </a>
          </p>
        )}

        <p className="mt-6 font-mono text-[9.5px] uppercase tracking-[0.24em] text-slate-600">
          ESUI Christian Campus Fellowship
        </p>
      </div>
    </div>
  )
}
