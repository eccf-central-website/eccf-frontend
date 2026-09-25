/**
 * HeroSection — Pure Formula 4 Overhaul
 *
 * 100% faithful to "The Church Website Homepage Formula" — Formula 4 (First Baptist New Orleans).
 * Clean white canvas, generous editorial whitespace, clear typographic hierarchy,
 * a single unmistakable "Plan A Visit" CTA, and the signature 5-photo asymmetric collage grid.
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

// 5 curated authentic fellowship photos mapped to Formula 4's exact positions
const DEFAULT_COLLAGE = [
  // 1. Top-Left: Worship / Congregation in action
  {
    src: '/gallery/gallery-1.jpg',
    alt: 'Students in vibrant worship at Edo State University Christian Campus Fellowship',
  },
  // 2. Middle-Left: Academic life & student smiles
  {
    src: '/gallery/gallery-4.jpg',
    alt: 'ECCF university students smiling on campus',
  },
  // 3. Bottom-Left: Fellowship & conversation
  {
    src: '/gallery/gallery-2.jpg',
    alt: 'Teaching and fellowship at ECCF',
  },
  // 4. Top-Right (TALL ANCHOR): Prominent smiling portrait
  {
    src: '/gallery/gallery-8.jpg',
    alt: 'Student with warm smile in ECCF fellowship',
  },
  // 5. Bottom-Right: Choir / Team gathering
  {
    src: '/gallery/gallery-3.jpg',
    alt: 'ECCF Choir and ministry team',
  },
]

export default function HeroSection({ settings }: Props) {
  // Editorial Top Label (Formula 4: "Join us this week")
  const topLabel = settings?.heroTopPill || 'Join us this week'

  // Unified Bold Editorial Headline (Formula 4: "Elevating Gospel Hope")
  const headline = settings?.heroHeadlineStart && settings?.heroHeadlineEnd
    ? `${settings.heroHeadlineStart} ${settings?.heroAccentWord || ''} ${settings.heroHeadlineEnd}`.trim()
    : 'An Assembly of Spiritual Dynamites & Academic Giants'

  // Warm, inviting body paragraph
  const bodyText =
    settings?.heroParagraph ||
    'A community of believers at Edo State University dedicated to pursuing God’s purpose with academic excellence. You belong here.'

  // Process Sanity Collage Photos or use the curated Formula 4 defaults
  const rawCollage = settings?.heroCollagePhotos
  const photos =
    Array.isArray(rawCollage) && rawCollage.length >= 5
      ? rawCollage.slice(0, 5).map((item, idx) => ({
          src: item.imageUrl || urlForImage(item.image) || DEFAULT_COLLAGE[idx].src,
          alt: item.alt || DEFAULT_COLLAGE[idx].alt,
        }))
      : DEFAULT_COLLAGE

  // If a legacy single photo exists and no collage array is set, use it as the tall anchor
  const legacyPhoto = urlForImage(settings?.heroPhoto) || settings?.heroPhotoUrl
  if (legacyPhoto && (!rawCollage || rawCollage.length < 5)) {
    photos[3] = {
      src: legacyPhoto,
      alt: 'ECCF Fellowship Life',
    }
  }

  return (
    <section className="relative w-full bg-white min-h-[calc(100vh-76px)] flex items-center overflow-hidden border-b border-slate-100">
      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-center">
          
          {/* ========================================================== */}
          {/* LEFT COLUMN: Pure Formula 4 Clean Typography & Single CTA  */}
          {/* ========================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 xl:col-span-5 flex flex-col justify-center text-left"
          >
            {/* Top Label (Formula 4: Subtle, lowercase/title case sans-serif) */}
            <span className="text-xs sm:text-sm font-medium tracking-wide text-slate-500 mb-4 block">
              {topLabel}
            </span>

            {/* Headline (Formula 4: Clean, high-impact editorial serif) */}
            <h1 className="font-serif text-4xl xs:text-5xl sm:text-[3.5rem] lg:text-[3.75rem] xl:text-[4.25rem] font-normal tracking-tight text-slate-900 leading-[1.12] mb-6">
              {headline}
            </h1>

            {/* Credo Motto (Clean secondary line) */}
            {settings?.heroCredo && (
              <p className="text-xs font-bold uppercase tracking-widest text-[#0077cc] mb-4 font-mono">
                {settings.heroCredo}
              </p>
            )}

            {/* Body (Formula 4: 2-3 lines of generous, readable text) */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-lg mb-8 sm:mb-10">
              {bodyText}
            </p>

            {/* CTA Button (Formula 4: Unmistakable, standalone pill button) */}
            <div>
              <Link
                href="/#visit"
                className="inline-flex items-center justify-center rounded-full bg-[#0095ff] hover:bg-[#0080e0] text-white font-bold px-9 py-4 text-sm sm:text-base tracking-wide shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Plan A Visit
              </Link>
            </div>
          </motion.div>

          {/* ========================================================== */}
          {/* RIGHT COLUMN: Formula 4 Asymmetric 5-Photo Collage Grid     */}
          {/* (Exact First Baptist New Orleans 3-left / 2-right geometry) */}
          {/* ========================================================== */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 xl:col-span-7 w-full"
          >
            {/* 
              Desktop & Tablet Collage Grid:
              Height calibrated so Left Column (3 items) & Right Column (1 tall + 1 normal)
              align perfectly with equal gutters (gap-3.5 or gap-4).
            */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 h-[480px] sm:h-[580px] lg:h-[620px] w-full">
              
              {/* LEFT SUB-COLUMN: 3 Equal Stacked Photos */}
              <div className="grid grid-rows-3 gap-3 sm:gap-4 h-full">
                {/* Photo 1: Worship */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                  <Image
                    src={photos[0].src}
                    alt={photos[0].alt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 50vw, 320px"
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* Photo 2: Academics / Campus Life */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                  <Image
                    src={photos[1].src}
                    alt={photos[1].alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 320px"
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* Photo 3: Fellowship / Gathering */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                  <Image
                    src={photos[2].src}
                    alt={photos[2].alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 320px"
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>

              {/* RIGHT SUB-COLUMN: 2 Photos (1 Tall Anchor + 1 Lower Photo) */}
              <div className="grid grid-rows-5 gap-3 sm:gap-4 h-full">
                {/* Photo 4 (Row-span-3: 60% Height TALL ANCHOR) */}
                <div className="row-span-3 relative rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                  <Image
                    src={photos[3].src}
                    alt={photos[3].alt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 50vw, 340px"
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* Photo 5 (Row-span-2: 40% Height Photo) */}
                <div className="row-span-2 relative rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                  <Image
                    src={photos[4].src}
                    alt={photos[4].alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 340px"
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}