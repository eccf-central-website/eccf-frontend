/**
 * PlanAVisitSection — Let Us Know When You're Coming
 *
 * Grounded & Student-Friendly Visit Experience:
 * - Direct, honest copy: "Let us know when you're coming."
 * - No fake VIP cards or campus pass gimmicks.
 * - Un-numbered questions: Service selection, Calendar date picker, Hostel origin.
 * - Integrated Service Date Picker: automatically calculates upcoming service dates for Sunday, Wednesday, or Friday.
 * - Clear, practical campus walking directions to NLT 5 (Faculty of Law).
 * - 1-Click WhatsApp Direct Connect with prefilled message to assist with directions.
 * - Strict adherence to the 3-font system: Belleza (headings), Work Sans (body), Geist Mono (styling).
 */

'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Mail,
  Copy,
  Check,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ArrowRight,
  Navigation,
  Compass,
  Smile,
} from 'lucide-react'
import Link from 'next/link'

interface Props {
  contactPerson?: string | null
  whatsAppNumber?: string | null
  email?: string | null
}

interface ServiceOption {
  id: string
  day: 'Sunday' | 'Wednesday' | 'Friday'
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
    badge: 'Prayer & Academic Mastery',
  },
]

interface OriginOption {
  id: string
  label: string
  walkTime: string
  directions: string
}

const ORIGINS: OriginOption[] = [
  {
    id: 'halls-1-3',
    label: 'Hall 1 – 3',
    walkTime: '3–5 mins walk',
    directions: 'Take the direct pathway past the Administrative complex towards the Law Faculty quadrangle. NLT 5 is on the ground floor.',
  },
  {
    id: 'halls-4-6',
    label: 'Hall 4 – 6',
    walkTime: '5–7 mins walk',
    directions: 'Follow the central academic walkway straight towards the Law Faculty. Enter the main foyer; NLT 5 is on the ground floor to your left.',
  },
  {
    id: 'halls-7-8',
    label: 'Hall 7 – 8',
    walkTime: '8–10 mins walk',
    directions: 'Take the main campus route towards the Law Faculty quadrangle. Look out for our welcome banner at NLT 5 entrance.',
  },
  {
    id: 'off-campus',
    label: 'Off-Campus',
    walkTime: 'Gate ➔ Law Faculty',
    directions: 'Enter via Main Campus Gate to the Law Faculty roundabout. Walk into the ground floor foyer of the Law Faculty building to find NLT 5.',
  },
]

const PERKS = [
  {
    icon: Sparkles,
    title: 'Come As You Are',
    desc: 'No rigid dress codes. Modest, comfortable, and student-friendly.',
  },
  {
    icon: Smile,
    title: 'Warm Welcome',
    desc: 'Friendly student community, uplifting worship, and sincere prayer.',
  },
  {
    icon: Compass,
    title: 'Need Directions?',
    desc: 'First time locating Law NLT 5? Connect on WhatsApp and we will guide you.',
  },
]

// Helper to compute next 4 upcoming dates for a specific day of the week
function getUpcomingDates(dayName: 'Sunday' | 'Wednesday' | 'Friday', count = 4) {
  const dayMap = { Sunday: 0, Wednesday: 3, Friday: 5 }
  const targetDay = dayMap[dayName]
  const dates: { id: string; label: string; full: string; dayNum: number; month: string; weekday: string }[] = []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find next occurrence
  const current = new Date(today)
  const diff = (targetDay - current.getDay() + 7) % 7
  current.setDate(current.getDate() + diff)

  for (let i = 0; i < count; i++) {
    const d = new Date(current)
    d.setDate(current.getDate() + i * 7)

    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
    const month = d.toLocaleDateString('en-US', { month: 'short' })
    const dayNum = d.getDate()
    const year = d.getFullYear()

    dates.push({
      id: d.toISOString().split('T')[0],
      label: `${weekday}, ${month} ${dayNum}`,
      full: `${weekday}, ${month} ${dayNum}, ${year}`,
      dayNum,
      month,
      weekday,
    })
  }

  return dates
}

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

  // Dynamically compute upcoming dates for the selected service
  const upcomingDates = useMemo(
    () => getUpcomingDates(selectedService.day, 4),
    [selectedService.day]
  )

  const [selectedDate, setSelectedDate] = useState<string>(upcomingDates[0]?.full || '')

  // Reset selected date whenever service changes if current date doesn't match
  const activeDate = useMemo(() => {
    const exists = upcomingDates.find((d) => d.full === selectedDate)
    return exists ? selectedDate : upcomingDates[0]?.full || ''
  }, [selectedDate, upcomingDates])

  // Strip non-digit characters for WhatsApp
  const cleanPhone = String(safePhone).replace(/[^0-9]/g, '')
  const venueAddress = 'NLT 5, Faculty of Law, Edo State University Iyamho'

  const waMessage = encodeURIComponent(
    `Hello ${safeContact}! I am planning to come for ${selectedService.title} on ${activeDate} from ${selectedOrigin.label}. Could you please guide me on how to locate NLT 5?`
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
      className="py-16 sm:py-20 lg:py-24 bg-[#fafaf9] border-t border-stone-200/90 scroll-mt-16 sm:scroll-mt-20 relative overflow-hidden"
    >
      {/* Ambient Radial Highlights */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-sky-100/50 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 relative z-10 w-full">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#0077cc] block mb-2 font-mono">
            JOIN OUR CAMPUS FAMILY
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-slate-950 tracking-tight leading-[1.12]">
            We Saved You a Seat.
          </h2>
          <p className="mt-2 text-base sm:text-lg text-slate-600 font-normal">
            Let us know when you&apos;re coming.
          </p>
        </div>

        {/* Clean Interactive Visit Console */}
        <div className="w-full rounded-3xl sm:rounded-[36px] bg-white border border-stone-200/90 p-5 sm:p-8 lg:p-12 shadow-sm hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            
            {/* Left Column: Interactive Preference Choices */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-7">
              
              {/* Question 1: Service Selection */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                    When are you joining us?
                  </span>
                  <span className="text-xs font-semibold text-[#0077cc] flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Select Service</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {SERVICES.map((s) => {
                    const isSelected = selectedService.id === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedService(s)
                          const nextDates = getUpcomingDates(s.day, 4)
                          if (nextDates[0]) setSelectedDate(nextDates[0].full)
                        }}
                        className={`relative rounded-2xl p-3.5 text-left transition-all border ${
                          isSelected
                            ? 'bg-slate-950 text-white border-slate-950 shadow-sm shadow-slate-950/15'
                            : 'bg-stone-50 hover:bg-stone-100 text-slate-800 border-stone-200/80'
                        }`}
                      >
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider block mb-1 font-mono ${
                            isSelected ? 'text-sky-400' : 'text-[#0077cc]'
                          }`}
                        >
                          {s.day}
                        </span>
                        <span className="font-heading text-lg font-bold block leading-tight">
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

              {/* Question 2: Calendar Date Selection */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                    Select a date
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 font-mono">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>Upcoming {selectedService.day}s</span>
                  </span>
                </div>

                {/* Date Pills — Clean, glanceable calendar choices */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {upcomingDates.map((dateObj) => {
                    const isSelected = activeDate === dateObj.full
                    return (
                      <button
                        key={dateObj.id}
                        type="button"
                        onClick={() => setSelectedDate(dateObj.full)}
                        className={`rounded-xl p-2.5 text-center transition-all border flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#0077cc] text-white border-[#0077cc] shadow-sm'
                            : 'bg-stone-50 hover:bg-stone-100 text-slate-800 border-stone-200/80'
                        }`}
                      >
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider font-mono ${
                            isSelected ? 'text-sky-200' : 'text-slate-500'
                          }`}
                        >
                          {dateObj.month}
                        </span>
                        <span className="text-lg font-bold leading-none my-1 font-sans">
                          {dateObj.dayNum}
                        </span>
                        <span
                          className={`text-[11px] font-medium leading-none ${
                            isSelected ? 'text-white' : 'text-slate-600'
                          }`}
                        >
                          {dateObj.weekday}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Question 3: Hostel of Origin Selection */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                    Where are you coming from on campus?
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 font-mono">
                    <Navigation className="h-3.5 w-3.5" />
                    <span>{selectedOrigin.walkTime}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                            : 'bg-stone-50 hover:bg-stone-100 text-slate-700 border-stone-200/80'
                        }`}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>

                {/* Practical Campus Walking Guide */}
                <div className="mt-3 rounded-xl bg-sky-50/80 border border-sky-100 px-3.5 py-2.5 text-xs text-slate-700 flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-[#0077cc] shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="text-slate-900 font-bold block mb-0.5">
                      Directions from {selectedOrigin.label} ({selectedOrigin.walkTime}):
                    </strong>
                    <span>{selectedOrigin.directions}</span>
                  </div>
                </div>
              </div>

              {/* Friendly Student Expectations */}
              <div className="pt-2 border-t border-stone-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {PERKS.map((p) => {
                    const Icon = p.icon
                    return (
                      <div
                        key={p.title}
                        className="rounded-xl bg-stone-50/70 border border-stone-100 p-2.5 text-left"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="h-3.5 w-3.5 text-[#0077cc] shrink-0" />
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

            {/* Right Column: Location Summary & Direct WhatsApp Connect */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div className="h-full rounded-2xl sm:rounded-3xl bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-slate-950/15 border border-slate-800 relative overflow-hidden">
                {/* Subtle Ambient Light */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-40 h-40 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />

                {/* Card Top: Location Details */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-sky-400 font-mono">
                      Meeting Location
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      Faculty of Law
                    </span>
                  </div>

                  {/* Dynamic Summary Preview */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedService.id + selectedOrigin.id + activeDate}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-mono block">
                          Service & Date
                        </span>
                        <h3 className="font-heading text-2xl sm:text-3xl font-bold text-white mt-0.5">
                          {selectedService.title}
                        </h3>
                        <div className="inline-flex items-center gap-2 mt-1 text-xs text-sky-300 font-semibold font-mono">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          <span>{activeDate}</span>
                          <span>&bull;</span>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{selectedService.time}</span>
                        </div>
                      </div>

                      {/* Location Box */}
                      <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-sky-400" />
                            <span>Venue</span>
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
                        <p className="font-heading font-bold text-base sm:text-lg text-white">
                          NLT 5, Faculty of Law, ESUI
                        </p>
                        <p className="text-xs text-slate-300">
                          Law Lecture Theatre 5 &bull; Ground Floor
                        </p>
                      </div>

                      {/* Hostel Origin Pill */}
                      <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-slate-300 flex items-center justify-between">
                        <span>Coming from:</span>
                        <strong className="text-white font-mono">{selectedOrigin.label}</strong>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bottom WhatsApp Connect Action */}
                <div className="pt-5 mt-5 border-t border-slate-800 space-y-3">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3.5 text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                  >
                    <svg className="h-4 w-4 fill-slate-950 shrink-0" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.861.947 3.013.947 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.454-.471-4.908-1.292l-5.092 1.354 1.38-5.041c-.911-1.507-1.428-3.266-1.428-5.021 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                    </svg>
                    <span>Connect on WhatsApp for Directions</span>
                  </a>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <Link
                      href="/connect"
                      className="inline-flex items-center gap-1.5 hover:text-white transition-colors group"
                    >
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