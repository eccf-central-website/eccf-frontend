import Image from 'next/image'
import { CalendarDays, Clock3, Mail, MessageCircle } from 'lucide-react'

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
  imageUrl?: string | null
  venueName?: string
  facultyName?: string
}

const FALLBACK_SERVICES: ServiceItem[] = [
  { _id: 'sunday', day: 'Sunday', time: '08:00 AM', title: 'Sunday Celebration' },
  { _id: 'wednesday', day: 'Wednesday', time: '04:50 PM', title: 'Word & Doctrine Service' },
  { _id: 'friday', day: 'Friday', time: '04:50 PM', title: 'Academic & Wonder Service' },
]

const DEFAULT_VENUE = 'New Lecture Theatre 5 (NLT 5)'
const DEFAULT_FACULTY = 'Faculty of Law, Edo State University, Iyamho'

export default function PlanAVisitSection({
  services,
  contactPerson,
  whatsAppNumber,
  email,
  imageUrl,
  venueName = DEFAULT_VENUE,
  facultyName = DEFAULT_FACULTY,
}: Props) {
  const activeServices = (services?.length ? services : FALLBACK_SERVICES).slice(0, 3)
  const contactName = contactPerson?.trim() || 'the ECCF team'
  const phoneDigits = (whatsAppNumber || '').replace(/\D/g, '')
  const hasWhatsApp = /^\d{8,15}$/.test(phoneDigits) && phoneDigits !== '2348100000000'
  const safeEmail = email?.trim() || ''
  const whatsappUrl = hasWhatsApp
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hello ${contactName}, I am planning to visit ECCF. Could you please confirm the next service?`)}`
    : null

  const displayImage = imageUrl || '/gallery/gallery-4.jpg'

  return (
    <section
      id="visit"
      aria-labelledby="visit-heading"
      className="relative overflow-hidden border-t border-stone-200/90 bg-[#fafaf9] py-16 scroll-mt-16 sm:py-20 sm:scroll-mt-20 lg:py-24"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 shrink-0 rounded-full bg-sky-100/70 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 shrink-0 rounded-full bg-emerald-50/80 blur-3xl" aria-hidden="true" />

      <div className="relative w-full grid gap-8 px-6 sm:px-10 md:px-14 lg:px-14 xl:px-20 2xl:px-28 lg:grid-cols-12 lg:gap-12 items-stretch">
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
              You are welcome at any of our weekly gatherings. Check our service schedule, or message us if you need help planning your visit.
            </p>

            <div className="mt-6 space-y-3" aria-label="Weekly service times">
              {activeServices.map((service) => (
                <article key={service._id} className="rounded-2xl border border-stone-200/90 bg-white/95 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-slate-950 text-base">{service.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                      <CalendarDays className="h-4 w-4 shrink-0 text-[#0077cc]" aria-hidden="true" />
                      {service.day}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                      <Clock3 className="h-4 w-4 shrink-0 text-[#0077cc]" aria-hidden="true" />
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
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                Message {contactName}
              </a>
            )}
            {safeEmail && (
              <a
                href={`mailto:${safeEmail}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-[#0077cc] hover:text-[#0077cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] focus-visible:ring-offset-2"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                Email us
              </a>
            )}
            {!whatsappUrl && !safeEmail && (
              <p className="text-sm text-slate-600">Contact details are being updated. Check back soon.</p>
            )}
          </div>
        </div>

        {/* Right Column: Large Fellowship Image for PC screens */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="group relative w-full h-[360px] sm:h-[440px] lg:h-full min-h-[380px] lg:min-h-[480px] overflow-hidden rounded-3xl border border-stone-200/90 bg-stone-100 shadow-xl shadow-stone-200/50">
            <Image
              src={displayImage}
              alt="ECCF Fellowship Family Community"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Gradient overlay scrim for contrast and legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

            {/* Bottom Floating Venue Details Pill */}
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 text-white z-10 flex flex-col justify-end">
              <h3 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug drop-shadow-sm">
                {venueName}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 drop-shadow-sm">
                {facultyName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
