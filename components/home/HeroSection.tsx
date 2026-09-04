/**
 * HeroSection — Client Component
 *
 * Implements Section 2.1 of SDD & CLAUDE.md guidelines.
 * Displays live headline, accent word, credo, and description from Sanity Studio siteSettings.
 * Animated metric counters for active members, weekly services, and campus legacy.
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, Variants } from 'framer-motion'
import { ArrowRight, Radio } from 'lucide-react'
import CountUpNumber from '@/components/ui/CountUpNumber'

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

export interface SiteSettingsData {
  heroHeadlineStart?: string
  heroAccentWord?: string
  heroHeadlineEnd?: string
  heroCredo?: string
  heroParagraph?: string
  heroPhotoUrl?: string
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

function parseMetric(val?: string, defaultEnd: number = 0, defaultSuffix: string = '') {
  if (!val) return { end: defaultEnd, suffix: defaultSuffix }
  const match = val.match(/^(\d+)(.*)$/)
  if (!match) return { end: defaultEnd, suffix: defaultSuffix }
  return { end: parseInt(match[1], 10), suffix: match[2] || '' }
}

export default function HeroSection({ settings }: Props) {
  const headlineStart = settings?.heroHeadlineStart || 'An Assembly Of'
  const accentWord = settings?.heroAccentWord || 'Spiritual Dynamites'
  const headlineEnd = settings?.heroHeadlineEnd || 'And Academic Giants'
  const credo = settings?.heroCredo || 'Jesus in our hearts, letters in our heads.'
  const paragraph = settings?.heroParagraph || ''
  const heroPhoto = settings?.heroPhotoUrl || '/gallery/gallery-8.jpg'

  const m1 = parseMetric(settings?.statsActiveMembers, 400, '+')
  const m2 = parseMetric(settings?.statsWeeklyServices, 3, 'x')
  const m3 = parseMetric(settings?.statsCampusLegacy, 10, 'yrs+')

  return (
    <section className="relative w-full bg-gradient-to-b from-white via-[#fafaf9] to-[#fafaf9] py-8 sm:py-14 md:py-18 lg:py-20 overflow-hidden">
      {/* Soft Ambient Warm & Sky Radial Glows */}
      <div className="absolute top-10 -left-20 h-[280px] sm:h-[450px] w-[280px] sm:w-[450px] rounded-full bg-sky-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 h-[250px] sm:h-[400px] w-[250px] sm:w-[400px] rounded-full bg-amber-100/30 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Headline, Credo, Description & CTAs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="md:col-span-7 text-left space-y-4 sm:space-y-5"
          >
            {/* Master Headline: Large Serif with Darker Shade of Brand Blue */}
            <motion.h1
              variants={itemVariants}
              className="font-serif text-[2.25rem] xs:text-[2.65rem] sm:text-4xl md:text-5xl lg:text-[3.85rem] font-medium tracking-tight text-slate-950 leading-[1.14] sm:leading-[1.12]"
            >
              <span>{headlineStart}</span> <br />
              <span className="italic text-[#0077cc] inline-block my-0.5">
                {accentWord}
              </span> <br />
              <span>{headlineEnd}</span>
            </motion.h1>

            {/* Fellowship Credo */}
            <motion.div variants={itemVariants} className="pt-0.5">
              <p className="text-xs sm:text-sm font-semibold tracking-wide text-slate-500 italic">
                {credo}
              </p>
            </motion.div>

            {/* Description Paragraph (from Sanity Studio) */}
            {paragraph && (
              <motion.p
                variants={itemVariants}
                className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal max-w-xl pt-0.5"
              >
                {paragraph}
              </motion.p>
            )}

            {/* Primary Actions: Mobile-first Touch-friendly CTAs */}
            <motion.div
              variants={itemVariants}
              className="pt-2 flex flex-col xs:flex-row items-stretch xs:items-center gap-3.5 sm:gap-6"
            >
              <Link
                href="#visit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-bold px-7 sm:px-8 py-3.5 sm:py-4 text-xs uppercase tracking-wider shadow-lg shadow-slate-950/15 transition-all text-center hover:scale-[1.03] active:scale-[0.98] w-full xs:w-auto min-h-[44px]"
              >
                <span>Plan a Visit</span>
                <ArrowRight className="h-4 w-4 text-sky-400" />
              </Link>

              <Link
                href="/sermons"
                className="inline-flex items-center justify-center xs:justify-start gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-[#0077cc] transition-all hover:translate-x-0.5 py-2.5 px-1 min-h-[44px]"
              >
                <Radio className="h-4 w-4 text-[#0077cc]" />
                <span>Sermon Podcasts</span>
              </Link>
            </motion.div>

            {/* Integrated Metric Counter Strip — Fluid Mobile Grid */}
            <motion.div
              variants={itemVariants}
              className="pt-5 sm:pt-7 grid grid-cols-3 gap-2 xs:gap-3 sm:gap-8 text-left max-w-lg"
            >
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight">
                  <CountUpNumber end={m1.end} suffix={m1.suffix} />
                </div>
                <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 sm:mt-1">Active Members</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0077cc] tracking-tight">
                  <CountUpNumber end={m2.end} suffix={m2.suffix} />
                </div>
                <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 sm:mt-1">Weekly Services</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight">
                  <CountUpNumber end={m3.end} suffix={m3.suffix} />
                </div>
                <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 sm:mt-1">Campus Legacy</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Clean Organic Pebble Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-5 flex items-center justify-center md:justify-end pt-2 md:pt-0"
          >
            <motion.div
              whileHover={{ scale: 1.02, rotate: 0.5 }}
              transition={{ duration: 0.4 }}
              className="relative w-full max-w-[260px] xs:max-w-[285px] sm:max-w-[340px] md:max-w-[350px] lg:max-w-[390px] aspect-[4/5] overflow-hidden rounded-[42%_58%_70%_30%_/_45%_45%_55%_55%] shadow-2xl shadow-slate-900/10 bg-slate-100"
            >
              <Image
                src={heroPhoto}
                alt="Students at Edo State University Christian Campus Fellowship"
                fill
                priority
                sizes="(max-width: 640px) 260px, (max-width: 1024px) 350px, 390px"
                className="object-cover object-top hover:scale-105 transition-transform duration-700"
              />
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}