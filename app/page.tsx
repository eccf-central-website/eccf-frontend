'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, Variants } from 'framer-motion'
import {
  Clock,
  ArrowRight,
  Radio,
  MapPin,
} from 'lucide-react'
import ServiceScheduleConsole from '@/components/home/ServiceScheduleConsole'
import TeamsSection from '@/components/home/TeamsSection'
import GivingHubSection from '@/components/home/GivingHubSection'
import CountUpNumber from '@/components/ui/CountUpNumber'
import { SpotifyIcon, YouTubeMusicIcon, YouTubeIcon } from '@/components/ui/PlatformIcons'
import { sanityClient } from '@/lib/sanity'
import { SITE_SETTINGS_QUERY } from '@/lib/queries'

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

interface SiteSettings {
  heroHeadlineStart?: string
  heroAccentWord?: string
  heroHeadlineEnd?: string
  heroCredo?: string
  heroParagraph?: string
  heroPhotoUrl?: string
  statsActiveMembers?: string
  statsWeeklyServices?: string
  statsCampusLegacy?: string
}

function parseMetric(val?: string, defaultEnd: number = 0, defaultSuffix: string = '') {
  if (!val) return { end: defaultEnd, suffix: defaultSuffix }
  const match = val.match(/^(\d+)(.*)$/)
  if (!match) return { end: defaultEnd, suffix: defaultSuffix }
  return { end: parseInt(match[1], 10), suffix: match[2] || '' }
}

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    sanityClient
      .fetch<SiteSettings>(SITE_SETTINGS_QUERY)
      .then((data) => {
        if (data) setSettings(data)
      })
      .catch((err) => {
        console.warn('Failed to load Sanity site settings, using defaults:', err)
      })
  }, [])

  // Content with live Sanity CMS values & safe fallback defaults
  const headlineStart = settings?.heroHeadlineStart || 'An Assembly Of'
  const accentWord = settings?.heroAccentWord || 'Spiritual Dynamites'
  const headlineEnd = settings?.heroHeadlineEnd || 'And Academic Giants'
  const credo = settings?.heroCredo || 'Jesus in our hearts, letters in our heads.'
  const paragraph =
    settings?.heroParagraph ||
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.'
  const heroPhoto = settings?.heroPhotoUrl || '/gallery/gallery-8.jpg'

  return (
    <div className="relative min-h-screen bg-[#fafaf9] text-slate-900 font-sans selection:bg-[#0077cc] selection:text-white overflow-x-hidden pt-16 sm:pt-20">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION — HIGHLY RESPONSIVE EDITORIAL LAYOUT                      */}
      {/* ========================================================================= */}
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

              {/* Fellowship Credo — Polished Modern Typography & Positioning */}
              <motion.div variants={itemVariants} className="pt-0.5">
                <p className="text-xs sm:text-sm font-semibold tracking-wide text-slate-500 italic">
                  {credo}
                </p>
              </motion.div>

              {/* Description Paragraph (Manageable via Sanity Studio, with Lorem Ipsum Placeholder) */}
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
                {(() => {
                  const m1 = parseMetric(settings?.statsActiveMembers, 400, '+')
                  const m2 = parseMetric(settings?.statsWeeklyServices, 3, 'x')
                  const m3 = parseMetric(settings?.statsCampusLegacy, 10, 'yrs+')
                  return (
                    <>
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
                    </>
                  )
                })()}
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

      {/* ========================================================================= */}
      {/* 2. WHO WE ARE — OPEN EDITORIAL LIST                                       */}
      {/* ========================================================================= */}
      <section id="about" className="py-14 sm:py-24 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
            
            {/* Left Column: The Dual Mandate */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5 }}
              className="md:col-span-7 space-y-4 sm:space-y-6"
            >
              <div>
                <span className="text-xs font-black tracking-widest text-[#0077cc] uppercase block mb-2 font-mono">
                  WHO WE ARE
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                  Raised for Kingdom Impact & Academic Distinction.
                </h2>
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal">
                  ECCF exists to eliminate the false divide between spiritual fervency and academic excellence. We empower students to walk in the fullness of the Holy Spirit while attaining top academic honors.
                </p>
              </div>

              {/* Numbered Core Pillars — Open Editorial Stream */}
              <div className="divide-y divide-slate-100 pt-1 sm:pt-2">
                {[
                  {
                    num: '01',
                    title: 'Spiritual Dynamites',
                    desc: 'Deep prayer, uncompromised scriptural doctrine, apostolic impartation, and practical holiness on campus.',
                  },
                  {
                    num: '02',
                    title: 'Academic Giants',
                    desc: 'Rigorous study discipline, peer tutorial mentorship, intellectual diligence, and graduating at the top of every faculty.',
                  },
                  {
                    num: '03',
                    title: 'Kingdom Family & Community',
                    desc: 'A loving, supportive brotherhood and sisterhood providing welfare assistance, encouragement, and lifelong Christian friendships.',
                  },
                ].map((pillar, idx) => (
                  <motion.div
                    key={pillar.num}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="flex items-start gap-3.5 sm:gap-4 py-3.5 sm:py-5 group"
                  >
                    <span className="text-xs sm:text-sm font-black text-[#0077cc] font-mono pt-0.5 tracking-wider shrink-0">
                      {pillar.num}
                    </span>
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#0077cc] transition-colors">
                        {pillar.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-normal">
                        {pillar.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Column: Dynamic Student Moments Collage */}
            <div className="md:col-span-5 grid grid-cols-2 gap-2.5 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.03 }}
                className="relative h-44 xs:h-48 sm:h-60 md:h-68 lg:h-76 w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm"
              >
                <Image
                  src="/gallery/gallery-1.jpg"
                  alt="Worship at ECCF"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="relative h-44 xs:h-48 sm:h-60 md:h-68 lg:h-76 w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm mt-3 sm:mt-8"
              >
                <Image
                  src="/gallery/gallery-2.jpg"
                  alt="Student Prayer Session"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE SERVICE SCHEDULE CONSOLE                                   */}
      {/* ========================================================================= */}
      <ServiceScheduleConsole />

      {/* ========================================================================= */}
      {/* 4. TEAMS & FELLOWSHIP LIFE SECTION                                        */}
      {/* ========================================================================= */}
      <TeamsSection />

      {/* ========================================================================= */}
      {/* 5. SERMON VAULT & PODCASTS (STREAMLINED EDITORIAL CARDS)                  */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-24 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-14 gap-4">
            <div>
              <span className="text-xs font-black tracking-widest text-[#0077cc] uppercase block mb-2 font-mono">
                SERMON VAULT & PODCASTS
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
                Latest Inspired Messages
              </h2>
            </div>
            <Link
              href="/sermons"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#0077cc] hover:text-sky-800 transition-colors group"
            >
              <span>Explore All Sermons</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* 3-Column Sermon Cards with Clean Organic Style */}
          <div className="grid grid-cols-1 gap-5 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                tag: 'FAVOUR UNVEILED',
                title: 'Walking in Uncommon Favour',
                speaker: 'Bro. Emmanuel Obi',
                date: 'July 6, 2025',
                duration: '48 min',
                spotifyUrl: 'https://open.spotify.com',
                youtubeMusicUrl: 'https://music.youtube.com',
                youtubeUrl: 'https://youtube.com',
              },
              {
                tag: 'CAMPUS GIANTS',
                title: 'The Discipline of the Anointed Student',
                speaker: 'Sis. Grace Iyamu',
                date: 'June 29, 2025',
                duration: '52 min',
                spotifyUrl: 'https://open.spotify.com',
                youtubeMusicUrl: 'https://music.youtube.com',
                youtubeUrl: 'https://youtube.com',
              },
              {
                tag: 'POWER & PRAYER',
                title: 'Praying with Authority on Campus',
                speaker: 'Bro. Samuel Edosa',
                date: 'June 22, 2025',
                duration: '45 min',
                spotifyUrl: 'https://open.spotify.com',
                youtubeMusicUrl: 'https://music.youtube.com',
                youtubeUrl: 'https://youtube.com',
              },
            ].map((sermon, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-[#fafaf9] shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all"
              >
                <div>
                  <div className="relative h-40 sm:h-48 w-full bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-slate-200/50 flex items-center justify-center p-4">
                    <div className="absolute top-3.5 right-3.5 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{sermon.duration}</span>
                    </div>

                    <div className="absolute top-3.5 left-3.5 rounded-full bg-white/80 backdrop-blur-md text-[#0077cc] text-[10px] font-black px-3 py-1">
                      {sermon.tag}
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0077cc] shadow-sm group-hover:scale-110 transition-transform">
                      <Radio className="h-5 w-5 text-[#0077cc]" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#0077cc] transition-colors leading-snug">
                      {sermon.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {sermon.speaker} &bull; {sermon.date}
                    </p>
                  </div>
                </div>

                {/* Clean Platform Buttons */}
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Stream on:</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={sermon.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Listen on Spotify"
                      aria-label="Listen on Spotify"
                      className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                    >
                      <SpotifyIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </a>

                    <a
                      href={sermon.youtubeMusicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Listen on YouTube Music"
                      aria-label="Listen on YouTube Music"
                      className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    >
                      <YouTubeMusicIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </a>

                    <a
                      href={sermon.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Watch on YouTube"
                      aria-label="Watch on YouTube"
                      className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    >
                      <YouTubeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. HIGH-IMPACT GIVING HUB                                                 */}
      {/* ========================================================================= */}
      <GivingHubSection />

      {/* ========================================================================= */}
      {/* 7. PLAN A VISIT & LOCATION ENQUIRY SECTION                                */}
      {/* ========================================================================= */}
      <section id="visit" className="py-14 sm:py-24 bg-[#fafaf9]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55 }}
            className="text-center"
          >
            <span className="text-xs font-black tracking-widest text-[#0077cc] uppercase block mb-2 font-mono">
              JOIN OUR CAMPUS FAMILY
            </span>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight mt-1">
              Planning a Visit to ECCF?
            </h2>

            <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              Whether you&apos;re a fresher stepping onto campus for the first time or a returning scholar, we have a warm seat waiting for you. Expect vibrant praise, sound doctrine, and genuine community.
            </p>

            {/* Fellowship Location Highlight */}
            <div className="mt-7 sm:mt-8 rounded-3xl bg-white p-5 sm:p-7 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-slate-800 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#0077cc]">
                <MapPin className="h-6 w-6 text-[#0077cc]" />
              </div>
              <div className="text-center sm:text-left">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#0077cc] block">
                  FELLOWSHIP VENUE
                </span>
                <span className="text-base sm:text-xl font-black text-slate-900 block">
                  NLT 5, Faculty of Law, ESUI
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Edo State University Iyamho &bull; NLT 5
                </span>
              </div>
            </div>

            {/* Direct Enquiry / Direction Assistance */}
            <div className="mt-7 sm:mt-8 max-w-xl mx-auto text-center space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Need any help locating the venue or arranging a ride? Message <span className="font-bold text-slate-900">Ransom</span> on WhatsApp or email our team:
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://wa.me/2348100000000?text=Hello%20Ransom%2C%20I%20am%20planning%20to%20visit%20ECCF%20and%20need%20help%20locating%20NLT%205%20Faculty%20of%20Law."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.03] active:scale-[0.98] min-h-[44px]"
                >
                  <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.861.947 3.013.947 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.454-.471-4.908-1.292l-5.092 1.354 1.38-5.041c-.911-1.507-1.428-3.266-1.428-5.021 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                  </svg>
                  <span>Message Ransom (+234 810 000 0000)</span>
                </a>

                <a
                  href="mailto:edsuchristiancampusfellowship@gmail.com?subject=Planning%20a%20Visit%20to%20ECCF"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 text-slate-800 font-bold px-7 py-3.5 text-xs uppercase tracking-wider hover:bg-slate-200 transition-all hover:scale-[1.03] active:scale-[0.98] min-h-[44px]"
                >
                  <span>Email Fellowship</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
