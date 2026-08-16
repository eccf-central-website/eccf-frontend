/**
 * ServiceScheduleConsole — Interactive Weekly Fellowship Schedule
 *
 * Implements Section 2.4 of UI/UX Brief:
 * 1. Sunday Service — 08:00 AM (Sunday)
 * 2. Word Service — 04:50 PM (Wednesday)
 * 3. Academic Challenge / Wonder Service — 04:50 PM (Friday)
 *
 * Location: NLT 5, Faculty of Law, ESUI
 * Optimized for seamless mobile & desktop responsiveness.
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, MapPin, Sparkles, BookOpen, Heart, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const services = [
  {
    id: 'sunday',
    day: 'Sunday',
    time: '08:00 AM',
    title: 'Sunday Worship Service',
    badge: 'FLAGSHIP WEEKLY GATHERING',
    description: 'An atmosphere of high praise, deep intimate worship, and anointed apostolic preaching. Come expectant for spiritual elevation and miracles.',
    focusPoints: ['Congregational Praise & Worship', 'Prophetic Ministration', 'Kingdom Communion', 'Freshers & Visitors Welcome'],
    icon: Sparkles,
    color: 'from-sky-500 to-blue-600',
    tagBg: 'bg-sky-50 text-sky-600 border-sky-200',
  },
  {
    id: 'wednesday',
    day: 'Wednesday',
    time: '04:50 PM',
    title: 'Word Service',
    badge: 'MIDWEEK SCRIPTURAL EXPOSITION',
    description: 'Verse-by-verse scriptural deep dive designed to ground university students in sound Christian doctrine, faith principles, and kingdom character.',
    focusPoints: ['Systematic Bible Teaching', 'Interactive Q&A Session', 'Doctrinal Clarity', 'Personal Spiritual Growth'],
    icon: BookOpen,
    color: 'from-blue-600 to-indigo-600',
    tagBg: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  {
    id: 'friday',
    day: 'Friday',
    time: '04:50 PM',
    title: 'Academic Challenge / Wonder Service',
    badge: 'ACADEMIC EMPOWERMENT & PRAYER',
    description: 'Intense spiritual warfare, academic prayer sessions, and intellectual empowerment to raise academic giants and first-class minds for Christ.',
    focusPoints: ['Academic Breakthrough Prayers', 'Overcoming Exam Anxiety', 'Spiritual Empowerment', 'Testimonies of Excellence'],
    icon: Heart,
    color: 'from-indigo-600 to-sky-600',
    tagBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  },
]

export default function ServiceScheduleConsole() {
  const [activeTab, setActiveTab] = useState(0)
  const currentService = services[activeTab]

  return (
    <section className="py-16 sm:py-24 bg-white border-t border-slate-200/60 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 -right-40 -translate-y-1/2 w-96 h-96 rounded-full bg-sky-100/60 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-[#0095ff] uppercase mb-2">
              <span className="h-1.5 w-6 rounded-full bg-[#0095ff]" />
              <span>FELLOWSHIP SCHEDULE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Weekly Service Times & Location
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            We gather 3 times weekly at Edo State University. Every service is uniquely structured to nurture your spiritual life and academic journey.
          </p>
        </div>

        {/* Interactive Schedule Console */}
        <div className="rounded-3xl border border-slate-200/90 bg-[#fafafa] p-3 sm:p-8 shadow-sm">
          {/* Day Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 bg-slate-200/60 rounded-2xl mb-6 sm:mb-8">
            {services.map((srv, idx) => {
              const isActive = activeTab === idx
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-md shadow-slate-900/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className="font-extrabold uppercase text-[11px] sm:text-sm">{srv.day}</span>
                  <span className={`text-[9px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-sky-50 text-[#0095ff] font-bold' : 'text-slate-500'
                  }`}>
                    {srv.time}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Active Service Showcase Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentService.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center bg-white rounded-2xl p-5 sm:p-10 border border-slate-200/80 shadow-sm"
            >
              {/* Left Column: Details (7 cols) */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <div>
                  <span className={`inline-block text-[10px] sm:text-[11px] font-black tracking-wider uppercase px-2.5 sm:px-3 py-1 rounded-full border ${currentService.tagBg}`}>
                    {currentService.badge}
                  </span>
                  <h3 className="text-xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
                    {currentService.title}
                  </h3>
                  <p className="mt-2 sm:mt-3 text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
                    {currentService.description}
                  </p>
                </div>

                {/* Focus Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                  {currentService.focusPoints.map((point) => (
                    <div key={point} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                      <span className="h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full bg-[#0095ff] shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>

                {/* CTA / Location Bar */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <MapPin className="h-4 w-4 text-[#0095ff] shrink-0" />
                    <span>NLT 5, Faculty of Law, ESUI</span>
                  </div>

                  <Link
                    href="#visit"
                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#0095ff] hover:text-sky-700 transition-colors"
                  >
                    <span>Plan a Visit this {currentService.day}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Time Display (5 cols) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between h-full min-h-[200px] sm:min-h-[220px] relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-sky-500/20 blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-sky-400">
                    SERVICE SCHEDULE
                  </span>
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="my-4 sm:my-6">
                  <div className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                    {currentService.time}
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                    Every {currentService.day}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 border-t border-slate-800 pt-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-sky-400" />
                    <span>Duration: ~90 Mins</span>
                  </div>
                  <span className="text-sky-300 font-semibold">Free Transport</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
