/**
 * PlanAVisitSection — Interactive Experience & VIP Campus Pass
 *
 * Redesigned for Maximum Engagement & Minimal Dense Text:
 * - Interactive Service Selector (Sunday, Wednesday, Friday) with dynamic time & badge updates
 * - Interactive Campus Origin Guide (Hall 1-3, Hall 4-6, Hall 7-8, Off-Campus) with instant walk-time estimates
 * - 1-Click WhatsApp VIP RSVP with dynamically pre-filled greeting message
 * - 1-Click Copy Venue Address with visual feedback
 * - 3 Glanceable Experience Pillars (Come As You Are, VIP Reception, Escort Guides)
 * - Clean, spacious max-w-7xl layout aligning with the rest of the website
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Mail,
  Copy,
  Check,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Navigation,
  Coffee,
  HeartHandshake,
  Compass,
} from 'lucide-react'
import Link from 'next/link'

interface Props {
  contactPerson?: string | null
  whatsAppNumber?: string | null
  email?: string | null
}

interface ServiceOption {
  id: string
  day: string
  time: string
  title: string
  badge: string
}

const SERVICES: ServiceOption[] = [
  {
    id: 'sunday',
    day: 'Sunday',
    time: '08:00 AM',
    title: 'Sunday Celebration',
    badge: 'Main Worship Encounter',
  },
  {
    id: 'wednesday',
    day: 'Wednesday',
    time: '04:50 PM',
    title: 'Word & Doctrine Service',
    badge: 'Scripture Deep-Dive',
  },
  {
    id: 'friday',
    day: 'Friday',
    time: '04:50 PM',
    title: 'Academic & Wonder Service',
    badge: 'Prayer & Study Mastery',
  },
]

interface OriginOption {
  id: string
  label: string
  walkTime: string
  tip: string
}

const ORIGINS: OriginOption[] = [
  {
    id: 'halls-1-3',
    label: 'Hall 1 – 3',
    walkTime: '3–5 mins walk',
    tip: 'Direct pathway past the administrative complex.',
  },
  {
    id: 'halls-4-6',
    label: 'Hall 4 – 6',
    walkTime: '5–7 mins walk',
    tip: 'Law Quadrangle steps; protocol team stationed by the entrance.',
  },
  {
    id: 'halls-7-8',
    label: 'Hall 7 – 8',
    walkTime: '8–10 mins walk',
    tip: 'Walking groups meet at hostel foyers 20 mins before service.',
  },
  {
    id: 'off-campus',
    label: 'Off-Campus',
    walkTime: 'Gate ➔ NLT 5',
    tip: 'Drop off at the Law Faculty roundabout; parking available.',
  },
]

const PERKS = [
  {
    icon: Sparkles,
    title: 'Come As You Are',
    desc: 'No rigid dress codes. Modest, student-friendly.',
  },
  {
    icon: Coffee,
    title: 'VIP First-Timer Care',
    desc: 'Warm reception, snacks, and personal prayer.',
  },
  {
    icon: Compass,
    title: 'Hostel Escorts Ready',
    desc: 'First time locating Law NLT 5? We will walk with you.',
  },
]

export default function PlanAVisitSection({
  contactPerson,
  whatsAppNumber,
  email,
}: Props) {
  const safeContact = contactPerson || 'Ransom'
  const safePhone = whatsAppNumber || '+2348100000000'
  const safeEmail = email || 'edsuchristiancampusfellowship@gmail.com'

  const [selectedService, setSelectedService] = useState<ServiceOption>(SERVICES[0])
  const [selectedOrigin, setSelectedOrigin] = useState<OriginOption>(ORIGINS[0])
  const [copied, setCopied] = useState(false)

  // Strip non-digit characters for WhatsApp
  const cleanPhone = String(safePhone).replace(/[^0-9]/g, '')
  const venueAddress = 'NLT 5, Faculty of Law, Edo State University Iyamho'

  const waMessage = encodeURIComponent(
    `Hello ${safeContact}! I am planning my visit to ECCF for the ${selectedService.title} (${selectedService.day} @ ${selectedService.time}) coming from ${selectedOrigin.label}. Please save me a seat!`
  )
  const waUrl = `https://wa.me/${cleanPhone}?text=${waMessage}`

  const handleCopyVenue = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(venueAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <section
      id="visit"
      className="py-16 sm:py-24 lg:py-28 bg-[#fafaf9] border-t border-stone-200/90 scroll-mt-16 sm:scroll-mt-20 relative overflow-hidden"
    >
      {/* Ambient Radial Highlights */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-sky-100/60 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-50/60 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 relative z-10 w-full">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#0077cc] block mb-2.5 font-mono">
            JOIN OUR CAMPUS FAMILY
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-slate-950 tracking-tight leading-[1.12]">
            We Saved You a Seat.
          </h2>
          <p className="mt-3.5 text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed font-normal">
            No confusion, no awkwardness. Choose your service, tell us where you&apos;re coming from, and let our team welcome you like royalty.
          </p>
        </div>

        {/* Massive Interactive Visit Console */}
        <div className="w-full rounded-[32px] sm:rounded-[40px] bg-white border border-stone-200/90 p-6 sm:p-10 lg:p-14 shadow-sm hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            
            {/* Left Column: Interactive Preferences (Low text, high clickability) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
              
              {/* Step 1: Choose Your Service */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    1. When are you joining us?
                  </span>
                  <span className="text-xs font-semibold text-[#0077cc] flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Select Service</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SERVICES.map((s) => {
                    const isSelected = selectedService.id === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedService(s)}
                        className={`relative rounded-2xl p-4 text-left transition-all border ${
                          isSelected
                            ? 'bg-slate-950 text-white border-slate-950 shadow-md shadow-slate-950/15'
                            : 'bg-stone-50 hover:bg-stone-100 text-slate-800 border-stone-200/80'
                        }`}
                      >
                        <span
                          className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                            isSelected ? 'text-sky-400' : 'text-[#0077cc]'
                          }`}
                        >
                          {s.day}
                        </span>
                        <span className="font-serif text-lg font-bold block leading-tight">
                          {s.time}
                        </span>
                        <span
                          className={`text-xs block mt-1 line-clamp-1 ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {s.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 2: Where are you coming from? */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    2. Where are you coming from on campus?
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <Navigation className="h-3.5 w-3.5" />
                    <span>{selectedOrigin.walkTime}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ORIGINS.map((o) => {
                    const isSelected = selectedOrigin.id === o.id
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setSelectedOrigin(o)}
                        className={`rounded-xl px-3 py-2.5 text-center text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#0077cc] text-white border-[#0077cc] shadow-sm'
                            : 'bg-stone-50 hover:bg-stone-100 text-slate-700 border-stone-200/70'
                        }`}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>

                {/* Dynamic Campus Path Tip */}
                <div className="mt-3 rounded-xl bg-sky-50/80 border border-sky-100 px-3.5 py-2 text-xs text-slate-700 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#0077cc] shrink-0" />
                  <span>
                    <strong>From {selectedOrigin.label}:</strong> {selectedOrigin.tip}
                  </span>
                </div>
              </div>

              {/* Step 3: Quick Perks (Glanceable, no fluff) */}
              <div className="pt-2 border-t border-stone-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PERKS.map((p) => {
                    const Icon = p.icon
                    return (
                      <div
                        key={p.title}
                        className="rounded-xl bg-stone-50/80 border border-stone-100 p-3 text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-[#0077cc] shrink-0" />
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {p.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {p.desc}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* Right Column: High-Impact VIP Pass & 1-Tap Connect */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div className="h-full rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-7 sm:p-9 flex flex-col justify-between shadow-xl shadow-slate-950/20 border border-slate-800 relative overflow-hidden">
                {/* Ambient Decorative Light */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-44 h-44 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />

                {/* Top Ticket Header */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-sky-400 font-mono">
                        VIP Campus Pass
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      Reserved For You
                    </span>
                  </div>

                  {/* Dynamic Ticket Preview */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedService.id + selectedOrigin.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-mono block">
                          Service Encounter
                        </span>
                        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-0.5">
                          {selectedService.title}
                        </h3>
                        <div className="inline-flex items-center gap-2 mt-1.5 text-xs text-sky-300 font-semibold">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {selectedService.day}s at {selectedService.time}
                          </span>
                        </div>
                      </div>

                      {/* Location Box */}
                      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#0095ff]" />
                            <span>Meeting Venue</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyVenue}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                          >
                            {copied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy Address</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="font-serif font-bold text-base sm:text-lg text-white">
                          NLT 5, Faculty of Law, ESUI
                        </p>
                        <p className="text-xs text-slate-300">
                          Law Faculty Lecture Theatre 5 &bull; Ground Floor
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bottom Action Area */}
                <div className="pt-6 mt-6 border-t border-slate-800 space-y-3">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                  >
                    <svg className="h-4 w-4 fill-slate-950 shrink-0" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.861.947 3.013.947 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.454-.471-4.908-1.292l-5.092 1.354 1.38-5.041c-.911-1.507-1.428-3.266-1.428-5.021 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                    </svg>
                    <span>Reserve My Seat via WhatsApp</span>
                  </a>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <Link
                      href="/connect"
                      className="inline-flex items-center gap-1.5 hover:text-white transition-colors group"
                    >
                      <HeartHandshake className="h-3.5 w-3.5 text-sky-400" />
                      <span>Prefer a form? Fill Connect Card</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>

                    <a
                      href={`mailto:${safeEmail}?subject=Visiting%20ECCF`}
                      className="inline-flex items-center gap-1 hover:text-white transition-colors"
                      title={safeEmail}
                    >
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>Email</span>
                    </a>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}