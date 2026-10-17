/**
 * SocialMediaBanner — TPUSA-Inspired High-Impact Social Media Section
 *
 * Implements:
 * - Crisp, clean editorial white canvas directly after the Giving/Donation section.
 * - Bold editorial serif typography ("FOLLOW US FOR EXCLUSIVE CONTENT") with Playfair Display.
 * - High-contrast circular icon buttons matching the TPUSA aesthetic.
 * - Flawless mobile-first responsiveness: guarantees all 6 buttons stay in a single unified
 *   row on mobile viewports (via CSS Grid 6-columns) without awkward 5+1 wrapping.
 * - External deep links to official ECCF social channels (YouTube, Instagram, X, Facebook, TikTok, Telegram).
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'

export interface SocialMediaBannerProps {
  label?: string
  headlineLine1?: string
  headlineLine2?: string
  headlineLine3?: string
  youtubeUrl?: string
  instagramUrl?: string
  facebookUrl?: string
  tiktokUrl?: string
  telegramUrl?: string
}

export default function SocialMediaBanner({
  label = 'SOCIAL MEDIA',
  headlineLine1 = 'FOLLOW US FOR',
  headlineLine2 = 'EXCLUSIVE',
  headlineLine3 = 'CONTENT',
  youtubeUrl = 'https://youtube.com',
  instagramUrl = 'https://instagram.com',
  facebookUrl = 'https://facebook.com',
  tiktokUrl = 'https://tiktok.com',
  telegramUrl = 'https://t.me',
}: SocialMediaBannerProps) {
  const socialPlatforms = [
    {
      name: 'YouTube',
      href: youtubeUrl,
      ariaLabel: 'Follow ECCF on YouTube for sermons, livestreams and worship encounters',
      icon: (
        <svg
          className="h-4 w-4 min-[375px]:h-5 min-[375px]:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: instagramUrl,
      ariaLabel: 'Follow ECCF on Instagram for daily devotionals and campus moments',
      icon: (
        <svg
          className="h-4 w-4 min-[375px]:h-5 min-[375px]:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 fill-none stroke-current stroke-2"
          viewBox="0 0 24 24"
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
      name: 'Facebook',
      href: facebookUrl,
      ariaLabel: 'Connect with ECCF on Facebook for fellowship community updates',
      icon: (
        <svg
          className="h-4 w-4 min-[375px]:h-5 min-[375px]:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
        </svg>
      ),
    },
    {
      name: 'TikTok',
      href: tiktokUrl,
      ariaLabel: 'Follow ECCF on TikTok for short sermon clips, choir ministrations and youth reels',
      icon: (
        <svg
          className="h-4 w-4 min-[375px]:h-5 min-[375px]:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28 6.34 6.34 0 0 0 9.34 21.6a6.34 6.34 0 0 0 6.34-6.32V8.75a8.28 8.28 0 0 0 4.81 1.54V6.84a4.8 4.8 0 0 1-.9-.15z" />
        </svg>
      ),
    },
    {
      name: 'Telegram',
      href: telegramUrl,
      ariaLabel: 'Join ECCF on Telegram for instant audio podcasts, study notes and announcements',
      icon: (
        <svg
          className="h-4 w-4 min-[375px]:h-5 min-[375px]:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.313 4.693c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
        </svg>
      ),
    },
  ]

  return (
    <section
      id="social-media"
      aria-label="Social Media Channels"
      className="w-full bg-white text-slate-950 py-12 sm:py-16 md:py-24 lg:py-28 border-y border-stone-200/90 relative overflow-hidden"
    >
      <div className="w-full px-6 sm:px-10 md:px-14 lg:px-14 xl:px-20 2xl:px-28 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 sm:gap-10 md:gap-12 lg:gap-16">
          
          {/* ================================================================ */}
          {/* LEFT: Grand Editorial Typography                                  */}
          {/* ================================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-left max-w-2xl"
          >
            {/* Overline Label — Styling font: Geist Mono */}
            <span className="block text-xs sm:text-sm font-mono font-bold tracking-[0.25em] text-slate-900 uppercase mb-3 sm:mb-4">
              {label}
            </span>

            {/* Massive Headline — Headings font: Belleza */}
            <h2 className="font-heading text-[2.25rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.25rem] text-slate-950 tracking-normal leading-[1.14] sm:leading-[1.08] lg:leading-[1.02] uppercase select-none">
              <span className="block">{headlineLine1}</span>
              <span className="block">{headlineLine2}</span>
              <span className="block">{headlineLine3}</span>
            </h2>
          </motion.div>

          {/* ================================================================ */}
          {/* RIGHT: Circular Social Media Icon Pills                           */}
          {/* ================================================================ */}
          {/* Uses CSS Grid on mobile so all 6 icons are guaranteed to stay in */}
          {/* a single, balanced row without accidental 5+1 line breaking.     */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid grid-cols-5 gap-2.5 sm:gap-4 md:flex md:items-center md:justify-end md:gap-4 lg:gap-5 w-full max-w-[320px] sm:max-w-[400px] md:max-w-none self-start md:self-center"
          >
            {socialPlatforms.map((platform, idx) => (
              <motion.a
                key={platform.name}
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
                title={platform.name}
                aria-label={platform.ariaLabel}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ scale: 1.1, y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.94 }}
                className="group relative flex aspect-square w-full max-w-[46px] sm:max-w-[54px] md:w-16 md:h-16 lg:w-[72px] lg:h-[72px] md:max-w-none shrink-0 items-center justify-center rounded-full bg-[#0077cc] text-white shadow-md shadow-sky-600/20 hover:bg-[#005fa3] hover:shadow-xl hover:shadow-sky-500/35 transition-all focus:outline-none focus:ring-4 focus:ring-sky-400/40 mx-auto md:mx-0"
              >
                {/* Glow ring on hover */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                
                {/* Brand Vector Icon */}
                <div className="relative z-10 transition-transform duration-200 group-hover:scale-105 flex items-center justify-center">
                  {platform.icon}
                </div>
              </motion.a>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
