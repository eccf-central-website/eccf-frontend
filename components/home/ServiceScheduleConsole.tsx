/**
 * ServiceScheduleConsole — Interactive Weekly Fellowship Schedule
 *
 * Implements Section 2.4 of UI/UX Brief:
 * 1. Sunday Service — 08:00 AM (Sunday)
 * 2. Word Service — 04:50 PM (Wednesday)
 * 3. Academic Challenge / Wonder Service — 04:50 PM (Friday)
 *
 * Fully dynamic via Sanity CMS with clean, uncluttered presentation.
 * Highlights/tags can be added or removed by admins in Sanity Studio.
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { sanityClient } from '@/lib/sanity'
import { SERVICES_QUERY } from '@/lib/queries'

interface ServiceItem {
  _id: string
  day: string
  time: string
  title: string
  badge?: string
  description: string
  tags?: string[]
  location?: string
}

const defaultServices: ServiceItem[] = [
  {
    _id: 'sunday',
    day: 'Sunday',
    time: '08:00 AM',
    title: 'Sunday Worship Service',
    badge: 'FLAGSHIP WEEKLY GATHERING',
    description: 'An atmosphere of high praise, deep intimate worship, and anointed apostolic preaching. Come expectant for spiritual elevation and miracles.',
    tags: [], // Clean by default — manageable via Sanity CMS
    location: 'NLT 5, Faculty of Law, ESUI',
  },
  {
    _id: 'wednesday',
    day: 'Wednesday',
    time: '04:50 PM',
    title: 'Word Service',
    badge: 'MIDWEEK SCRIPTURAL EXPOSITION',
    description: 'Verse-by-verse scriptural deep dive designed to ground university students in sound Christian doctrine, faith principles, and kingdom character.',
    tags: [], // Clean by default — manageable via Sanity CMS
    location: 'NLT 5, Faculty of Law, ESUI',
  },
  {
    _id: 'friday',
    day: 'Friday',
    time: '04:50 PM',
    title: 'Academic Challenge / Wonder Service',
    badge: 'ACADEMIC EMPOWERMENT & PRAYER',
    description: 'Intense spiritual warfare, academic prayer sessions, and intellectual empowerment to raise academic giants and first-class minds for Christ.',
    tags: [], // Clean by default — manageable via Sanity CMS
    location: 'NLT 5, Faculty of Law, ESUI',
  },
]

export default function ServiceScheduleConsole() {
  const [services, setServices] = useState<ServiceItem[]>(defaultServices)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    sanityClient
      .fetch<ServiceItem[]>(SERVICES_QUERY)
      .then((data) => {
        if (data && data.length > 0) {
          setServices(data)
        }
      })
      .catch((err) => {
        console.warn('Could not fetch Sanity services, using defaults:', err)
      })
  }, [])

  const currentService = services[activeTab] || services[0]

  return (
    <section id="services" className="py-16 sm:py-24 bg-[#fafaf9] relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        
        {/* Clean Centered Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-black tracking-widest text-[#0095ff] uppercase block mb-2 font-mono">
            WEEKLY FELLOWSHIP SCHEDULE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
            Service Times & Location
          </h2>
          <p className="mt-3 text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
            We gather 3 times weekly at Edo State University. Every service is uniquely structured to ignite your faith and nurture academic distinction.
          </p>
        </div>

        {/* Minimalist Day Tabs */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 flex-wrap">
          {services.map((srv, idx) => {
            const isActive = activeTab === idx
            return (
              <button
                key={srv._id || srv.day}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 py-2.5 px-4 sm:px-6 rounded-full font-bold text-xs sm:text-sm transition-all ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-md shadow-slate-950/10'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="uppercase">{srv.day}</span>
                <span className={`text-[10px] sm:text-xs font-medium ${
                  isActive ? 'text-sky-300' : 'text-slate-400'
                }`}>
                  {srv.time}
                </span>
              </button>
            )
          })}
        </div>

        {/* Active Service Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentService._id || currentService.day}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-sm"
          >
            {/* Left Column: Details (7 cols) */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <div>
                {currentService.badge && (
                  <span className="inline-block text-[10px] sm:text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full bg-sky-50 text-[#0095ff]">
                    {currentService.badge}
                  </span>
                )}
                <h3 className="text-xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
                  {currentService.title}
                </h3>
                <p className="mt-2 sm:mt-3 text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
                  {currentService.description}
                </p>
              </div>

              {/* Dynamic Focus Highlights (Rendered only if tags are added in Sanity CMS) */}
              {currentService.tags && currentService.tags.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                  {currentService.tags.map((tag) => (
                    <div key={tag} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                      <span className="h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full bg-[#0095ff] shrink-0" />
                      <span>{tag}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA / Location Bar */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <MapPin className="h-4 w-4 text-[#0095ff] shrink-0" />
                  <span>{currentService.location || 'NLT 5, Faculty of Law, ESUI'}</span>
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

            {/* Right Column: Clean Visual Time Display (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full min-h-[170px] sm:min-h-[190px] relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-sky-500/20 blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-sky-400">
                  SERVICE SCHEDULE
                </span>
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="my-3 sm:my-5">
                <div className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  {currentService.time}
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Every {currentService.day}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 border-t border-slate-800 pt-3">
                <span className="text-sky-300 font-semibold">{currentService.day} Fellowship Gathering</span>
                <span className="text-slate-400">NLT 5</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  )
}
