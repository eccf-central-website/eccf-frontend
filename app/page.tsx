'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, Variants } from 'framer-motion'
import {
  Clock,
  ArrowRight,
  Headphones,
  GraduationCap,
  Flame,
  Users,
  Radio,
} from 'lucide-react'
import ServiceScheduleConsole from '@/components/home/ServiceScheduleConsole'
import TeamsSection from '@/components/home/TeamsSection'
import GivingHubSection from '@/components/home/GivingHubSection'
import CountUpNumber from '@/components/ui/CountUpNumber'
import { SpotifyIcon, YouTubeMusicIcon, YouTubeIcon } from '@/components/ui/PlatformIcons'

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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#fafaf9] text-slate-900 font-sans selection:bg-[#0095ff] selection:text-white overflow-x-hidden pt-14 sm:pt-16">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION — SPACIOUS, AIRY EDITORIAL LAYOUT                         */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-gradient-to-b from-white via-[#fafaf9] to-[#fafaf9] py-10 sm:py-12 md:py-16 lg:py-20 border-b border-slate-200/60 overflow-hidden">
        {/* Soft Ambient Warm & Sky Radial Glows */}
        <div className="absolute top-10 -left-20 h-[350px] sm:h-[450px] w-[350px] sm:w-[450px] rounded-full bg-sky-100/50 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 h-[300px] sm:h-[400px] w-[300px] sm:w-[400px] rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Confident Editorial Copy with Generous Breathing Room */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="md:col-span-7 text-left space-y-4 sm:space-y-5"
            >
              {/* Minimalist Live Status Pill */}
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-600 flex-wrap"
              >
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-extrabold uppercase tracking-wider text-slate-800">
                  NEXT UP &bull; Sunday 08:00 AM &bull; NLT 5 Law Auditorium
                </span>
              </motion.div>

              {/* Master Headline: Relaxed, Airy Line Height */}
              <motion.h1
                variants={itemVariants}
                className="text-[2.2rem] sm:text-3xl md:text-[2.6rem] lg:text-[3.25rem] font-black tracking-tight text-slate-950 leading-[1.24] sm:leading-[1.26]"
              >
                An Assembly Of <br />
                <span className="font-serif italic font-normal tracking-normal text-[#0095ff] inline-block my-1 sm:my-2">
                  Spiritual Dynamites
                </span> <br />
                And Academic Giants.
              </motion.h1>

              {/* Credo Divider Line */}
              <motion.div variants={itemVariants} className="flex items-center gap-3 pt-1">
                <span className="h-0.5 w-7 bg-[#0095ff] shrink-0" />
                <span className="text-[9px] sm:text-xs font-black tracking-wider text-[#0095ff] uppercase font-mono">
                  JESUS IN OUR HEARTS, LETTERS IN OUR HEADS.
                </span>
              </motion.div>

              {/* Subheadline Copy */}
              <motion.p
                variants={itemVariants}
                className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal max-w-xl pt-0.5"
              >
                More than a fellowship — we are a family raising a generation of believers who excel spiritually and academically, rooted in faith, built for impact.
              </motion.p>

              {/* Primary Actions: Generously Spaced CTAs */}
              <motion.div
                variants={itemVariants}
                className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6"
              >
                <Link
                  href="#visit"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-bold px-8 py-3.5 sm:py-4 text-xs uppercase tracking-wider shadow-lg shadow-slate-950/15 transition-all text-center hover:scale-[1.03] active:scale-[0.98] w-full sm:w-auto"
                >
                  <span>Plan a Visit</span>
                  <ArrowRight className="h-4 w-4 text-sky-400" />
                </Link>

                <Link
                  href="/sermons"
                  className="inline-flex items-center justify-center sm:justify-start gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-[#0095ff] transition-all hover:translate-x-0.5 py-2 px-1"
                >
                  <Radio className="h-4 w-4 text-[#0095ff]" />
                  <span>Sermon Podcasts</span>
                </Link>
              </motion.div>

              {/* Integrated Metric Counter Strip — Spacious & Distinct */}
              <motion.div
                variants={itemVariants}
                className="pt-6 sm:pt-7 border-t border-slate-200/80 grid grid-cols-3 gap-3 sm:gap-8 text-left max-w-lg"
              >
                <div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight">
                    <CountUpNumber end={400} suffix="+" />
                  </div>
                  <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active Members</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0095ff] tracking-tight">
                    <CountUpNumber end={5} />
                  </div>
                  <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Ministry Teams</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight">
                    <CountUpNumber end={10} suffix="yrs+" />
                  </div>
                  <div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Campus Legacy</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column: Proportional Pebble Photo Frame (5 cols on md/lg) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="md:col-span-5 flex flex-col items-center md:items-end justify-center pt-4 md:pt-0"
            >
              {/* Organic Pebble / Egg Mask Shape Frame */}
              <motion.div
                whileHover={{ scale: 1.02, rotate: 0.5 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-[260px] xs:max-w-[290px] sm:max-w-[330px] md:max-w-[340px] lg:max-w-[380px] aspect-[4/5] overflow-hidden rounded-[42%_58%_70%_30%_/_45%_45%_55%_55%] border-4 border-white shadow-2xl shadow-slate-900/10 bg-slate-100"
              >
                {/* Safe-Area Centered Top Location Tag */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-slate-950/70 backdrop-blur-md px-3 py-1 text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider text-sky-300 border border-white/15 shadow-md whitespace-nowrap pointer-events-none">
                  EDO STATE UNIVERSITY, IYAMHO
                </div>

                <Image
                  src="/gallery/gallery-8.jpg"
                  alt="Student Scholar & Minister at Edo State University Christian Campus Fellowship"
                  fill
                  priority
                  sizes="(max-width: 640px) 260px, (max-width: 1024px) 340px, 380px"
                  className="object-cover object-top hover:scale-105 transition-transform duration-700"
                />
              </motion.div>

              {/* Charter Information Anchored Fully Outside Image */}
              <div className="mt-3.5 sm:mt-4 text-center md:text-left w-full max-w-[260px] xs:max-w-[290px] sm:max-w-[330px] md:max-w-[340px] lg:max-w-[380px] md:ml-auto">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 block font-mono">
                  EST. 2014 — CHARTER
                </span>
                <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed mt-0.5">
                  Nurturing spiritual growth and academic excellence at Edo State University, Iyamho.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. WHO WE ARE — DUAL MANDATE EDITORIAL SECTION                            */}
      {/* ========================================================================= */}
      <section id="about" className="py-14 sm:py-20 md:py-24 bg-white border-b border-slate-200/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-8 lg:gap-12 items-center">
            
            {/* Left Column: The Dual Mandate (7 cols on md/lg) */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5 }}
              className="md:col-span-7 space-y-5 sm:space-y-6"
            >
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-[#0095ff] uppercase mb-2">
                  <span className="h-1.5 w-6 rounded-full bg-[#0095ff]" />
                  <span>WHO WE ARE</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                  Raised for Kingdom Impact & Academic Distinction.
                </h2>
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal">
                  ECCF exists to eliminate the false divide between spiritual fervency and academic excellence. We empower students to walk in the fullness of the Holy Spirit while attaining top academic honors.
                </p>
              </div>

              {/* Numbered Core Pillars with Hover Micro-interactions */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4 pt-1">
                {[
                  {
                    num: '01',
                    icon: Flame,
                    title: 'Spiritual Dynamites',
                    desc: 'Deep prayer, uncompromised scriptural doctrine, apostolic impartation, and practical holiness on campus.',
                  },
                  {
                    num: '02',
                    icon: GraduationCap,
                    title: 'Academic Giants',
                    desc: 'Rigorous study discipline, peer tutorial mentorship, intellectual diligence, and graduating at the top of every faculty.',
                  },
                  {
                    num: '03',
                    icon: Users,
                    title: 'Kingdom Family & Community',
                    desc: 'A loving, supportive brotherhood and sisterhood providing welfare assistance, encouragement, and lifelong Christian friendships.',
                  },
                ].map((pillar, idx) => {
                  const Icon = pillar.icon
                  return (
                    <motion.div
                      key={pillar.num}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.45, delay: idx * 0.1 }}
                      whileHover={{ x: 6, transition: { duration: 0.2 } }}
                      className="flex gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-2xl border border-slate-100 bg-[#fafaf9] hover:bg-white hover:border-slate-200 transition-colors shadow-sm"
                    >
                      <div className="flex h-8 sm:h-10 w-8 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095ff] font-mono font-black text-xs sm:text-sm">
                        {pillar.num}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-[#0095ff]" />
                          <h4 className="text-sm sm:text-base font-black text-slate-900">{pillar.title}</h4>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-normal">
                          {pillar.desc}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Right Column: Dynamic Student Moments Collage (5 cols on md/lg) */}
            <div className="md:col-span-5 grid grid-cols-2 gap-2.5 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.03 }}
                className="relative h-44 sm:h-56 md:h-64 lg:h-72 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
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
                className="relative h-44 sm:h-56 md:h-64 lg:h-72 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm mt-3 sm:mt-6"
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
      {/* 5. SERMON VAULT & PODCASTS (ICON-ONLY STREAMING PLATFORMS)                */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 md:py-24 bg-white border-t border-slate-200/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black text-[#0095ff] border border-sky-100/80 uppercase tracking-widest mb-2">
                <Headphones className="h-3 w-3 text-[#0095ff]" />
                <span>SERMON VAULT & PODCASTS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
                Latest Inspired Messages
              </h2>
            </div>
            <Link
              href="/sermons"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#0095ff] hover:text-sky-700 transition-colors group"
            >
              <span>Explore All Sermons</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* 3-Column Sermon Cards with Upward Staggered Entrance */}
          <div className="grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                whileHover={{ y: -7, transition: { duration: 0.25 } }}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl hover:shadow-sky-500/10 transition-shadow"
              >
                <div>
                  <div className="relative h-36 sm:h-44 w-full bg-gradient-to-br from-sky-100/70 via-sky-50/50 to-slate-100 flex items-center justify-center p-4">
                    <div className="absolute top-3 right-3 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{sermon.duration}</span>
                    </div>

                    <div className="absolute top-3 left-3 rounded-full bg-sky-500/20 backdrop-blur-md text-[#0095ff] text-[10px] font-black px-3 py-1 border border-sky-300/40">
                      {sermon.tag}
                    </div>

                    <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white text-[#0095ff] shadow-md">
                      <Headphones className="h-5 w-5 sm:h-6 sm:w-6 text-[#0095ff]" />
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#0095ff] transition-colors leading-snug">
                      {sermon.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      {sermon.speaker} &bull; {sermon.date}
                    </p>
                  </div>
                </div>

                {/* Clean Icon-Only Platform Buttons */}
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Stream on:</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={sermon.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Listen on Spotify"
                      aria-label="Listen on Spotify"
                      className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 transition-all shadow-sm"
                    >
                      <SpotifyIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </a>

                    <a
                      href={sermon.youtubeMusicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Listen on YouTube Music"
                      aria-label="Listen on YouTube Music"
                      className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 transition-all shadow-sm"
                    >
                      <YouTubeMusicIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </a>

                    <a
                      href={sermon.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Watch on YouTube"
                      aria-label="Watch on YouTube"
                      className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition-all shadow-sm"
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
      <section id="visit" className="py-14 sm:py-20 md:py-24 bg-[#fafaf9] border-t border-slate-200/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55 }}
            className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-8 md:p-12 shadow-sm text-center"
          >
            <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-[#0095ff] uppercase mb-2">
              <span className="h-1.5 w-6 rounded-full bg-[#0095ff]" />
              <span>JOIN OUR CAMPUS FAMILY</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight mt-1">
              Planning a Visit to ECCF?
            </h2>

            <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              Whether you&apos;re a fresher stepping onto campus for the first time or a returning scholar, we have a warm seat waiting for you. Expect vibrant praise, sound doctrine, and genuine community.
            </p>

            {/* Exact Fellowship Location Box */}
            <div className="mt-6 sm:mt-8 rounded-2xl bg-sky-50/70 border border-sky-100 p-3.5 sm:p-5 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-slate-800">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#0095ff] text-white shadow-sm">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#0095ff] block">
                  FELLOWSHIP AUDITORIUM VENUE
                </span>
                <span className="text-sm sm:text-lg font-black text-slate-900 block">
                  NLT 5, Faculty of Law, ESUI
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  Edo State University Iyamho &bull; Campus Auditorium
                </span>
              </div>
            </div>

            {/* Direct Enquiry / Direction Assistance */}
            <div className="mt-5 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100 max-w-xl mx-auto text-center space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Need any help locating the venue or arranging a ride? Message <span className="font-bold text-slate-900">Ransom</span> on WhatsApp or call our team:
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
                <a
                  href="https://wa.me/2348100000000?text=Hello%20Ransom%2C%20I%20am%20planning%20to%20visit%20ECCF%20and%20need%20help%20locating%20NLT%205%20Faculty%20of%20Law."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 sm:px-7 py-3 text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.03] active:scale-[0.98]"
                >
                  <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.861.947 3.013.947 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.454-.471-4.908-1.292l-5.092 1.354 1.38-5.041c-.911-1.507-1.428-3.266-1.428-5.021 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                  </svg>
                  <span>Message Ransom (+234 810 000 0000)</span>
                </a>

                <a
                  href="mailto:edsuchristiancampusfellowship@gmail.com?subject=Planning%20a%20Visit%20to%20ECCF"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white text-slate-800 font-bold px-6 py-3 text-xs uppercase tracking-wider hover:bg-slate-50 transition-all hover:scale-[1.03] active:scale-[0.98]"
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
