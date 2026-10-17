/**
 * Footer — Global Footer Component
 *
 * Implements a high-end, professional dark footer layout inspired by the
 * Turning Point USA design system (TPUSA):
 * - Atmospheric dark backdrop with subtle congregation overlay
 * - Direct email bulletin subscription with server action integration
 * - ECCF Family branding in Belleza font
 * - Direct links to Operational Teams, Leadership, Pastors, and CSGB
 * - Pixel-perfect social media icons (Facebook, X, Instagram, YouTube, TikTok, Telegram)
 * - Strict compliance: No /register route exposure, no exco dashboard button
 */

'use client'

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { subscribeToAnnouncements } from '@/app/actions/subscriber-actions'
import TurnstileWidget from '@/components/forms/TurnstileWidget'

export interface FooterProps {
  settings?: {
    socialYouTube?: string
    socialInstagram?: string
    socialFacebook?: string
    socialTikTok?: string
    socialTelegram?: string
    fellowshipEmail?: string
  } | null
}

export default function Footer({ settings }: FooterProps = {}) {
  const currentYear = new Date().getFullYear()

  // Dynamic social links from Sanity Studio settings with fallbacks
  const youtubeUrl = settings?.socialYouTube || 'https://youtube.com'
  const instagramUrl = settings?.socialInstagram || 'https://instagram.com'
  const facebookUrl = settings?.socialFacebook || 'https://facebook.com'
  const tiktokUrl = settings?.socialTikTok || 'https://tiktok.com'
  const telegramUrl = settings?.socialTelegram || 'https://t.me'
  const fellowshipEmail = settings?.fellowshipEmail || 'edsuchristiancampusfellowship@gmail.com'

  // Newsletter subscription state
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)
  const [status, setStatus] = useState<{
    success?: boolean
    message?: string
  } | null>(null)

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim() || loading) return

    setLoading(true)
    setStatus(null)

    const formData = new FormData()
    formData.append('email', email.trim())
    formData.append('turnstileToken', turnstileToken)

    try {
      const res = await subscribeToAnnouncements(formData)
      setStatus(res)
      if (res.success) {
        setEmail('')
        setTurnstileToken('')
        setTurnstileResetSignal((s) => s + 1)
      }
    } catch {
      setStatus({
        success: false,
        message: 'Could not connect. Please check your network and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="relative bg-[#070b18] text-slate-300 border-t border-slate-800/80 overflow-hidden font-sans">
      {/* Background Crowd Atmosphere (Overlaying subtle congregation photo) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <Image
          src="/gallery/gallery-1.jpg"
          alt="Congregation background"
          fill
          className="object-cover object-top opacity-10 mix-blend-luminosity brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b18]/85 via-[#070b18]/95 to-[#070b18]" />
      </div>

      <div className="w-full px-6 sm:px-10 md:px-14 lg:px-14 xl:px-20 2xl:px-28 pt-16 sm:pt-20 pb-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14">
          
          {/* ============================================================= */}
          {/* LEFT COLUMN: Newsletter Subscription + Mission + Follow Us     */}
          {/* ============================================================= */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Subscription Card */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-200 font-mono">
                SUBSCRIBE FOR NEWS, UPDATES, AND EVENTS
              </h3>

              <form onSubmit={handleSubscribe} className="mt-3.5 space-y-2.5 max-w-md">
                <div>
                  <label htmlFor="footer-email" className="block text-xs font-semibold text-slate-300 mb-1">
                    Email<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="footer-email"
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-[2px] px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0095ff] focus:border-transparent transition"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#c8102e] hover:bg-[#a50d26] active:bg-[#8b0b20] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-7 rounded-[2px] shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit</span>
                    )}
                  </button>
                </div>

                {/* Turnstile Security Check (Suppresses text in dev when unconfigured) */}
                <TurnstileWidget
                  onToken={setTurnstileToken}
                  resetSignal={turnstileResetSignal}
                  hideFallbackText={true}
                />

                {/* Inline Status Feedback */}
                {status && (
                  <div
                    className={`p-3 rounded-[2px] text-xs font-medium flex items-start gap-2 ${
                      status.success
                        ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                        : 'bg-red-950/70 border border-red-500/40 text-red-300'
                    }`}
                  >
                    {status.success ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    )}
                    <span>{status.message}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Brand Title & Official Identity */}
            <div className="pt-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative h-10 w-10 shrink-0">
                  <Image
                    src="/logos/ECCF LOGO.png"
                    alt="ECCF Logo"
                    width={40}
                    height={40}
                    className="h-full w-full object-contain brightness-110"
                  />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-serif font-normal text-white tracking-tight block">
                    ECCF Family
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-400 tracking-normal block mt-0.5">
                    ESUI Christian Campus Fellowship
                  </span>
                </div>
              </div>

              {/* Fellowship Mission Statement */}
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
                Edo State University Christian Campus Fellowship is an interdenominational student assembly dedicated to raising spiritual dynamites and academic giants for God&apos;s kingdom. Anchored on Christ, nurturing students across all residence halls into purpose, prayer, academic excellence, and Kingdom leadership.
              </p>
            </div>

            {/* Social Channels (Follow Us) */}
            <div className="pt-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 font-mono">
                FOLLOW US
              </h4>
              <div className="flex items-center gap-3 text-slate-300 flex-wrap">
                {/* Facebook */}
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  title="Facebook"
                  className="h-9 w-9 rounded-full border border-slate-700/80 hover:border-slate-300 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* X (formerly Twitter) */}
                <a
                  href={settings?.socialInstagram ? `https://x.com` : 'https://x.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (formerly Twitter)"
                  title="X"
                  className="h-9 w-9 rounded-full border border-slate-700/80 hover:border-slate-300 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  title="Instagram"
                  className="h-9 w-9 rounded-full border border-slate-700/80 hover:border-slate-300 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  title="YouTube"
                  className="h-9 w-9 rounded-full border border-slate-700/80 hover:border-slate-300 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

                {/* TikTok */}
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  title="TikTok"
                  className="h-9 w-9 rounded-full border border-slate-700/80 hover:border-slate-300 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28 6.34 6.34 0 0 0 9.34 21.6a6.34 6.34 0 0 0 6.34-6.32V8.75a8.28 8.28 0 0 0 4.81 1.54V6.84a4.8 4.8 0 0 1-.9-.15z"/>
                  </svg>
                </a>

                {/* Telegram */}
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  title="Telegram"
                  className="h-9 w-9 rounded-full border border-slate-700/80 hover:border-slate-300 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
                    <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.313 4.693c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
                  </svg>
                </a>
              </div>
            </div>

          </div>

          {/* ============================================================= */}
          {/* RIGHT COLUMNS: Navigation Directory (Teams, Leaders, Ministry)  */}
          {/* ============================================================= */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">

            {/* Column 1: About & Leaders */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white font-mono mb-4 pb-1 border-b border-slate-800">
                About &amp; Leaders
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link href="/about" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    About ECCF
                  </Link>
                </li>
                <li>
                  <Link href="/about#leadership" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Leadership &amp; Pastors
                  </Link>
                </li>
                <li>
                  <Link href="/about#leadership" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Resident Pastor &amp; Patrons
                  </Link>
                </li>
                <li>
                  <Link href="/about#leadership" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Central Executive Body (CSGB)
                  </Link>
                </li>
                <li>
                  <Link href="/about#leadership" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Hall Pastors (Halls 1&ndash;8)
                  </Link>
                </li>
                <li>
                  <Link href="/about#pillars" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Spiritual &amp; Academic Pillars
                  </Link>
                </li>
                <li>
                  <Link href="/about#story" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Fellowship History &amp; Story
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Operational Teams */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white font-mono mb-4 pb-1 border-b border-slate-800">
                Our Teams
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link href="/about#teams" className="text-slate-300 hover:text-white font-semibold transition-colors inline-block py-0.5">
                    All 14 Operational Units &rarr;
                  </Link>
                </li>
                <li>
                  <Link href="/about#teams" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Choir &amp; Music Ministry
                  </Link>
                </li>
                <li>
                  <Link href="/about#teams" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Prayer &amp; Intercession
                  </Link>
                </li>
                <li>
                  <Link href="/about#teams" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Media &amp; Digital Production
                  </Link>
                </li>
                <li>
                  <Link href="/about#teams" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Academic Distinction Unit
                  </Link>
                </li>
                <li>
                  <Link href="/about#teams" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Welfare &amp; Medical Team
                  </Link>
                </li>
                <li>
                  <Link href="/about#teams" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Protocol &amp; Ushering
                  </Link>
                </li>
                <li>
                  <Link href="/about#teams" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Bible Study &amp; Outreach
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Get Involved & Ministry Resources */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white font-mono mb-4 pb-1 border-b border-slate-800">
                Get Involved
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link href="/connect" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Connect &amp; Support
                  </Link>
                </li>
                <li>
                  <Link href="/#visit" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Plan a Visit
                  </Link>
                </li>
                <li>
                  <Link href="/#services" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Service Encounters
                  </Link>
                </li>
                <li>
                  <Link href="/connect?tab=first-timer" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    First Timers Welcome
                  </Link>
                </li>
                <li>
                  <Link href="/connect?tab=welfare" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Student Welfare Aid
                  </Link>
                </li>
                <li>
                  <Link href="/connect?tab=prayer" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Submit Prayer Request
                  </Link>
                </li>
                <li>
                  <Link href="/give" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Give Tithes &amp; Offerings
                  </Link>
                </li>
                <li>
                  <Link href="/sermons" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Audio Sermons
                  </Link>
                </li>
                <li>
                  <Link href="/announcements" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Announcements
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-slate-300 hover:text-white transition-colors inline-block py-0.5">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* ============================================================= */}
        {/* BOTTOM BAR: Copyright & Campus Details                         */}
        {/* ============================================================= */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="text-center md:text-left">
            &copy; {currentYear} ECCF Family &mdash; ESUI Christian Campus Fellowship. All rights reserved.
          </p>

          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center text-slate-400">
            <span>Meeting Venue: NLT 5, Faculty of Law</span>
            <span>&bull;</span>
            <span>Halls 1&ndash;8 Active Ministry</span>
            <span>&bull;</span>
            <Link href="/privacy" className="text-slate-400 hover:text-sky-400 transition-colors">
              Privacy &amp; Data Care
            </Link>
            <span>&bull;</span>
            <a
              href={`mailto:${fellowshipEmail}`}
              className="text-slate-400 hover:text-sky-400 transition-colors"
            >
              {fellowshipEmail}
            </a>
          </div>
        </div>

      </div>
    </footer>
  )
}
