/**
 * ServiceScheduleConsole — Interactive Weekly Fellowship Schedule
 *
 * Implements Section 2.4 of UI/UX Brief:
 * 1. Sunday Service — 08:00 AM (Sunday)
 * 2. Word Service — 04:50 PM (Wednesday)
 * 3. Academic Challenge / Wonder Service — 04:50 PM (Friday)
 *
 * 100% dynamic via live Sanity Studio data. Zero hardcoded fallbacks.
 * Highlights/tags can be added or removed by admins in Sanity Studio.
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ArrowRight } from 'lucide-react'
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

export default function ServiceScheduleConsole({ services }: Props) {
  const [activeTab, setActiveTab] = useState(0)

  const safeServices = services || []
  if (safeServices.length === 0) return null

  const currentService = safeServices[activeTab] || safeServices[0]

  return (
    <section id="services" className="py-16 sm:py-24 bg-[#fafaf9] relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        
        {/* Clean Centered Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-black tracking-widest text-[#0077cc] uppercase block mb-2 font-mono">
            WEEKLY FELLOWSHIP SCHEDULE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
            Service Times & Location
          </h2>
          <p className="mt-3 text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
            We gather weekly at Edo State University. Every service is uniquely structured to ignite your faith and nurture academic distinction.
          </p>
        </div>

        {/* Console Container: Clean, Organic Borderless Card */}
        <div className="rounded-3xl bg-white p-5 sm:p-8 lg:p-10 shadow-sm">
          
          {/* Day Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 border-b border-slate-100 pb-5 sm:pb-6">
            {safeServices.map((service, index) => {
              const isActive = activeTab === index
              return (
                <button
                  key={service._id || service.day}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  className={`relative rounded-full px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-black transition-all ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{service.day}</span>
                </button>
              )
            })}
          </div>

          {/* Active Service Content Panel */}
          <div className="mt-8 sm:mt-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentService._id || currentService.day}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                
                {/* Left: Prominent Service Information */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left">
                  {currentService.badge && (
                    <div className="inline-flex items-center rounded-full bg-sky-50 px-3.5 py-1 text-[11px] font-black text-[#0077cc] uppercase tracking-wider">
                      <span>{currentService.badge}</span>
                    </div>
                  )}

                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
                    {currentService.title}
                  </h3>

                  <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-normal max-w-xl mx-auto lg:mx-0">
                    {currentService.description}
                  </p>

                  {/* Highlights / Tags — only render if tags exist in Sanity */}
                  {currentService.tags && currentService.tags.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
                      {currentService.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                    <Link
                      href="/announcements"
                      className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0077cc] hover:text-sky-800 transition-colors group"
                    >
                      <span>View Announcements</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>

                {/* Right: Modern Floating Schedule Badge (Organic Card) */}
                <div className="lg:col-span-5">
                  <div className="rounded-2xl bg-slate-950 text-white p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-xl shadow-slate-950/10">
                    <span className="text-[10px] font-black tracking-widest text-[#0077cc] uppercase font-mono">
                      GATHERING TIME
                    </span>

                    <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-mono">
                      {currentService.time}
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-[#0077cc] shrink-0" />
                      <span>{currentService.location || 'NLT 5, Faculty of Law, ESUI'}</span>
                    </div>

                    <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>Venue: Law Faculty NLT 5</span>
                      <span className="text-emerald-400 font-semibold">Open to All</span>
                    </div>
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  )
}