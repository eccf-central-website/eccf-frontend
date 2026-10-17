/**
 * Footer — Global Footer Component
 *
 * Implements ECCF's authentic brand palette:
 * - Warm site background (--site-bg: #fafaf9) with refined stone border
 * - Compact, inline bulletin subscription form with integrated Cloudflare Turnstile
 * - Brand-aligned primary submit button in ECCF Sky Blue (#0095ff)
 * - Clean naked social media vector icons (no circular containers)
 * - ECCF Family branding with Belleza serif typography and official identity
 * - Full navigation directory for Teams, Leadership, Pastors, and Ministry
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

export interface FooterNavLink {
  label: string
  url: string
  isExternal?: boolean
  highlight?: boolean
}

export interface FooterNavColumn {
  title: string
  links?: FooterNavLink[]
}

export const DEFAULT_FOOTER_NAV_COLUMNS: FooterNavColumn[] = [
  {
    title: 'About',
    links: [
      { label: 'About ECCF', url: '/about' },
      { label: 'Leadership & Pastors', url: '/about#leadership' },
      { label: 'Operational Teams', url: '/about#teams' },
      { label: 'Fellowship Story', url: '/about#story' },
    ],
  },
  {
    title: 'Get Involved',
    links: [
      { label: 'Plan a Visit', url: '/#visit' },
      { label: 'Service Schedule', url: '/#services' },
      { label: 'Connect & Support', url: '/connect' },
      { label: 'Prayer Request', url: '/connect?tab=prayer' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Audio Sermons', url: '/sermons' },
      { label: 'Give Tithes & Offerings', url: '/give' },
      { label: 'Announcements', url: '/announcements' },
    ],
  },
]

export interface FooterSettings {
  socialYouTube?: string
  socialInstagram?: string
  socialFacebook?: string
  socialTikTok?: string
  socialTelegram?: string
  socialTwitter?: string
  socialWhatsApp?: string
  fellowshipEmail?: string
  footerNewsletterHeading?: string
  footerNewsletterDescription?: string
  footerBrandTitle?: string
  footerBrandSubtitle?: string
  footerMissionStatement?: string
  footerLogoUrl?: string
  footerMeetingVenue?: string
  footerActiveMinistry?: string
  footerCopyright?: string
  footerNavColumns?: FooterNavColumn[]
}

export interface FooterProps {
  settings?: FooterSettings | null
}

export default function Footer({ settings }: FooterProps = {}) {
  const currentYear = new Date().getFullYear()

  // Dynamic social links from Sanity Studio settings with fallbacks
  const youtubeUrl = settings?.socialYouTube || 'https://youtube.com'
  const instagramUrl = settings?.socialInstagram || 'https://instagram.com'
  const facebookUrl = settings?.socialFacebook || 'https://facebook.com'
  const tiktokUrl = settings?.socialTikTok || 'https://tiktok.com'
  const telegramUrl = settings?.socialTelegram || 'https://t.me'
  const twitterUrl = settings?.socialTwitter || null
  const whatsappUrl = settings?.socialWhatsApp || null
  const fellowshipEmail = settings?.fellowshipEmail || 'edsuchristiancampusfellowship@gmail.com'

  // Dynamic editorial & identity fields from Sanity Studio
  const newsletterHeading = settings?.footerNewsletterHeading || 'SUBSCRIBE FOR NEWS, UPDATES, AND EVENTS'
  const newsletterDescription = settings?.footerNewsletterDescription || null
  const brandTitle = settings?.footerBrandTitle || 'ECCF Family'
  const brandSubtitle = settings?.footerBrandSubtitle || 'EDSU Christian Campus Fellowship'
  const missionStatement =
    settings?.footerMissionStatement ||
    "Edo State University Christian Campus Fellowship is an interdenominational student assembly dedicated to raising spiritual dynamites and academic giants for God's kingdom. Anchored on Christ, nurturing students across all residence halls into purpose, prayer, academic excellence, and Kingdom leadership."
  const logoUrl = settings?.footerLogoUrl || '/logos/ECCF LOGO.png'
  const meetingVenue = settings?.footerMeetingVenue || 'Meeting Venue: NLT 5, Faculty of Law'
  const activeMinistry = settings?.footerActiveMinistry || 'Halls 1–8 Active Ministry'
  const copyrightText = settings?.footerCopyright || 'ECCF Family — EDSU Christian Campus Fellowship. All rights reserved.'
  const navColumns =
    settings?.footerNavColumns && settings.footerNavColumns.length > 0
      ? settings.footerNavColumns
      : DEFAULT_FOOTER_NAV_COLUMNS

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
    <footer className="relative bg-[#fafaf9] text-slate-700 border-t border-stone-200/90 font-sans">
      <div className="w-full px-6 sm:px-10 md:px-14 lg:px-14 xl:px-20 2xl:px-28 pt-16 sm:pt-20 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14">
          
          {/* ============================================================= */}
          {/* LEFT COLUMN: Newsletter Subscription + Mission + Follow Us     */}
          {/* ============================================================= */}
          <div className="lg:col-span-5 space-y-7">
            
            {/* Subscription Card */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-900 font-mono">
                {newsletterHeading}
              </h3>
              {newsletterDescription && (
                <p className="text-xs text-slate-600 mt-1">{newsletterDescription}</p>
              )}

              <form onSubmit={handleSubscribe} className="mt-3.5 max-w-md">
                <label htmlFor="footer-email" className="block text-xs font-semibold text-slate-700 mb-2">
                  Email<span className="text-[#0095ff] ml-0.5">*</span>
                </label>

                {/* Inline unified input + submit button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="footer-email"
                      type="email"
                      name="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      aria-label="Email address for announcements"
                      className="w-full bg-white text-slate-900 border border-stone-300 rounded-full px-5 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0095ff] focus:border-transparent transition shadow-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-7 rounded-full bg-[#0095ff] hover:bg-[#0080e0] active:bg-[#0070c9] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider shadow-sm shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
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

                {/* Cloudflare Turnstile Security Check */}
                <div className="mt-2.5">
                  <TurnstileWidget
                    onToken={setTurnstileToken}
                    resetSignal={turnstileResetSignal}
                    hideFallbackText={true}
                  />
                </div>

                {/* Inline Status Feedback */}
                {status && (
                  <div
                    className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                      status.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {status.success ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    )}
                    <span>{status.message}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Brand Title & Official Identity */}
            <div className="pt-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative h-10 w-10 shrink-0">
                  <Image
                    src={logoUrl}
                    alt={`${brandTitle} Logo`}
                    width={40}
                    height={40}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-serif font-normal text-[#0095ff] tracking-tight block">
                    {brandTitle}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 tracking-normal block mt-0.5">
                    {brandSubtitle}
                  </span>
                </div>
              </div>

              {/* Fellowship Mission Statement */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
                {missionStatement}
              </p>
            </div>

            {/* Social Channels (Follow Us — Naked Vector SVGs without background discs) */}
            <div className="pt-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-3 font-mono">
                FOLLOW US
              </h4>
              <div className="flex items-center gap-5 text-slate-500 flex-wrap">
                {/* Facebook */}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    title="Follow ECCF on Facebook"
                    className="text-slate-500 hover:text-[#0095ff] transition-colors p-1"
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}

                {/* Instagram */}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    title="Follow ECCF on Instagram"
                    className="text-slate-500 hover:text-[#0095ff] transition-colors p-1"
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                    </svg>
                  </a>
                )}

                {/* YouTube */}
                {youtubeUrl && (
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    title="Watch ECCF sermons on YouTube"
                    className="text-slate-500 hover:text-[#0095ff] transition-colors p-1"
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}

                {/* TikTok */}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    title="Follow ECCF on TikTok"
                    className="text-slate-500 hover:text-[#0095ff] transition-colors p-1"
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28 6.34 6.34 0 0 0 9.34 21.6a6.34 6.34 0 0 0 6.34-6.32V8.75a8.28 8.28 0 0 0 4.81 1.54V6.84a4.8 4.8 0 0 1-.9-.15z"/>
                    </svg>
                  </a>
                )}

                {/* Telegram */}
                {telegramUrl && (
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Telegram"
                    title="Join ECCF Telegram channel"
                    className="text-slate-500 hover:text-[#0095ff] transition-colors p-1"
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 fill-current" viewBox="0 0 24 24">
                      <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.313 4.693c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
                    </svg>
                  </a>
                )}

                {/* X (formerly Twitter) */}
                {twitterUrl && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X (formerly Twitter)"
                    title="Follow ECCF on X"
                    className="text-slate-500 hover:text-[#0095ff] transition-colors p-1"
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}

                {/* WhatsApp Community / Channel */}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp Community"
                    title="Join ECCF WhatsApp Channel / Community"
                    className="text-slate-500 hover:text-[#0095ff] transition-colors p-1"
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 0C5.397 0 .007 5.39.007 12.023c0 2.118.553 4.186 1.606 6.01L0 24l6.167-1.618a12.012 12.012 0 0 0 5.864 1.517h.005c6.632 0 12.023-5.391 12.023-12.024A11.96 11.96 0 0 0 12.031 0zm0 21.996h-.004a9.98 9.98 0 0 1-5.088-1.39l-.365-.216-3.774.99 1.008-3.678-.238-.378a9.974 9.974 0 0 1-1.536-5.299c0-5.518 4.49-10.008 10.01-10.008a9.94 9.94 0 0 1 7.078 2.932 9.94 9.94 0 0 1 2.932 7.078c0 5.518-4.49 10.008-10.021 10.008zm5.487-7.498c-.3-.15-1.776-.876-2.051-.976-.276-.1-.476-.15-.676.15s-.776.976-.951 1.176-.35.225-.65.075a8.214 8.214 0 0 1-2.418-1.492 9.066 9.066 0 0 1-1.674-2.083c-.176-.3-.019-.462.131-.611.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525s-.676-1.63-.926-2.233c-.244-.588-.492-.508-.676-.517l-.576-.01c-.2 0-.525.075-.8.375s-1.05 1.026-1.05 2.503 1.075 2.903 1.225 3.103c.15.2 2.115 3.23 5.124 4.53 3.01 1.3 3.01.867 3.56.817.55-.05 1.776-.726 2.026-1.427.25-.7.25-1.301.175-1.426-.075-.125-.275-.2-.575-.35z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* ============================================================= */}
          {/* RIGHT COLUMNS: Navigation Directory                            */}
          {/* ============================================================= */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            {navColumns.map((col, idx) => (
              <div key={idx}>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-900 font-mono mb-4 pb-1 border-b border-stone-200">
                  {col.title}
                </h3>
                <ul className="space-y-2.5 text-xs sm:text-sm">
                  {col.links?.map((link, lIdx) => (
                    <li key={lIdx}>
                      {link.isExternal ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${
                            link.highlight
                              ? 'text-[#0095ff] hover:text-[#0080e0] font-semibold'
                              : 'text-slate-600 hover:text-[#0095ff]'
                          } transition-colors inline-block py-0.5`}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.url}
                          className={`${
                            link.highlight
                              ? 'text-[#0095ff] hover:text-[#0080e0] font-semibold'
                              : 'text-slate-600 hover:text-[#0095ff]'
                          } transition-colors inline-block py-0.5`}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* ============================================================= */}
        {/* BOTTOM BAR: Copyright & Campus Details                         */}
        {/* ============================================================= */}
        <div className="mt-14 pt-8 border-t border-stone-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="text-center md:text-left">
            &copy; {currentYear} {copyrightText}
          </p>

          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center text-slate-500">
            <span>{meetingVenue}</span>
            <span>&bull;</span>
            <span>{activeMinistry}</span>
            <span>&bull;</span>
            <Link href="/privacy" className="text-slate-500 hover:text-[#0095ff] transition-colors">
              Privacy &amp; Data Care
            </Link>
            <span>&bull;</span>
            <a
              href={`mailto:${fellowshipEmail}`}
              className="text-slate-500 hover:text-[#0095ff] transition-colors"
            >
              {fellowshipEmail}
            </a>
          </div>
        </div>

      </div>
    </footer>
  )
}
