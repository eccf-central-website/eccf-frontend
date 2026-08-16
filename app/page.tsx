'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, Variants } from 'framer-motion'
import {
  Clock,
  ArrowRight,
  Sparkles,
  Headphones,
  GraduationCap,
  Flame,
  Users,
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
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#fafaf9] text-slate-900 font-sans selection:bg-[#0095ff] selection:text-white overflow-x-hidden pt-16">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION — BESPOKE EDITORIAL ASYMMETRIC LAYOUT                     */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-gradient-to-b from-white via-[#fafaf9] to-[#fafaf9] py-10 sm:py-16 lg:py-24 border-b border-slate-200/60 overflow-hidden">
        {/* Ambient Warm Radial Lighting */}
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-sky-100/60 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 h-[400px] w-[400px] rounded-full bg-amber-50/70 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 items-center">
            
            {/* Left Column: Confident Editorial Copy (7 cols) */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7 text-left space-y-5 sm:space-y-6"
            >
              {/* Gathering Status Pill */}
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-slate-700 border border-slate-200 shadow-sm max-w-full flex-wrap"
              >
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[#0095ff] font-extrabold uppercase text-[10px] sm:text-[11px] tracking-wider shrink-0">NEXT UP:</span>
                <span className="text-slate-700 font-medium">Sunday 08:00 AM &bull; NLT 5 Law Auditorium</span>
              </motion.div>

              {/* Master Headline */}
              <motion.h1
                variants={itemVariants}
                className="text-3xl sm:text-5xl lg:text-[3.75rem] font-black tracking-tight text-slate-950 leading-[1.15] sm:leading-[1.1]"
              >
                An Assembly Of <br />
                <span className="text-[#0095ff]">Spiritual Dynamites</span> <br />
                And Academic Giants.
              </motion.h1>

              {/* Credo & Subheadline */}
              <motion.div variants={itemVariants} className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-xl bg-sky-50/80 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-black tracking-wider text-[#0095ff] border border-sky-100 uppercase font-mono">
                  &ldquo;JESUS IN OUR HEARTS, LETTERS IN OUR HEADS.&rdquo;
                </div>
                <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-normal max-w-xl">
                  The Christian Campus Fellowship at Edo State University. Raising Spirit-filled university scholars equipped to dominate their academic spheres and manifest Christ.
                </p>
              </motion.div>

              {/* Primary Actions */}
              <motion.div
                variants={itemVariants}
                className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              >
                <Link
                  href="#visit"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-bold px-7 sm:px-8 py-3.5 sm:py-4 text-xs uppercase tracking-wider shadow-lg shadow-slate-950/15 transition-all text-center hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Plan a Visit</span>
                  <ArrowRight className="h-4 w-4 text-sky-400" />
                </Link>

                <Link
                  href="/sermons"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300/80 bg-white text-slate-800 font-bold px-6 sm:px-7 py-3.5 sm:py-4 text-xs uppercase tracking-wider shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Headphones className="h-4 w-4 text-[#0095ff]" />
                  <span>Sermon Podcasts</span>
                </Link>
              </motion.div>

              {/* Integrated Metric Strip */}
              <motion.div
                variants={itemVariants}
                className="pt-6 sm:pt-8 border-t border-slate-200/80 grid grid-cols-3 gap-3 sm:gap-6 text-left max-w-lg"
              >
                <div>
                  <div className="text-xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    <CountUpNumber end={400} suffix="+" />
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Active Members</div>
                </div>
                <div>
                  <div className="text-xl sm:text-3xl font-black text-[#0095ff] tracking-tight">
                    <CountUpNumber end={5} />
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Ministry Teams</div>
                </div>
                <div>
                  <div className="text-xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    <CountUpNumber end={10} suffix="yrs+" />
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Campus Legacy</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column: Layered Editorial Photo Composition (5 cols) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 relative"
            >
              {/* Primary Cinematic Photo Card */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-2 sm:p-2.5 shadow-2xl shadow-slate-900/10">
                <div className="relative h-64 sm:h-80 lg:h-96 w-full overflow-hidden rounded-2xl bg-slate-100">
                  <Image
                    src="/gallery/gallery-4.jpg"
                    alt="ECCF Student Fellowship Community at Edo State University"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 text-white">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-sky-300 block">
                      EDO STATE UNIVERSITY, IYAMHO
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                      Spiritual Dynamites &bull; Academic Giants
                    </h3>
                  </div>
                </div>
              </div>

              {/* Floating Testimonial / Identity Card */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="mt-3 sm:mt-0 sm:absolute sm:-bottom-6 sm:-left-6 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200 p-3 sm:p-3.5 shadow-xl max-w-full sm:max-w-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 sm:h-9 w-8 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095ff] border border-sky-100">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#0095ff] block">
                      OUR CHARTER
                    </span>
                    <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight">
                      Spirit-Filled &bull; Academically Grounded
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. WHO WE ARE — DUAL MANDATE EDITORIAL SECTION                            */}
      {/* ========================================================================= */}
      <section id="about" className="py-16 sm:py-24 bg-white border-b border-slate-200/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: The Dual Mandate (7 cols) */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-[#0095ff] uppercase mb-2">
                  <span className="h-1.5 w-6 rounded-full bg-[#0095ff]" />
                  <span>WHO WE ARE</span>
                </div>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                  Raised for Kingdom Impact & Academic Distinction.
                </h2>
                <p className="mt-3 sm:mt-4 text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
                  ECCF exists to eliminate the false divide between spiritual fervency and academic excellence. We empower students to walk in the fullness of the Holy Spirit while attaining top academic honors.
                </p>
              </div>

              {/* Numbered Core Pillars */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4 pt-2">
                <div className="flex gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-slate-100 bg-[#fafaf9] hover:bg-white hover:border-slate-200 transition-all shadow-sm">
                  <div className="flex h-9 sm:h-10 w-9 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095ff] font-mono font-black text-xs sm:text-sm">
                    01
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-[#0095ff]" />
                      <h4 className="text-sm sm:text-base font-black text-slate-900">Spiritual Dynamites</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-normal">
                      Deep prayer, uncompromised scriptural doctrine, apostolic impartation, and practical holiness on campus.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-slate-100 bg-[#fafaf9] hover:bg-white hover:border-slate-200 transition-all shadow-sm">
                  <div className="flex h-9 sm:h-10 w-9 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095ff] font-mono font-black text-xs sm:text-sm">
                    02
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-[#0095ff]" />
                      <h4 className="text-sm sm:text-base font-black text-slate-900">Academic Giants</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-normal">
                      Rigorous study discipline, peer tutorial mentorship, intellectual diligence, and graduating at the top of every faculty.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-slate-100 bg-[#fafaf9] hover:bg-white hover:border-slate-200 transition-all shadow-sm">
                  <div className="flex h-9 sm:h-10 w-9 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0095ff] font-mono font-black text-xs sm:text-sm">
                    03
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#0095ff]" />
                      <h4 className="text-sm sm:text-base font-black text-slate-900">Kingdom Family & Community</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-normal">
                      A loving, supportive brotherhood and sisterhood providing welfare assistance, encouragement, and lifelong Christian friendships.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Student Moments Collage (5 cols) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="relative h-48 sm:h-64 lg:h-72 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <Image
                  src="/gallery/gallery-1.jpg"
                  alt="Worship at ECCF"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="relative h-48 sm:h-64 lg:h-72 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm mt-4 sm:mt-8">
                <Image
                  src="/gallery/gallery-2.jpg"
                  alt="Student Prayer Session"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
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
      <section className="py-16 sm:py-24 bg-white border-t border-slate-200/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-[#0095ff] uppercase mb-2">
                <span className="h-1.5 w-6 rounded-full bg-[#0095ff]" />
                <span>SERMON VAULT & PODCASTS</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Latest Inspired Messages
              </h2>
            </div>
            <Link
              href="/sermons"
              className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#0095ff] hover:text-sky-700 transition-colors"
            >
              <span>Explore All Sermons</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* 3-Column Sermon Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ y: -6 }}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl hover:shadow-sky-500/10 transition-all"
              >
                <div>
                  <div className="relative h-40 sm:h-44 w-full bg-gradient-to-br from-sky-100/70 via-sky-50/50 to-slate-100 flex items-center justify-center p-4">
                    <div className="absolute top-3 right-3 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{sermon.duration}</span>
                    </div>

                    <div className="absolute top-3 left-3 rounded-full bg-sky-500/20 backdrop-blur-md text-[#0095ff] text-[10px] font-black px-3 py-1 border border-sky-300/40">
                      {sermon.tag}
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0095ff] shadow-md">
                      <Headphones className="h-6 w-6 text-[#0095ff]" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#0095ff] transition-colors leading-snug">
                      {sermon.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      {sermon.speaker} &bull; {sermon.date}
                    </p>
                  </div>
                </div>

                {/* Clean Icon-Only Platform Buttons */}
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Stream on:</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={sermon.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Listen on Spotify"
                      aria-label="Listen on Spotify"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 transition-all shadow-sm"
                    >
                      <SpotifyIcon className="h-4 w-4" />
                    </a>

                    <a
                      href={sermon.youtubeMusicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Listen on YouTube Music"
                      aria-label="Listen on YouTube Music"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 transition-all shadow-sm"
                    >
                      <YouTubeMusicIcon className="h-4 w-4" />
                    </a>

                    <a
                      href={sermon.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Watch on YouTube"
                      aria-label="Watch on YouTube"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition-all shadow-sm"
                    >
                      <YouTubeIcon className="h-4 w-4" />
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
      <section id="visit" className="py-16 sm:py-24 bg-[#fafaf9] border-t border-slate-200/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-12 shadow-sm text-center"
          >
            <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-[#0095ff] uppercase mb-2">
              <span className="h-1.5 w-6 rounded-full bg-[#0095ff]" />
              <span>JOIN OUR CAMPUS FAMILY</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight mt-1">
              Planning a Visit to ECCF?
            </h2>

            <p className="mt-3 sm:mt-4 text-xs sm:text-base text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              Whether you&apos;re a fresher stepping onto campus for the first time or a returning scholar, we have a warm seat waiting for you. Expect vibrant praise, sound doctrine, and genuine community.
            </p>

            {/* Exact Fellowship Location Box */}
            <div className="mt-6 sm:mt-8 rounded-2xl bg-sky-50/70 border border-sky-100 p-4 sm:p-5 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-slate-800">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0095ff] text-white shadow-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0095ff] block">
                  FELLOWSHIP AUDITORIUM VENUE
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 block">
                  NLT 5, Faculty of Law, ESUI
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Edo State University Iyamho &bull; Campus Auditorium
                </span>
              </div>
            </div>

            {/* Direct Enquiry / Direction Assistance */}
            <div className="mt-6 sm:mt-8 pt-6 border-t border-slate-100 max-w-xl mx-auto text-center space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Need any help locating the venue or arranging a ride? Message <span className="font-bold text-slate-900">Ransom</span> on WhatsApp or call our team:
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="https://wa.me/2348100000000?text=Hello%20Ransom%2C%20I%20am%20planning%20to%20visit%20ECCF%20and%20need%20help%20locating%20NLT%205%20Faculty%20of%20Law."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 sm:px-7 py-3.5 text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all"
                >
                  <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.861.947 3.013.947 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.454-.471-4.908-1.292l-5.092 1.354 1.38-5.041c-.911-1.507-1.428-3.266-1.428-5.021 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                  </svg>
                  <span>Message Ransom (+234 810 000 0000)</span>
                </motion.a>

                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="mailto:edsuchristiancampusfellowship@gmail.com?subject=Planning%20a%20Visit%20to%20ECCF"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white text-slate-800 font-bold px-6 py-3.5 text-xs uppercase tracking-wider hover:bg-slate-50 transition-all"
                >
                  <span>Email Fellowship</span>
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
