/**
 * ServiceScheduleConsole — Interactive Animated Weekly Fellowship Schedule
 *
 * Features:
 * - Auto-advances through weekly service tabs every 3 seconds (3000ms) with visual progress countdown
 * - Pauses on hover/interaction for effortless reading and resumes on mouse leave
 * - Expanded max-w-7xl layout aligning with Hero and Who We Are grid boundaries
 * - High-engagement editorial typography, badge highlights, and prominent Gathering Time card
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ArrowRight, Clock, Play, Pause, Sparkles } from 'lucide-react'
import Link from 'next/link'

export interface ServiceItem {
  _id: string
  day: string
  time: string
  title: string
  badge?: string
  description: string
  tags?: string[]
  location?: string
}

interface Props {
  services?: ServiceItem[] | null
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    _id: 'sunday-service',
    day: 'Sunday',
    time: '08:00 AM',
    title: 'Sunday Celebration Service',
    badge: 'Main Worship Encounter',
    description:
      'High-energy student worship, prophetic exhortation, and communal fellowship. Designed to empower university students for spiritual dominance and academic excellence.',
    tags: ['Holy Ghost Worship', 'Prophetic Word', 'Communion', 'Fellowship'],
    location: 'NLT 5, Faculty of Law, ESUI',
  },
  {
    _id: 'word-service',
    day: 'Wednesday',
    time: '04:50 PM',
    title: 'Word Service',
    badge: 'Doctrine & Exegesis',
    description:
      'Verse-by-verse scriptural deep dive designed to ground university students in sound Christian doctrine, faith principles, and kingdom character.',
    tags: ['Bible Exegesis', 'Q&A Discussion', 'Spiritual Growth'],
    location: 'NLT 5, Faculty of Law, ESUI',
  },
  {
    _id: 'academic-challenge',
    day: 'Friday',
    time: '04:50 PM',
    title: 'Academic Challenge / Wonder Service',
    badge: 'Spiritual & Academic Distinction',
    description:
      'Intense intercession, study mastery tutorials, peer academic mentoring, and kingdom empowerment to ensure every ECCF student graduates with academic honours.',
    tags: ['Intercessory Prayer', 'Tutorial Mentorship', 'Excellence'],
    location: 'NLT 5, Faculty of Law, ESUI',
  },
]

export default function ServiceScheduleConsole({ services }: Props) {
  const safeServices = services && services.length > 0 ? services : DEFAULT_SERVICES

  const [activeTab, setActiveTab] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-play interval: 3 seconds per tab
  useEffect(() => {
    if (safeServices.length <= 1 || isPaused) return

    const DURATION = 3000 // 3 seconds
    const TICK = 40 // update every 40ms for 60fps-like progress bar
    let elapsed = 0

    const interval = setInterval(() => {
      elapsed += TICK
      const pct = Math.min((elapsed / DURATION) * 100, 100)
      setProgress(pct)

      if (elapsed >= DURATION) {
        elapsed = 0
        setProgress(0)
        setActiveTab((prev) => (prev + 1) % safeServices.length)
      }
    }, TICK)

    return () => clearInterval(interval)
  }, [activeTab, isPaused, safeServices.length])

  const handleSelectTab = (index: number) => {
    setActiveTab(index)
    setProgress(0)
  }

  const currentService = safeServices[activeTab] || safeServices[0]

  return (
    <section
      id="services"
      className="w-full py-12 sm:py-20 lg:py-24 bg-[#fafaf9] border-b border-stone-200 relative overflow-hidden"
    >
      {/* Background Decorative Blur */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-sky-100/50 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-amber-50/60 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Main Container — Full width matching Hero & Who We Are margins */}
      <div className="w-full px-6 sm:px-10 md:px-14 lg:px-14 xl:px-20 2xl:px-28 relative z-10">
        
        {/* Section Header: Wide & Authoritative */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 sm:mb-12 gap-6 text-left">
          <div className="max-w-3xl">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#0077cc] block mb-2.5 font-mono">
              Weekly Fellowship Schedule
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-slate-950 tracking-tight leading-[1.12] break-words">
              Service Times &amp; Location
            </h2>
            <p className="mt-3.5 text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed font-normal">
              We gather weekly at Edo State University. Every service is uniquely structured to ignite your faith and nurture academic distinction.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden sm:inline-flex items-center gap-2.5 rounded-full bg-white border border-stone-200/90 px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs self-start lg:self-end">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 shrink-0 bg-emerald-500"></span>
            </span>
            <span>3 Weekly Encounters</span>
            <span className="text-stone-300">•</span>
            <span className="text-slate-500">Faculty of Law NLT 5</span>
          </div>
        </div>

        {/* Console Card: Expansive, Generous, Interactive */}
        <div
          ref={containerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="w-full rounded-[26px] sm:rounded-[36px] bg-white border border-stone-200/90 p-4 sm:p-10 lg:p-12 xl:p-14 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
        >
          {/* Top Control Bar: Tabs & Animated Progress */}
          <div className="flex flex-col gap-3 pb-5 border-b border-stone-100 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-6">
            {/* Days Tabs — a segmented control on phones, pill row from sm up */}
            <div
              className="grid w-full grid-cols-3 gap-1 rounded-2xl bg-stone-100 p-1 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3.5 sm:bg-transparent sm:p-0"
              role="tablist"
              aria-label="Weekly service days"
            >
              {safeServices.map((service, index) => {
                const isActive = activeTab === index
                return (
                  <button
                    key={service._id || service.day}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleSelectTab(index)}
                    className={`relative min-w-0 rounded-xl px-2 py-2.5 text-[13px] font-bold transition-all overflow-hidden sm:rounded-full sm:px-8 sm:py-3.5 sm:text-base ${
                      isActive
                        ? 'text-white shadow-lg shadow-slate-950/20'
                        : 'text-slate-600 hover:bg-white/70 hover:text-slate-950 sm:bg-stone-100 sm:hover:bg-stone-200/80'
                    }`}
                  >
                    {/* Animated Pill Background */}
                    {isActive && (
                      <motion.div
                        layoutId="activeSchedulePill"
                        className="absolute inset-0 bg-slate-950 rounded-xl sm:rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}

                    <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                      <span className="truncate">
                        <span className="sm:hidden">{service.day.slice(0, 3)}</span>
                        <span className="hidden sm:inline">{service.day}</span>
                      </span>
                      {isActive && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0095ff]" />
                      )}
                    </span>

                    {/* Progress Countdown Bar (3s cycle) */}
                    {isActive && !isPaused && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 overflow-hidden">
                        <div
                          className="h-full bg-[#0095ff] transition-[width] duration-75 ease-linear"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Play / Pause Cycle Status */}
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-slate-600 hover:text-slate-950 text-xs font-semibold transition-colors"
                title={isPaused ? 'Resume 3-second cycle' : 'Pause auto-cycle'}
              >
                {isPaused ? (
                  <>
                    <Play className="h-3 w-3 shrink-0 text-emerald-600 fill-emerald-600" />
                    <span>Paused</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0077cc] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 shrink-0 bg-[#0077cc]"></span>
                    </span>
                    <span>Auto 3s</span>
                    <Pause className="h-3 w-3 shrink-0 text-slate-400 ml-0.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Service Content Panel */}
          <div className="mt-6 sm:mt-8 lg:mt-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentService._id || currentService.day}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-center"
              >
              {/* Left Column: Comprehensive Service Details (after the time card on phones) */}
                <div className="order-2 lg:order-1 lg:col-span-7 space-y-3.5 sm:space-y-6 text-left flex flex-col items-start">
                  {currentService.badge && (
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-sky-50 px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold text-[#0077cc] uppercase tracking-wider border border-sky-200/60">
                      <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-[#0095ff]" />
                      <span>{currentService.badge}</span>
                    </div>
                  )}

                  <h3 className="font-serif font-bold text-2xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-[1.15] break-words">
                    {currentService.title}
                  </h3>

                  <p className="text-sm sm:text-lg lg:text-xl text-slate-700 leading-relaxed font-normal max-w-2xl text-left mx-0">
                    {currentService.description}
                  </p>

                  {/* Highlights / Tags */}
                  {currentService.tags && currentService.tags.length > 0 && (
                    <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-2.5 pt-0.5 sm:pt-1">
                      {currentService.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg sm:rounded-xl bg-stone-100 hover:bg-stone-200/70 border border-stone-200/60 px-2.5 py-1 text-[11px] sm:px-4 sm:py-1.5 sm:text-xs font-semibold text-slate-700 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Interactive Action Links */}
                  <div className="pt-1 sm:pt-4 w-full flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-6">
                    <Link
                      href="/announcements"
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0077cc] hover:text-sky-800 transition-colors group"
                    >
                      <span>View Campus Bulletins</span>
                      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                    </Link>

                    <Link
                      href="#visit"
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 hover:text-slate-950 transition-colors group"
                    >
                      <span>Plan Your Visit</span>
                      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>

                {/* Right Column: Prominent Gathering Time Badge (first on phones) */}
                <div className="order-1 lg:order-2 lg:col-span-5">
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 sm:p-10 lg:p-12 text-center flex flex-col items-center justify-center space-y-3 sm:space-y-6 shadow-2xl shadow-slate-950/25 border border-slate-800/80 relative overflow-hidden"
                  >
                    {/* Ambient Glow Inside Badge */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />

                    <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2.5 sm:pb-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest text-sky-400 uppercase font-mono">
                        <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                        <span>Gathering Time</span>
                      </span>
                      <span className="text-emerald-400 text-[10px] sm:text-xs font-bold tracking-wide uppercase px-2 py-0.5 sm:px-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        Open to All
                      </span>
                    </div>

                    <div className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white py-0.5 sm:py-1">
                      {currentService.time}
                    </div>

                    <div className="w-full rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 px-3 py-2.5 sm:p-3.5 flex items-center justify-center gap-2 sm:gap-2.5 text-xs sm:text-base font-semibold text-slate-200">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0095ff] shrink-0" />
                      <span className="min-w-0 truncate">{currentService.location || 'NLT 5, Faculty of Law, ESUI'}</span>
                    </div>

                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  )
}