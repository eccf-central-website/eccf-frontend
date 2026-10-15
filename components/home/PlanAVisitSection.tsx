/**
 * PlanAVisitSection — Step-by-Step Interactive Campus Visit Flow
 *
 * Designed in the spirit of Nucleus (fbno.org/next-steps):
 * - One question at a time with large, comfortable, touch-friendly fields.
 * - Zero information overload or busy dashboards.
 * - Pulls live weekly service records dynamically from Sanity Studio (`services` prop).
 * - Simple 5-step student flow:
 *     Step 0: First Name & Last Name (in separate fields)
 *     Step 1: Which service are you joining? (Dynamic from Sanity, no tiny descriptions)
 *     Step 2: When do you plan to visit? (Dynamic upcoming calendar dates for selected service day)
 *     Step 3: Where are you coming from on campus? (Hall 2, 5, 6; Hall 1; Hall 3, 4; Hall 7, 8; Off-Campus)
 *     Step 4: Meeting details, walking directions to Law NLT 5 & 1-Click WhatsApp Direct Connect.
 * - Breadcrumb answer pills stack on top for easy navigation back to earlier questions.
 * - Strictly follows the 3-font system: Belleza (headings), Work Sans (body), Geist Mono (styling).
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
  ArrowRight,
  ArrowLeft,
  Navigation,
  RotateCcw,
  User,
} from 'lucide-react'
import Link from 'next/link'

export interface ServiceItem {
  _id: string
  day: string
  time: string
  title: string
  badge?: string
  description?: string
  location?: string
}

interface Props {
  services?: ServiceItem[] | null
  contactPerson?: string | null
  whatsAppNumber?: string | null
  email?: string | null
}

const FALLBACK_SERVICES: ServiceItem[] = [
  {
    _id: 'sunday',
    day: 'Sunday',
    time: '08:00 AM',
    title: 'Sunday Celebration',
  },
  {
    _id: 'wednesday',
    day: 'Wednesday',
    time: '04:50 PM',
    title: 'Word & Doctrine Service',
  },
  {
    _id: 'friday',
    day: 'Friday',
    time: '04:50 PM',
    title: 'Academic & Wonder Service',
  },
]

interface OriginOption {
  id: string
  label: string
  walkTime: string
  directions: string
}

// Grouped based on university campus geography
const ORIGINS: OriginOption[] = [
  {
    id: 'halls-2-5-6',
    label: 'Hall 2, Hall 5, Hall 6',
    walkTime: '5–7 mins walk',
    directions: 'Take the pathway from the Hall 2, 5 & 6 hostel cluster straight towards the Faculty of Law quadrangle. NLT 5 is on the ground floor.',
  },
  {
    id: 'hall-1',
    label: 'Hall 1',
    walkTime: '4–6 mins walk',
    directions: 'Take the direct walkway past the administrative complex straight towards the Law Faculty quadrangle. NLT 5 is on the ground floor.',
  },
  {
    id: 'halls-3-4',
    label: 'Hall 3, Hall 4',
    walkTime: '3–5 mins walk',
    directions: 'Walk through the central academic walkway directly towards the Faculty of Law. Enter the main foyer; NLT 5 is on the ground floor.',
  },
  {
    id: 'halls-7-8',
    label: 'Hall 7, Hall 8',
    walkTime: '8–10 mins walk',
    directions: 'Follow the main campus road from the Hall 7 & 8 area down towards the Law Faculty quadrangle. Look out for our welcome banner at NLT 5.',
  },
  {
    id: 'off-campus',
    label: 'Off-Campus',
    walkTime: 'Main Gate ➔ Law Faculty',
    directions: 'Enter via the Main Campus Gate towards the Law Faculty roundabout. Walk into the ground floor foyer of the Law Faculty to find NLT 5.',
  },
]

// Dynamically compute upcoming dates for any service day name
function getUpcomingDates(dayName: string, count = 4) {
  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  }

  // Case-insensitive match or default to Sunday
  const normalizedDay =
    Object.keys(dayMap).find(
      (k) => k.toLowerCase() === (dayName || '').toLowerCase().trim()
    ) || 'Sunday'

  const targetDay = dayMap[normalizedDay] ?? 0
  const dates: { id: string; label: string; full: string; dayNum: number; month: string; weekday: string }[] = []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

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
  services,
  contactPerson,
  whatsAppNumber,
  email,
}: Props) {
  const safeContact = contactPerson || 'ECCF Team'
  const safePhone = whatsAppNumber || '+2348100000000'
  const safeEmail = email || 'edsuchristiancampusfellowship@gmail.com'

  // Live Sanity services with graceful fallback
  const liveServices = useMemo(() => {
    if (services && services.length > 0) return services
    return FALLBACK_SERVICES
  }, [services])

  // Step state: 0 = Name, 1 = Service, 2 = Date, 3 = Hostel, 4 = Summary & WhatsApp
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [selectedService, setSelectedService] = useState<ServiceItem>(liveServices[0])
  const [selectedOrigin, setSelectedOrigin] = useState<OriginOption>(ORIGINS[0])
  const [copied, setCopied] = useState(false)

  // Compute upcoming calendar dates for active service
  const upcomingDates = useMemo(
    () => getUpcomingDates(selectedService?.day || 'Sunday', 4),
    [selectedService?.day]
  )

  const [selectedDate, setSelectedDate] = useState<string>(upcomingDates[0]?.full || '')

  const activeDate = useMemo(() => {
    const exists = upcomingDates.find((d) => d.full === selectedDate)
    return exists ? selectedDate : upcomingDates[0]?.full || ''
  }, [selectedDate, upcomingDates])

  const cleanPhone = String(safePhone).replace(/[^0-9]/g, '')
  const venueAddress = 'NLT 5, Faculty of Law, ESUI'

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

  const waMessage = encodeURIComponent(
    `Hello ${safeContact}! ${fullName ? `My name is ${fullName}. ` : ''}I am planning to come for ${selectedService.title} on ${activeDate} from ${selectedOrigin.label}. Could you please guide me on how to locate NLT 5?`
  )
  const waUrl = `https://wa.me/${cleanPhone}?text=${waMessage}`

  const handleCopyVenue = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(venueAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleNameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (firstName.trim()) {
      setCurrentStep(1)
    }
  }

  const handleServiceSelect = (service: ServiceItem) => {
    setSelectedService(service)
    const nextDates = getUpcomingDates(service.day, 4)
    if (nextDates[0]) setSelectedDate(nextDates[0].full)
    setCurrentStep(2)
  }

  const handleDateSelect = (fullDate: string) => {
    setSelectedDate(fullDate)
    setCurrentStep(3)
  }

  const handleOriginSelect = (origin: OriginOption) => {
    setSelectedOrigin(origin)
    setCurrentStep(4)
  }

  const progressPercent = ((currentStep + 1) / 5) * 100

  return (
    <section
      id="visit"
      className="py-16 sm:py-20 lg:py-24 bg-[#fafaf9] border-t border-stone-200/90 scroll-mt-16 sm:scroll-mt-20 relative overflow-hidden"
    >
      {/* Soft Ambient Radiance */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-100/60 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-50/60 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#0077cc] block mb-2 font-mono">
            PLAN YOUR VISIT
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-[1.12]">
            We Saved You a Seat.
          </h2>
          <p className="mt-2 text-base sm:text-lg text-slate-600 font-normal">
            Let us know when you&apos;re coming.
          </p>
        </div>

        {/* ================================================================== */}
        {/* Step-by-Step Card Console (Single Focused Card, No Clutter)        */}
        {/* ================================================================== */}
        <div className="max-w-2xl mx-auto">
          
          {/* Breadcrumb Answer Pills (Nucleus Style) */}
          {currentStep > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3 px-1 animate-in fade-in duration-200">
              {fullName && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-xs text-slate-700 hover:border-[#0077cc] hover:text-[#0077cc] transition-colors shadow-2xs font-mono"
                  title="Change Name"
                >
                  <span className="text-slate-400">Name:</span>
                  <strong>{fullName}</strong>
                </button>
              )}
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-xs text-slate-700 hover:border-[#0077cc] hover:text-[#0077cc] transition-colors shadow-2xs font-mono"
                  title="Change Service"
                >
                  <span className="text-slate-400">Service:</span>
                  <strong>{selectedService.title}</strong>
                </button>
              )}
              {currentStep > 2 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-xs text-slate-700 hover:border-[#0077cc] hover:text-[#0077cc] transition-colors shadow-2xs font-mono"
                  title="Change Date"
                >
                  <span className="text-slate-400">Date:</span>
                  <strong>{activeDate}</strong>
                </button>
              )}
              {currentStep > 3 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-xs text-slate-700 hover:border-[#0077cc] hover:text-[#0077cc] transition-colors shadow-2xs font-mono"
                  title="Change Hostel"
                >
                  <span className="text-slate-400">From:</span>
                  <strong>{selectedOrigin.label}</strong>
                </button>
              )}
            </div>
          )}

          {/* Main Focused Step Card */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-stone-200/50 p-6 sm:p-10 relative overflow-hidden transition-all">
            
            {/* Top Navigation Row inside Card */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors p-1 -ml-1 rounded-md"
                    aria-label="Previous step"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                )}
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Step {currentStep + 1} of 5
                </span>
              </div>

              {currentStep === 4 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#0077cc] transition-colors font-mono"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Start Over</span>
                </button>
              )}
            </div>

            {/* Stepped Form Content with Smooth Framer Motion Transitions */}
            <AnimatePresence mode="wait">
              
              {/* ============================================================ */}
              {/* STEP 0: What's your name? (First & Last Name Separate)       */}
              {/* ============================================================ */}
              {currentStep === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0077cc] block mb-1">
                      First, What&apos;s Your Name?
                    </span>
                    <h3 className="font-heading text-2xl sm:text-3xl font-bold text-slate-950 leading-tight">
                      Let us know who to expect!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
                      Share your name so our welcome team can greet you warmly when you arrive.
                    </p>
                  </div>

                  <form onSubmit={handleNameSubmit} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label
                          htmlFor="visit-firstName"
                          className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                        >
                          First Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="visit-firstName"
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Michael"
                          className="w-full px-4 py-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0077cc] text-base transition-all font-sans"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="visit-lastName"
                          className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                        >
                          Last Name
                        </label>
                        <input
                          id="visit-lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Akan"
                          className="w-full px-4 py-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0077cc] text-base transition-all font-sans"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!firstName.trim()}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0077cc] hover:bg-[#005fa3] disabled:opacity-50 disabled:pointer-events-none text-white font-bold px-6 py-4 text-sm sm:text-base transition-all shadow-md mt-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* STEP 1: Which service are you joining? (Live Sanity Records) */}
              {/* ============================================================ */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0077cc] block mb-1">
                      Service Encounter
                    </span>
                    <h3 className="font-heading text-2xl sm:text-3xl font-bold text-slate-950 leading-tight">
                      Which service are you joining?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
                      Select the fellowship service you plan to attend on campus.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {liveServices.map((s) => {
                      const isSelected = selectedService._id === s._id
                      return (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => handleServiceSelect(s)}
                          className={`w-full rounded-2xl p-4 sm:p-5 text-left transition-all border flex items-center justify-between group ${
                            isSelected
                              ? 'bg-sky-50/60 border-[#0077cc] ring-2 ring-[#0077cc]/20 shadow-sm'
                              : 'bg-stone-50/70 hover:bg-stone-100/90 border-stone-200/90 text-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0077cc]">
                                {s.day}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">&bull;</span>
                              <span className="text-xs font-mono font-semibold text-slate-600 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {s.time}
                              </span>
                            </div>
                            <h4 className="font-heading text-lg sm:text-xl font-bold text-slate-950 group-hover:text-[#0077cc] transition-colors">
                              {s.title}
                            </h4>
                          </div>

                          <div className="shrink-0 ml-4">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-stone-200 text-slate-400 group-hover:border-[#0077cc] group-hover:text-[#0077cc] group-hover:translate-x-0.5 transition-all shadow-2xs">
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* STEP 2: When do you plan to visit? (Calendar Selector)      */}
              {/* ============================================================ */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                      Upcoming Calendar
                    </span>
                    <h3 className="font-heading text-2xl sm:text-3xl font-bold text-slate-950 leading-tight">
                      When do you plan to visit?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
                      Pick an upcoming date for <strong>{selectedService.title}</strong> ({selectedService.day}s at {selectedService.time}).
                    </p>
                  </div>

                  {/* Large Touch-Friendly Calendar Date Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {upcomingDates.map((dateObj) => {
                      const isSelected = activeDate === dateObj.full
                      return (
                        <button
                          key={dateObj.id}
                          type="button"
                          onClick={() => handleDateSelect(dateObj.full)}
                          className={`rounded-2xl p-4 sm:p-5 text-left transition-all border flex items-center justify-between group ${
                            isSelected
                              ? 'bg-sky-50/60 border-[#0077cc] ring-2 ring-[#0077cc]/20 shadow-sm'
                              : 'bg-stone-50/70 hover:bg-stone-100/90 border-stone-200/90 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`flex flex-col items-center justify-center h-12 w-12 rounded-xl border font-mono ${
                              isSelected
                                ? 'bg-[#0077cc] text-white border-[#0077cc]'
                                : 'bg-white text-slate-800 border-stone-200 shadow-2xs'
                            }`}>
                              <span className="text-[10px] font-bold uppercase leading-none">
                                {dateObj.month}
                              </span>
                              <span className="text-base font-bold leading-tight mt-0.5">
                                {dateObj.dayNum}
                              </span>
                            </div>

                            <div>
                              <span className="text-xs font-mono text-slate-500 block">
                                {dateObj.weekday}
                              </span>
                              <span className="font-heading text-base sm:text-lg font-bold text-slate-950 block">
                                {dateObj.month} {dateObj.dayNum}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {selectedService.time}
                              </span>
                            </div>
                          </div>

                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-stone-200 text-slate-400 group-hover:border-[#0077cc] group-hover:text-[#0077cc] transition-all shadow-2xs">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* STEP 3: Where are you coming from? (Hostel Location Groups)  */}
              {/* ============================================================ */}
              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                      Campus Location
                    </span>
                    <h3 className="font-heading text-2xl sm:text-3xl font-bold text-slate-950 leading-tight">
                      Where are you coming from on campus?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
                      Select your hostel area so we can give you exact walking directions to Law NLT 5.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {ORIGINS.map((o) => {
                      const isSelected = selectedOrigin.id === o.id
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => handleOriginSelect(o)}
                          className={`w-full rounded-2xl p-4 sm:p-5 text-left transition-all border flex items-center justify-between group ${
                            isSelected
                              ? 'bg-sky-50/60 border-[#0077cc] ring-2 ring-[#0077cc]/20 shadow-sm'
                              : 'bg-stone-50/70 hover:bg-stone-100/90 border-stone-200/90 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <h4 className="font-heading text-lg sm:text-xl font-bold text-slate-950 group-hover:text-[#0077cc] transition-colors">
                              {o.label}
                            </h4>
                            <span className="text-xs font-mono font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                              {o.walkTime}
                            </span>
                          </div>

                          <div className="shrink-0 ml-4">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-stone-200 text-slate-400 group-hover:border-[#0077cc] group-hover:text-[#0077cc] group-hover:translate-x-0.5 transition-all shadow-2xs">
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* STEP 4: Summary, Location Directions & WhatsApp Connect      */}
              {/* ============================================================ */}
              {currentStep === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                      You&apos;re All Set!
                    </span>
                    <h3 className="font-heading text-2xl sm:text-3xl font-bold text-slate-950 leading-tight">
                      {firstName ? `See you there, ${firstName}!` : 'See you at Law NLT 5!'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
                      Here are your service details and directions from <strong>{selectedOrigin.label}</strong>.
                    </p>
                  </div>

                  {/* Summary Card Details */}
                  <div className="rounded-2xl bg-stone-50 border border-stone-200/90 p-4 sm:p-5 space-y-3.5 text-left">
                    
                    {/* Visitor Name & Service */}
                    <div className="flex items-start justify-between pb-3 border-b border-stone-200/70">
                      <div>
                        {fullName && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mb-1">
                            <User className="h-3 w-3 text-[#0077cc]" />
                            <span>{fullName}</span>
                          </div>
                        )}
                        <h4 className="font-heading text-lg sm:text-xl font-bold text-slate-950">
                          {selectedService.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs font-mono text-slate-600">
                          <CalendarIcon className="h-3.5 w-3.5 text-[#0077cc]" />
                          <span>{activeDate}</span>
                          <span>&bull;</span>
                          <Clock className="h-3.5 w-3.5 text-[#0077cc]" />
                          <span>{selectedService.time}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#0077cc] bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                        {selectedOrigin.walkTime}
                      </span>
                    </div>

                    {/* Venue & Copy */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#0077cc]" />
                          <span>Meeting Venue</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyVenue}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0077cc] hover:underline"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy Address</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-heading text-base sm:text-lg font-bold text-slate-950">
                        NLT 5, Faculty of Law, ESUI
                      </p>
                      <p className="text-xs text-slate-600 font-sans">
                        Law Lecture Theatre 5 &bull; Ground Floor
                      </p>
                    </div>

                    {/* Walking Directions from Chosen Hostel */}
                    <div className="pt-2.5 border-t border-stone-200/70">
                      <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5 mb-1">
                        <Navigation className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Directions from {selectedOrigin.label}</span>
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans">
                        {selectedOrigin.directions}
                      </p>
                    </div>
                  </div>

                  {/* Direct WhatsApp Call to Action */}
                  <div className="space-y-3 pt-1">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-4 text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] text-center"
                    >
                      <svg className="h-5 w-5 fill-white shrink-0" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.861.947 3.013.947 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.454-.471-4.908-1.292l-5.092 1.354 1.38-5.041c-.911-1.507-1.428-3.266-1.428-5.021 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                      </svg>
                      <span>Connect on WhatsApp for Directions</span>
                    </a>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <Link
                        href="/connect"
                        className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                      >
                        <span>Prefer a form? Fill Connect Card</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>

                      <a
                        href={`mailto:${safeEmail}?subject=Visiting%20ECCF`}
                        className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                        title={safeEmail}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Email Us</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Bottom Step Progress Bar */}
            <div className="mt-8 pt-4 border-t border-stone-100">
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  className="bg-[#0077cc] h-full rounded-full"
                  initial={false}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}