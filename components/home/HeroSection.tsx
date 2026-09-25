/**
 * HeroSection — Formula 4 (First Baptist New Orleans faithful replica)
 *
 * KEY structural insight:
 * - The section itself has NO padding — it fills full viewport height
 * - Left panel: padded internally, text centered vertically
 * - Right panel: photo collage fills 100% height flush — no padding, no gap from edges
 * - Small gap (p-2) between photos only, no outer margin
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { urlForImage } from '@/lib/sanity'

export interface CollagePhotoItem {
  _key?: string
  alt?: string
  tag?: string
  imageUrl?: string
  image?: unknown
}

export interface SiteSettingsData {
  heroHeadlineStart?: string
  heroAccentWord?: string
  heroHeadlineEnd?: string
  heroCredo?: string
  heroParagraph?: string
  heroTopPill?: string
  heroPhoto?: unknown
  heroPhotoUrl?: string
  heroCollagePhotos?: CollagePhotoItem[]
  whoWeArePhotoMinister?: unknown
  whoWeArePhotoMinisterUrl?: string
  whoWeArePhotoAudience?: unknown
  whoWeArePhotoAudienceUrl?: string
  statsActiveMembers?: string
  statsWeeklyServices?: string
  statsCampusLegacy?: string
  visitContactPerson?: string
  visitWhatsAppNumber?: string
  fellowshipEmail?: string
}

interface Props {
  settings?: SiteSettingsData | null
}

const DEFAULT_COLLAGE = [
  {
    src: '/gallery/gallery-1.jpg',
    alt: 'Students in vibrant worship at ECCF',
  },
  {
    src: '/gallery/gallery-4.jpg',
    alt: 'ECCF university students smiling on campus',
  },
  {
    src: '/gallery/gallery-2.jpg',
    alt: 'Teaching and fellowship at ECCF',
  },
  {
    src: '/gallery/gallery-8.jpg',
    alt: 'Student with warm smile in ECCF fellowship',
  },
  {
    src: '/gallery/gallery-3.jpg',
    alt: 'ECCF Choir and ministry team',
  },
]

export default function HeroSection({ settings }: Props) {
  const topLabel = settings?.heroTopPill || 'Join us this week'

  const headline =
    settings?.heroHeadlineStart && settings?.heroHeadlineEnd
      ? `${settings.heroHeadlineStart} ${settings?.heroAccentWord || ''} ${settings.heroHeadlineEnd}`.trim()
      : 'An Assembly of Spiritual Dynamites & Academic Giants'

  const bodyText =
    settings?.heroParagraph ||
    'Our aim is to win souls on the school campus for Jesus.'

  const rawCollage = settings?.heroCollagePhotos
  const photos =
    Array.isArray(rawCollage) && rawCollage.length >= 5
      ? rawCollage.slice(0, 5).map((item, idx) => ({
          src: item.imageUrl || urlForImage(item.image) || DEFAULT_COLLAGE[idx].src,
          alt: item.alt || DEFAULT_COLLAGE[idx].alt,
        }))
      : DEFAULT_COLLAGE

  const legacyPhoto = urlForImage(settings?.heroPhoto) || settings?.heroPhotoUrl
  if (legacyPhoto && (!rawCollage || rawCollage.length < 5)) {
    photos[3] = { src: legacyPhoto, alt: 'ECCF Fellowship Life' }
  }

  return (
    /**
     * FBNO structure: full-viewport-height section, NO padding.
     * Two panels sit side by side via flex:
     *   - Left: ~38% width, padded, vertically centered text
     *   - Right: ~62% width, zero padding, collage fills 100% height flush
     */
    <section className="relative w-full bg-[#f9f8f5] overflow-hidden border-b border-stone-200"
      style={{ minHeight: 'calc(100vh - 76px)' }}
    >
      <div className="flex flex-col lg:flex-row w-full h-full" style={{ minHeight: 'calc(100vh - 76px)' }}>

        {/* ================================================================ */}
        {/* LEFT PANEL — padded text column, vertically centered             */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center px-6 sm:px-8 lg:px-12 py-16 lg:py-0 lg:w-[38%] xl:w-[36%] shrink-0"
        >
          {/* "Join us this week" tiny label */}
          <span className="text-[0.7rem] font-semibold tracking-[0.18em] text-slate-400 uppercase mb-6 block">
            {topLabel}
          </span>

          {/* Main headline — FBNO uses ~2rem–2.5rem, light-weight editorial serif */}
          <h1 className="font-serif font-normal tracking-tight text-slate-900 leading-[1.2] mb-5"
            style={{ fontSize: 'clamp(1.75rem, 2.8vw, 2.625rem)' }}
          >
            {headline}
          </h1>

          {/* Credo (only if set in CMS) */}
          {settings?.heroCredo && (
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#0077cc] mb-4 font-mono">
              {settings.heroCredo}
            </p>
          )}

          {/* Body — 2 lines max, small and quiet */}
          <p className="text-sm text-slate-500 leading-[1.7] max-w-[260px] mb-9">
            {bodyText}
          </p>

          {/* CTA — FBNO uses a wide full-width-ish pill button */}
          <div>
            <Link
              href="/#visit"
              className="inline-flex items-center justify-center rounded-full bg-[#0095ff] hover:bg-[#006fd6] text-white font-semibold px-8 py-3 text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
            >
              Plan A Visit
            </Link>
          </div>
        </motion.div>

        {/* ================================================================ */}
        {/* RIGHT PANEL — photo collage, FLUSH to top/right/bottom           */}
        {/* FBNO: photos start at the very top edge, fill full height        */}
        {/* Layout: 3 stacked on left sub-col, 2 stacked on right sub-col   */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="lg:flex-1 w-full lg:w-auto"
          style={{ minHeight: '480px' }}
        >
          {/* Grid: 2 sub-columns of photos, p-2 gap between, no outer padding */}
          <div className="grid grid-cols-2 gap-2 p-2 h-full w-full"
            style={{ minHeight: 'inherit' }}
          >

            {/* LEFT sub-column: 3 equal-height stacked photos */}
            <div className="grid grid-rows-3 gap-2 h-full">
              <div className="relative overflow-hidden rounded-xl bg-stone-200">
                <Image
                  src={photos[0].src}
                  alt={photos[0].alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 50vw, 30vw"
                  className="object-cover"
                />
              </div>
              <div className="relative overflow-hidden rounded-xl bg-stone-200">
                <Image
                  src={photos[1].src}
                  alt={photos[1].alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 30vw"
                  className="object-cover"
                />
              </div>
              <div className="relative overflow-hidden rounded-xl bg-stone-200">
                <Image
                  src={photos[2].src}
                  alt={photos[2].alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 30vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* RIGHT sub-column: tall top photo (60%) + shorter bottom photo (40%) */}
            <div className="grid gap-2 h-full" style={{ gridTemplateRows: '3fr 2fr' }}>
              <div className="relative overflow-hidden rounded-xl bg-stone-200">
                <Image
                  src={photos[3].src}
                  alt={photos[3].alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 50vw, 30vw"
                  className="object-cover"
                />
              </div>
              <div className="relative overflow-hidden rounded-xl bg-stone-200">
                <Image
                  src={photos[4].src}
                  alt={photos[4].alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 30vw"
                  className="object-cover"
                />
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  )
}