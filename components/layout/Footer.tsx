/**
 * Footer — Global Footer Component
 *
 * Structure follows the site's secondary-navigation role:
 * - Brand and a short mission statement first
 * - Two editable link columns plus a fixed, compact "Visit Us" block
 * - One slim newsletter band with the existing Turnstile-protected form
 * - A minimal legal bar: copyright plus the privacy and terms documents
 *
 * Accessibility notes:
 * - Text links use a 4.5:1+ brand blue; the old #0095ff is reserved for
 *   decorative accents because white-on-sky-blue fails AA at small sizes.
 * - Icon links have 44px hit areas and visible focus rings.
 * - Every external link announces that it opens in a new tab.
 */

'use client'

import * as React from 'react'
import { useId, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
} from 'lucide-react'
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

/**
 * Two link groups. "Visit Us" is rendered separately as the third column so
 * its service time and venue stay content-managed rather than link-managed.
 */
export const DEFAULT_FOOTER_NAV_COLUMNS: FooterNavColumn[] = [
  {
    title: 'Explore',
    links: [
      { label: 'About ECCF', url: '/about' },
      { label: 'Leadership & Pastors', url: '/about#leadership' },
      { label: 'Operational Teams', url: '/about#teams' },
      { label: 'Sermons', url: '/sermons' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'Plan a Visit', url: '/#visit' },
      { label: 'Prayer Request', url: '/connect?tab=prayer' },
      { label: 'Give', url: '/give' },
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
  footerServiceSummary?: string
  footerCopyright?: string
  footerNavColumns?: FooterNavColumn[]
}

export interface FooterProps {
  settings?: FooterSettings | null
}

const DEFAULT_MISSION =
  'An interdenominational student fellowship raising spiritual dynamites and academic giants at ESUI.'

const DEFAULT_SERVICE_SUMMARY = 'Sundays · 8:00 AM'
const DEFAULT_VENUE = 'NLT 5, Faculty of Law, ESUI'
const DEFAULT_EMAIL = 'edsuchristiancampusfellowship@gmail.com'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072c6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] rounded-sm'

const textLink = `inline-flex items-center text-sm text-stone-600 transition-colors hover:text-[#0072c6] ${focusRing}`

type SocialLink = { label: string; href: string; icon: React.ReactNode }

function SocialLinks({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null

  return (
    <nav aria-label="Social media" className="mt-5 sm:mt-6">
      <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-stone-900">
        Follow Us
      </h2>
      <ul className="-ml-2 mt-2 flex flex-wrap items-center gap-1">
        {links.map(({ label, href, icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (opens in a new tab)`}
              className={`flex h-11 w-11 items-center justify-center text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-[#0072c6] ${focusRing}`}
            >
              {icon}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Footer({ settings }: FooterProps = {}) {
  const currentYear = new Date().getFullYear()
  const emailInputId = useId()

  const brandTitle = settings?.footerBrandTitle?.trim() || 'ECCF Family'
  const brandSubtitle =
    settings?.footerBrandSubtitle?.trim() || 'ESUI Christian Campus Fellowship'
  const missionStatement = settings?.footerMissionStatement?.trim() || DEFAULT_MISSION
  const logoUrl = settings?.footerLogoUrl || '/logos/ECCF LOGO.png'

  const serviceSummary = settings?.footerServiceSummary?.trim() || DEFAULT_SERVICE_SUMMARY
  const meetingVenue = (settings?.footerMeetingVenue?.trim() || DEFAULT_VENUE).replace(
    /^Meeting Venue:\s*/i,
    ''
  )
  const fellowshipEmail = settings?.fellowshipEmail?.trim() || DEFAULT_EMAIL

  const newsletterHeading = settings?.footerNewsletterHeading?.trim() || 'Stay in the loop'
  const newsletterDescription =
    settings?.footerNewsletterDescription?.trim() ||
    'Announcements, events, and service updates, straight to your inbox.'
  const copyrightText =
    settings?.footerCopyright?.trim() ||
    'ESUI Christian Campus Fellowship. All rights reserved.'

  const customColumns =
    settings?.footerNavColumns?.filter((column) => (column.links?.length ?? 0) > 0) ?? []
  const navColumns = (
    customColumns.length > 0 ? customColumns : DEFAULT_FOOTER_NAV_COLUMNS
  ).slice(0, 2)

  const socialLinks: SocialLink[] = [
    {
      label: 'Facebook',
      href: settings?.socialFacebook?.trim() || '',
      icon: (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      label: 'Instagram',
      href: settings?.socialInstagram?.trim() || '',
      icon: (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
    },
    {
      label: 'YouTube',
      href: settings?.socialYouTube?.trim() || '',
      icon: (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      label: 'TikTok',
      href: settings?.socialTikTok?.trim() || '',
      icon: (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28 6.34 6.34 0 0 0 9.34 21.6a6.34 6.34 0 0 0 6.34-6.32V8.75a8.28 8.28 0 0 0 4.81 1.54V6.84a4.8 4.8 0 0 1-.9-.15z" />
        </svg>
      ),
    },
    {
      label: 'Telegram',
      href: settings?.socialTelegram?.trim() || '',
      icon: (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.313 4.693c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
        </svg>
      ),
    },
    {
      label: 'X',
      href: settings?.socialTwitter?.trim() || '',
      icon: (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: 'WhatsApp',
      href: settings?.socialWhatsApp?.trim() || '',
      icon: (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.031 0C5.397 0 .007 5.39.007 12.023c0 2.118.553 4.186 1.606 6.01L0 24l6.167-1.618a12.012 12.012 0 0 0 5.864 1.517h.005c6.632 0 12.023-5.391 12.023-12.024A11.96 11.96 0 0 0 12.031 0zm0 21.996h-.004a9.98 9.98 0 0 1-5.088-1.39l-.365-.216-3.774.99 1.008-3.678-.238-.378a9.974 9.974 0 0 1-1.536-5.299c0-5.518 4.49-10.008 10.01-10.008a9.94 9.94 0 0 1 7.078 2.932 9.94 9.94 0 0 1 2.932 7.078c0 5.518-4.49 10.008-10.021 10.008zm5.487-7.498c-.3-.15-1.776-.876-2.051-.976-.276-.1-.476-.15-.676.15s-.776.976-.951 1.176-.35.225-.65.075a8.214 8.214 0 0 1-2.418-1.492 9.066 9.066 0 0 1-1.674-2.083c-.176-.3-.019-.462.131-.611.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525s-.676-1.63-.926-2.233c-.244-.588-.492-.508-.676-.517l-.576-.01c-.2 0-.525.075-.8.375s-1.05 1.026-1.05 2.503 1.075 2.903 1.225 3.103c.15.2 2.115 3.23 5.124 4.53 3.01 1.3 3.01.867 3.56.817.55-.05 1.776-.726 2.026-1.427.25-.7.25-1.301.175-1.426-.075-.125-.275-.2-.575-.35z" />
        </svg>
      ),
    },
  ].filter((link) => Boolean(link.href))

  // Newsletter subscription state
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)
  // The bot check is only mounted once the email field has been used, so it
  // never occupies the footer before a visitor shows intent to subscribe.
  // It stays mounted after blur so an in-flight challenge is not discarded.
  const [turnstileArmed, setTurnstileArmed] = useState(false)
  const showTurnstile = turnstileArmed || email.trim().length > 0
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
        setTurnstileResetSignal((signal) => signal + 1)
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
    <footer className="border-t border-stone-200 bg-[#fafaf9] text-stone-700">
      <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-12 sm:px-8 sm:pb-10 sm:pt-16 lg:px-10">
        {/* Brand, navigation directory, and visit details */}
        <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <Image
                src={logoUrl}
                alt=""
                width={44}
                height={44}
                className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
              />
              <div className="min-w-0">
                <p className="font-serif text-[22px] leading-tight tracking-tight text-[#0072c6] sm:text-[28px]">
                  {brandTitle}
                </p>
                <p className="mt-1 text-[12px] font-semibold leading-snug text-stone-600 sm:mt-0.5 sm:text-[13px]">
                  {brandSubtitle}
                </p>
              </div>
            </div>

            <p className="mt-3.5 max-w-sm text-[13px] leading-relaxed text-stone-600 sm:mt-4 sm:text-sm">
              {missionStatement}
            </p>

            <SocialLinks links={socialLinks} />
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:col-span-8">
            {navColumns.map((column) => (
              <nav key={column.title} aria-label={`Footer — ${column.title}`}>
                <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-stone-900">
                  {column.title}
                </h2>
                <ul className="mt-3 space-y-1">
                  {column.links?.map((link, index) => (
                    <li key={`${link.label}-${index}`}>
                      {link.isExternal ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${textLink} min-h-[36px] py-2 ${
                            link.highlight ? 'font-semibold text-[#0072c6]' : ''
                          }`}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.url}
                          className={`${textLink} min-h-[36px] py-2 ${
                            link.highlight ? 'font-semibold text-[#0072c6]' : ''
                          }`}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <section
              aria-labelledby="footer-visit-heading"
              className="col-span-2 rounded-2xl border border-stone-200 bg-white/70 p-4 sm:col-span-1 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
            >
              <h2
                id="footer-visit-heading"
                className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-stone-900"
              >
                Visit Us
              </h2>
              <ul className="mt-3 space-y-3 text-[13px] leading-relaxed text-stone-600 sm:text-sm">
                <li className="flex items-start gap-2.5">
                  <CalendarDays
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#0072c6]"
                    aria-hidden="true"
                  />
                  <span>{serviceSummary}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#0072c6]"
                    aria-hidden="true"
                  />
                  <span>{meetingVenue}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Mail
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#0072c6]"
                    aria-hidden="true"
                  />
                  <a
                    href={`mailto:${fellowshipEmail}`}
                    className={`inline-flex items-center break-all text-[12px] leading-relaxed text-stone-600 transition-colors hover:text-[#0072c6] sm:text-sm ${focusRing}`}
                  >
                    {fellowshipEmail}
                  </a>
                </li>
              </ul>
              <Link
                href="/#visit"
                className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0072c6] transition-colors hover:text-[#005fa3] ${focusRing}`}
              >
                Plan your visit
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </section>
          </div>
        </div>

        {/* Slim newsletter band */}
        <div className="mt-10 border-t border-stone-200 pt-8 sm:mt-14 sm:pt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="max-w-md">
              <h2 className="font-serif text-lg leading-snug text-stone-900 sm:text-2xl">
                {newsletterHeading}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-stone-600 sm:text-sm">
                {newsletterDescription}
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="w-full lg:max-w-md" noValidate>
              <label htmlFor={emailInputId} className="sr-only">
                Email address for fellowship announcements
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="w-full min-w-0 sm:flex-1">
                  <input
                    id={emailInputId}
                    type="email"
                    name="email"
                    required
                    value={email}
                    onFocus={() => setTurnstileArmed(true)}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setTurnstileArmed(true)
                    }}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    className="h-11 w-full rounded-full border border-stone-300 bg-white px-5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0072c6] sm:h-12"
                  />

                  {/* Mounted only after the visitor engages with the field,
                      and constrained to the input's width on every breakpoint. */}
                  {showTurnstile && (
                    <div className="mt-2.5 w-full overflow-hidden rounded-lg">
                      <TurnstileWidget
                        onToken={setTurnstileToken}
                        resetSignal={turnstileResetSignal}
                        hideFallbackText
                        size="flexible"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#0072c6] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#005fa3] active:bg-[#004f8a] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072c6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] sm:h-12 sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Subscribing…</span>
                    </>
                  ) : (
                    <span>Subscribe</span>
                  )}
                </button>
              </div>

              {status && (
                <div
                  role={status.success ? 'status' : 'alert'}
                  className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-[13px] font-medium ${
                    status.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  {status.success ? (
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
                      aria-hidden="true"
                    />
                  )}
                  <span>{status.message}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Legal bar */}
        <div className="mt-8 border-t border-stone-200 pt-6 sm:mt-10">
          <div className="flex flex-col items-center gap-2.5 text-center text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:text-left sm:text-[13px]">
            <p className="max-w-xs sm:max-w-none">
              &copy; {currentYear} {copyrightText}
            </p>
            <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <Link
                href="/privacy"
                className={`text-xs text-stone-500 transition-colors hover:text-[#0072c6] sm:text-[13px] ${focusRing}`}
              >
                Privacy &amp; Data Care
              </Link>
              <span aria-hidden="true" className="text-stone-300">
                &bull;
              </span>
              <Link
                href="/terms"
                className={`text-xs text-stone-500 transition-colors hover:text-[#0072c6] sm:text-[13px] ${focusRing}`}
              >
                Terms of Use
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
