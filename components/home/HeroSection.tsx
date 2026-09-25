/**
 * HeroSection — Homepage Formula 4 Implementation
 *
 * Implements "The Church Website Homepage Formula" — Formula 4 (Split-Layout with
 * Clean Typography & 5-Photo Collage Grid).
 * Fully backwards-compatible with live Sanity Studio siteSettings data while guaranteeing
 * rock-solid local fallbacks so the site is always 100% functional.
 * ADR-002 Compliant: Promotes Spotify & YouTube sermon podcasts.
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, Variants } from 'framer-motion'
import { ArrowRight, Radio, MapPin, Sparkles } from 'lucide-react'
import CountUpNumber from '@/components/ui/CountUpNumber'
import { urlForImage } from '@/lib/sanity'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
}

export interface CollagePhotoItem {
  _key?: string
  alt?: string
  tag?: string
  imageUrl?: string
  image?: unknown
}

export interface LauncherLinkItem {
  title: string
  subtitle?: string
  url: string
  iconType?: string
  isExternal?: boolean
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
  launcherLinks?: LauncherLinkItem[]
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

function parseMetric(val?: string | null, defaultEnd: number = 0, defaultSuffix: string = '') {
  if (!val || typeof val !== 'string') return { end: defaultEnd, suffix: defaultSuffix }
  const trimmed = val.trim()
  const match = trimmed.match(/^(\d+)(.*)$/)
  if (!match) {
    const digits = trimmed.match(/\d+/)
    if (digits) {
      const parsed = parseInt(digits[0], 10)
      return { end: isNaN(parsed) ? defaultEnd : parsed, suffix: trimmed.replace(digits[0], '').trim() || defaultSuffix }
    }
    return { end: defaultEnd, suffix: defaultSuffix }
  }
  const parsed = parseInt(match[1], 10)
  return { end: isNaN(parsed) ? defaultEnd : parsed, suffix: match[2] ? match[2].trim() : defaultSuffix }
}

// Curated high-vibrancy default collage photos representing ECCF's dual mandate
const DEFAULT_COLLAGE: { src: string; alt: string; tag: string }[] = [
  {
    src: '/gallery/gallery-8.jpg',
    alt: 'Smiling student at ECCF campus worship',
    tag: 'Community',
  },
  {
    src: '/gallery/gallery-1.jpg',
    alt: 'Vibrant student praise and worship fire',
    tag: 'Worship',
  },
  {
    src: '/gallery/gallery-4.jpg',
    alt: 'Students smiling in campus fellowship and academic excellence',
    tag: 'Academics',
  },
  {
    src: '/gallery/gallery-3.jpg',
    alt: 'ECCF Choir ministering in unity and grace',
    tag: 'Choir',
  },
  {
    src: '/gallery/gallery-2.jpg',
    alt: 'Word exhortation and deep prayer moment',
    tag: 'Prayer',
  },
]

export default function HeroSection({ settings }: Props) {
  const headlineStart = settings?.heroHeadlineStart || 'An Assembly Of'
  const accentWord = settings?.heroAccentWord || 'Spiritual Dynamites'
  const headlineEnd = settings?.heroHeadlineEnd || 'And Academic Giants'
  const credo = settings?.heroCredo || 'Jesus in our hearts, letters in our heads.'
  const topPill = settings?.heroTopPill || 'EDO STATE UNIVERSITY, IYAMHO'
  const paragraph =
    settings?.heroParagraph ||
    'More than a fellowship — we are a family raising a generation of believers who excel spiritually and academically, rooted in faith, built for impact.'

  // Process Sanity Collage Photos or fallback safely
  const rawCollage = settings?.heroCollagePhotos
  const collageItems =
    Array.isArray(rawCollage) && rawCollage.length > 0
      ? rawCollage.map((item, idx) => ({
          src: item.imageUrl || urlForImage(item.image) || DEFAULT_COLLAGE[idx % DEFAULT_COLLAGE.length].src,
          alt: item.alt || DEFAULT_COLLAGE[idx % DEFAULT_COLLAGE.length].alt,
          tag: item.tag || DEFAULT_COLLAGE[idx % DEFAULT_COLLAGE.length].tag,
        }))
      : DEFAULT_COLLAGE

  // If a legacy hero photo was uploaded and no collage exists, use it in the hero
  const legacyPhoto = urlForImage(settings?.heroPhoto) || settings?.heroPhotoUrl
  if (legacyPhoto && (!rawCollage || rawCollage.length === 0)) {
    collageItems[0] = {
      src: legacyPhoto,
      alt: 'ECCF Fellowship Life',
      tag: 'Spiritual Giants',
    }
  }

  const m1 = parseMetric(settings?.statsActiveMembers, 400, '+')
  const m2 = parseMetric(settings?.statsWeeklyServices, 3, 'x')
  const m3 = parseMetric(settings?.statsCampusLegacy, 10, 'yrs+')

  return (
    <section className="relative w-full bg-gradient-to-b from-white via-[#fafaf9] to-[#fafaf9] pt-6 pb-12 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24 overflow-hidden">
      {/* Subtle Ambient Radial Glows */}
      <div className="absolute top-12 -left-24 h-[300px] sm:h-[500px] w-[300px] sm:w-[500px] rounded-full bg-sky-100/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 h-[300px] sm:h-[450px] w-[300px] sm:w-[450px] rounded-full bg-amber-100/35 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ============================================================== */}
          {/* LEFT COLUMN: Clean Typography, Dual Taglines & Unified CTAs   */}
          {/* ============================================================== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 xl:col-span-7 text-left space-y-4 sm:space-y-5"
          >
            {/* Top Pill: Campus Location & Identity Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-[11px] sm:text-xs font-black tracking-wider text-[#0077cc] uppercase shadow-sm">
                <MapPin className="h-3.5 w-3.5 text-[#0095ff]" />
                <span>{topPill}</span>
              </span>
            </motion.div>

            {/* Master Headline: Large Serif with Vibrant Highlight */}
            <motion.h1
              variants={itemVariants}
              className="font-serif text-[2.35rem] xs:text-[2.75rem] sm:text-5xl lg:text-[3.9rem] font-medium tracking-tight text-slate-950 leading-[1.12] sm:leading-[1.1]"
            >
              <span>{headlineStart}</span> <br />
              <span className="italic text-[#0077cc] inline-block my-0.5">
                {accentWord}
              </span> <br />
              <span>{headlineEnd}</span>
            </motion.h1>

            {/* Fellowship Credo: Bordered Accent Callout */}
            <motion.div
              variants={itemVariants}
              className="border-l-2 border-[#0095ff] pl-3.5 sm:pl-4 py-0.5"
            >
              <p className="text-xs sm:text-sm font-bold tracking-wide text-slate-700 italic">
                &ldquo;{credo}&rdquo;
              </p>
            </motion.div>

            {/* Mission Description */}
            {paragraph && (
              <motion.p
                variants={itemVariants}
                className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal max-w-xl"
              >
                {paragraph}
              </motion.p>
            )}

            {/* Primary Action Buttons (Harmonized with Navbar) */}
            <motion.div
              variants={itemVariants}
              className="pt-2 flex flex-col xs:flex-row items-stretch xs:items-center gap-3.5 sm:gap-5"
            >
              <Link
                href="/#visit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0095ff] hover:bg-[#0080e0] text-white font-bold px-7 sm:px-8 py-3.5 sm:py-4 text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 transition-all text-center hover:scale-[1.02] active:scale-[0.98] w-full xs:w-auto min-h-[46px]"
              >
                <span>Plan a Visit</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/sermons"
                className="inline-flex items-center justify-center xs:justify-start gap-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-3.5 sm:py-4 text-xs uppercase tracking-wider transition-all text-center hover:text-[#0077cc] min-h-[46px]"
              >
                <Radio className="h-4 w-4 text-[#0077cc]" />
                <span>Sermon Podcasts</span>
              </Link>
            </motion.div>

            {/* Social Proof Metric Counter Strip */}
            <motion.div
              variants={itemVariants}
              className="pt-4 sm:pt-6 grid grid-cols-3 gap-3 sm:gap-6 border-t border-slate-200/60 max-w-lg"
            >
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight">
                  <CountUpNumber end={m1.end} suffix={m1.suffix} />
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  Active Members
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0077cc] tracking-tight">
                  <CountUpNumber end={m2.end} suffix={m2.suffix} />
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  Weekly Services
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight">
                  <CountUpNumber end={m3.end} suffix={m3.suffix} />
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  Campus Legacy
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: Formula 4 Asymmetric 5-Photo Collage Grid       */}
          {/* ============================================================== */}
          <div className="lg:col-span-6 xl:col-span-5 relative mt-4 lg:mt-0">
            {/* Ambient visual badge */}
            <div className="absolute -top-3 -right-2 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
              <Sparkles className="h-3 w-3 text-sky-400" />
              <span>Campus Family</span>
            </div>

            {/* DESKTOP COLLAGE: 5-Photo Bento Grid Layout */}
            <div className="hidden sm:grid grid-cols-12 gap-3.5 p-2 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200/70 shadow-xl shadow-slate-900/5">
              
              {/* Tile 1: Primary Tall Anchor (Worship / Fellowship Fire) */}
              <div className="col-span-7 row-span-2 relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-100 shadow-sm group">
                <Image
                  src={collageItems[0]?.src || DEFAULT_COLLAGE[0].src}
                  alt={collageItems[0]?.alt || DEFAULT_COLLAGE[0].alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 50vw, 320px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <span className="absolute bottom-3 left-3 text-[10px] font-black uppercase tracking-wider text-white bg-slate-900/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                  {collageItems[0]?.tag || 'Community'}
                </span>
              </div>

              {/* Tile 2: Academic Giants / Student Smiles */}
              <div className="col-span-5 relative aspect-square overflow-hidden rounded-2xl bg-slate-100 shadow-sm group">
                <Image
                  src={collageItems[1]?.src || DEFAULT_COLLAGE[1].src}
                  alt={collageItems[1]?.alt || DEFAULT_COLLAGE[1].alt}
                  fill
                  sizes="(max-width: 1024px) 25vw, 180px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute bottom-2.5 left-2.5 text-[9px] font-black uppercase tracking-wider text-white bg-slate-900/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                  {collageItems[1]?.tag || 'Worship'}
                </span>
              </div>

              {/* Tile 3: Choir / Operational Team Excellence */}
              <div className="col-span-5 relative aspect-square overflow-hidden rounded-2xl bg-slate-100 shadow-sm group">
                <Image
                  src={collageItems[2]?.src || DEFAULT_COLLAGE[2].src}
                  alt={collageItems[2]?.alt || DEFAULT_COLLAGE[2].alt}
                  fill
                  sizes="(max-width: 1024px) 25vw, 180px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute bottom-2.5 left-2.5 text-[9px] font-black uppercase tracking-wider text-white bg-slate-900/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                  {collageItems[2]?.tag || 'Academics'}
                </span>
              </div>

              {/* Tile 4: Deep Prayer & Ministering */}
              <div className="col-span-6 relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 shadow-sm group">
                <Image
                  src={collageItems[3]?.src || DEFAULT_COLLAGE[3].src}
                  alt={collageItems[3]?.alt || DEFAULT_COLLAGE[3].alt}
                  fill
                  sizes="(max-width: 1024px) 30vw, 200px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute bottom-2.5 left-2.5 text-[9px] font-black uppercase tracking-wider text-white bg-slate-900/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                  {collageItems[3]?.tag || 'Choir'}
                </span>
              </div>

              {/* Tile 5: Campus Fellowship Togetherness */}
              <div className="col-span-6 relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 shadow-sm group">
                <Image
                  src={collageItems[4]?.src || DEFAULT_COLLAGE[4].src}
                  alt={collageItems[4]?.alt || DEFAULT_COLLAGE[4].alt}
                  fill
                  sizes="(max-width: 1024px) 30vw, 200px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute bottom-2.5 left-2.5 text-[9px] font-black uppercase tracking-wider text-white bg-slate-900/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                  {collageItems[4]?.tag || 'Prayer'}
                </span>
              </div>
            </div>

            {/* MOBILE COMPACT COLLAGE: 2-Card Overlapping Layout (Above/At Fold) */}
            <div className="sm:hidden grid grid-cols-2 gap-3 pt-2">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-md bg-slate-100 group">
                <Image
                  src={collageItems[0]?.src || DEFAULT_COLLAGE[0].src}
                  alt={collageItems[0]?.alt || DEFAULT_COLLAGE[0].alt}
                  fill
                  priority
                  sizes="50vw"
                  className="object-cover object-center"
                />
                <span className="absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-wider text-white bg-slate-950/70 px-2 py-0.5 rounded-full">
                  {collageItems[0]?.tag || 'Community'}
                </span>
              </div>
              <div className="space-y-3">
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md bg-slate-100">
                  <Image
                    src={collageItems[1]?.src || DEFAULT_COLLAGE[1].src}
                    alt={collageItems[1]?.alt || DEFAULT_COLLAGE[1].alt}
                    fill
                    sizes="50vw"
                    className="object-cover object-center"
                  />
                  <span className="absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-wider text-white bg-slate-950/70 px-2 py-0.5 rounded-full">
                    {collageItems[1]?.tag || 'Worship'}
                  </span>
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md bg-slate-100">
                  <Image
                    src={collageItems[2]?.src || DEFAULT_COLLAGE[2].src}
                    alt={collageItems[2]?.alt || DEFAULT_COLLAGE[2].alt}
                    fill
                    sizes="50vw"
                    className="object-cover object-center"
                  />
                  <span className="absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-wider text-white bg-slate-950/70 px-2 py-0.5 rounded-full">
                    {collageItems[2]?.tag || 'Academics'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}