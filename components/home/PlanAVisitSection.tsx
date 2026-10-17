import { CalendarDays, Clock3, Mail, MapPin, MessageCircle } from 'lucide-react'

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

const VENUE = 'NLT 5, Faculty of Law, Edo State University, Iyamho'
const MAP_QUERY = 'Faculty of Law, Edo State University, Iyamho, Edo State, Nigeria'

export default function PlanAVisitSection({ services, contactPerson, whatsAppNumber, email }: Props) {
  const activeServices = (services?.length ? services : FALLBACK_SERVICES).slice(0, 3)
  const contactName = contactPerson?.trim() || 'the ECCF team'
  const phoneDigits = (whatsAppNumber || '').replace(/\D/g, '')
  const hasWhatsApp = /^\d{8,15}$/.test(phoneDigits) && phoneDigits !== '2348100000000'
  const safeEmail = email?.trim() || ''
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&z=16&output=embed`
  const whatsappUrl = hasWhatsApp
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hello ${contactName}, I am planning to visit ECCF. Could you please confirm the next service and help me find NLT 5?`)}`
    : null

  return (
    <section
      id="visit"
      aria-labelledby="visit-heading"
      className="relative overflow-hidden border-t border-stone-200/90 bg-[#fafaf9] py-16 scroll-mt-16 sm:py-20 sm:scroll-mt-20 lg:py-24"
    >
      <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-sky-100/70 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-emerald-50/80 blur-3xl" aria-hidden="true" />

      <div className="relative w-full grid gap-8 px-6 sm:px-10 md:px-14 lg:px-14 xl:px-20 2xl:px-28 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#0077cc]">
            PLAN A VISIT
          </span>
          <h2 id="visit-heading" className="font-heading text-3xl leading-tight tracking-tight text-slate-950 sm:text-4xl">
            Join us this week.
          </h2>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
            You are welcome at any of our weekly gatherings. Check the service times, find us on the map, or message us if you need help.
          </p>

          <div className="mt-6 space-y-3" aria-label="Weekly service times">
            {activeServices.map((service) => (
              <article key={service._id} className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
                <h3 className="font-semibold text-slate-950">{service.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-[#0077cc]" aria-hidden="true" />{service.day}</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-[#0077cc]" aria-hidden="true" />{service.time}</span>
                </div>
              </article>
            ))}
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
              <p className="text-sm text-slate-600">Contact details are being updated. You can still open the map below.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-lg shadow-stone-200/50">
            <iframe
              title="Map to Edo State University Faculty of Law"
              src={mapEmbedUrl}
              className="h-64 w-full border-0 sm:h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0077cc]" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-slate-950">{VENUE}</p>
                  <p className="mt-1 text-xs text-slate-500">Ask for NLT 5 when you arrive at the Faculty of Law.</p>
                </div>
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-[#0077cc] hover:text-[#0077cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc] focus-visible:ring-offset-2"
              >
                Open in Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
