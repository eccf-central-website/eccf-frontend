import {
  CalendarDays,
  Clock3,
  Mail,
  MessageCircle,
  Building2,
  Navigation,
  Users,
} from 'lucide-react'

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
  { _id: 'sunday', day: 'Sunday', time: '08:00 AM', title: 'Sunday Celebration' },
  { _id: 'wednesday', day: 'Wednesday', time: '04:50 PM', title: 'Word & Doctrine Service' },
  { _id: 'friday', day: 'Friday', time: '04:50 PM', title: 'Academic & Wonder Service' },
]

const VENUE_NAME = 'New Lecture Theatre 5 (NLT 5)'
const VENUE_FACULTY = 'Faculty of Law Complex'
const VENUE_CAMPUS = 'Edo State University, Iyamho (Main Campus)'

export default function PlanAVisitSection({ services, contactPerson, whatsAppNumber, email }: Props) {
  const activeServices = (services?.length ? services : FALLBACK_SERVICES).slice(0, 3)
  const contactName = contactPerson?.trim() || 'the ECCF team'
  const phoneDigits = (whatsAppNumber || '').replace(/\D/g, '')
  const hasWhatsApp = /^\d{8,15}$/.test(phoneDigits) && phoneDigits !== '2348100000000'
  const safeEmail = email?.trim() || ''
  const whatsappUrl = hasWhatsApp
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hello ${contactName}, I am planning to visit ECCF. Could you please confirm the next service and guide me to NLT 5?`)}`
    : null

  return (
    <section
      id="visit"
      aria-labelledby="visit-heading"
      className="relative overflow-hidden border-t border-stone-200/90 bg-[#fafaf9] py-16 scroll-mt-16 sm:py-20 sm:scroll-mt-20 lg:py-24"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-sky-100/70 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-emerald-50/80 blur-3xl" aria-hidden="true" />

      <div className="relative w-full grid gap-8 px-6 sm:px-10 md:px-14 lg:px-14 xl:px-20 2xl:px-28 lg:grid-cols-12 lg:gap-12 items-start">
        {/* Left Column: Weekly Service Schedule & Actions */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#0077cc]">
              PLAN A VISIT
            </span>
            <h2 id="visit-heading" className="font-heading text-3xl leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Join us this week.
            </h2>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
              You are warmly welcome at any of our weekly services. Check the schedule, follow our simple campus directions, or message our hospitality team if you need guidance.
            </p>

            <div className="mt-6 space-y-3" aria-label="Weekly service times">
              {activeServices.map((service) => (
                <article key={service._id} className="rounded-2xl border border-stone-200/90 bg-white/95 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-slate-950 text-base">{service.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                      <CalendarDays className="h-4 w-4 text-[#0077cc]" aria-hidden="true" />
                      {service.day}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                      <Clock3 className="h-4 w-4 text-[#0077cc]" aria-hidden="true" />
                      {service.time}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0077cc] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0066ad] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] focus-visible:ring-offset-2"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Message {contactName}
              </a>
            )}
            {safeEmail && (
              <a
                href={`mailto:${safeEmail}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-[#0077cc] hover:text-[#0077cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] focus-visible:ring-offset-2"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email us
              </a>
            )}
            {!whatsappUrl && !safeEmail && (
              <p className="text-sm text-slate-600">Contact details are being updated. Check back soon.</p>
            )}
          </div>
        </div>

        {/* Right Column: Campus Location, Wayfinding Stepper & Guided Assistance */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-xl shadow-stone-200/50">
            {/* Header Banner */}
            <div className="border-b border-stone-100 bg-gradient-to-r from-sky-50/80 via-white to-blue-50/40 p-6 sm:p-7">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#0077cc]">
                <Building2 className="h-4 w-4" />
                <span>Gathering Venue & Campus Directions</span>
              </div>
              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-slate-950 mt-2">
                {VENUE_NAME}
              </h3>
              <p className="text-sm sm:text-base font-medium text-slate-600 mt-1">
                {VENUE_FACULTY} &bull; {VENUE_CAMPUS}
              </p>
            </div>

            {/* Step-by-Step Wayfinding */}
            <div className="p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5 text-[#0077cc]" />
                  How to locate the auditorium
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Open to all students & visitors
                </span>
              </div>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#0077cc]">
                    01
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Enter via Main University Gate</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                      Arrive at Edo State University through the main campus entrance along the Auchi–Abuja Expressway.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#0077cc]">
                    02
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Head toward Faculty of Law</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                      Follow the central campus boulevard past the Senate/Administrative Complex towards the Faculty of Law building.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0077cc] text-xs font-bold text-white shadow-sm shadow-sky-500/30">
                    03
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Locate NLT 5 (Ground Wing)</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                      New Lecture Theatre 5 is right on the ground floor. Look out for the ECCF welcoming team stationed at the entrance!
                    </p>
                  </div>
                </div>
              </div>

              {/* Hospitality Card */}
              <div className="mt-6 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-blue-50/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-[#0077cc]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Need someone to walk in with you?</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      First time visiting? Our Protocol team will gladly meet you at the hostel gate or Law faculty entrance.
                    </p>
                  </div>
                </div>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#0077cc] hover:bg-[#0066ad] text-white text-xs font-bold px-4 py-2.5 transition-colors shadow-sm"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Request a Guide
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
