/**
 * ServiceScheduleConsole — Interactive Weekly Fellowship Schedule
 *
 * Formula 4 Redesign:
 * - Edge-to-edge layout (px-6 sm:px-8 lg:px-12) matching Navbar & Hero
 * - Finer editorial serif typography (Playfair Display) with larger, legible font sizes
 * - Modern, airy schedule console card with clear time and location indicators
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
    <section id="services" className="w-full py-20 lg:py-28 bg-[#fafaf9] border-b border-stone-200 relative overflow-hidden">
      <div className="w-full px-6 sm:px-8 lg:px-12 relative z-10">
        
        {/* Clean Editorial Section Header */}
        <div className="text-left max-w-3xl mb-12 sm:mb-16">
          <span className="text-xs sm:text-sm font-bold tracking-widest text-[#0077cc] uppercase block mb-3 font-mono">
            Weekly Fellowship Schedule
          </span>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] text-slate-950 tracking-tight leading-[1.15]">
            Service Times & Location
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed font-normal max-w-2xl">
            We gather weekly at Edo State University. Every service is uniquely structured to ignite your faith and nurture academic distinction.
          </p>
        </div>

        {/* Console Container: Clean, Modern Editorial Card */}
        <div className="rounded-[28px] bg-white border border-stone-200/80 p-6 sm:p-10 lg:p-12 shadow-sm">
          
          {/* Day Tabs */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 border-b border-stone-100 pb-6 sm:pb-8">
            {safeServices.map((service, index) => {
              const isActive = activeTab === index
              return (
                <button
                  key={service._id || service.day}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  className={`relative rounded-full px-6 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-md'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                  }`}
                >
                  <span>{service.day}</span>
                </button>
              )
            })}
          </div>

          {/* Active Service Content Panel */}
          <div className="mt-8 sm:mt-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentService._id || currentService.day}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
              >
                
                {/* Left: Prominent Service Information */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
                  {currentService.badge && (
                    <div className="inline-flex items-center rounded-full bg-sky-50 px-4 py-1 text-xs font-bold text-[#0077cc] uppercase tracking-wider border border-sky-200/60">
                      <span>{currentService.badge}</span>
                    </div>
                  )}

                  <h3 className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-950 tracking-tight leading-snug">
                    {currentService.title}
                  </h3>

                  <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal max-w-xl">
                    {currentService.description}
                  </p>

                  {/* Highlights / Tags */}
                  {currentService.tags && currentService.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {currentService.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-xl bg-stone-100 px-3.5 py-1 text-xs font-semibold text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-3">
                    <Link
                      href="/announcements"
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0077cc] hover:text-sky-800 transition-colors group"
                    >
                      <span>View Campus Bulletins</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>

                {/* Right: Modern Floating Schedule Badge */}
                <div className="lg:col-span-5">
                  <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-5 shadow-xl shadow-slate-950/15">
                    <span className="text-xs font-bold tracking-widest text-sky-400 uppercase font-mono">
                      Gathering Time
                    </span>

                    <div className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                      {currentService.time}
                    </div>

                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300">
                      <MapPin className="h-4 w-4 text-[#0095ff] shrink-0" />
                      <span>{currentService.location || 'NLT 5, Faculty of Law, ESUI'}</span>
                    </div>

                    <div className="w-full pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>Venue: Law Faculty NLT 5</span>
                      <span className="text-emerald-400 font-bold">Open to All</span>
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