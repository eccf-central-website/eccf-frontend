/**
 * PlanAVisitSection — Client Component
 *
 * Implements Section 2.8 of SDD & CLAUDE.md guidelines.
 * Displays meeting location, interactive WhatsApp enquiry, and fellowship email.
 * Values driven dynamically by Sanity Studio siteSettings.
 */

'use client'

import { motion } from 'framer-motion'
import { MapPin, Mail } from 'lucide-react'

interface Props {
  contactPerson?: string | null
  whatsAppNumber?: string | null
  email?: string | null
}

export default function PlanAVisitSection({
  contactPerson,
  whatsAppNumber,
  email,
}: Props) {
  const safeContact = contactPerson || 'Ransom'
  const safePhone = whatsAppNumber || '+2348100000000'
  const safeEmail = email || 'edsuchristiancampusfellowship@gmail.com'

  // Strip non-digit characters for wa.me link, keeping country code
  const cleanPhone = String(safePhone).replace(/[^0-9]/g, '')
  const waUrl = `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(safeContact)}%2C%20I%20am%20planning%20to%20visit%20ECCF%20and%20need%20help%20locating%20NLT%205%20Faculty%20of%20Law.`

  return (
    <section id="visit" className="py-16 sm:py-24 bg-[#fafaf9] border-t border-stone-200/80 scroll-mt-16 sm:scroll-mt-20">
      <div className="w-full px-6 sm:px-8 lg:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
          className="space-y-5 sm:space-y-6 max-w-4xl mx-auto"
        >
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#0077cc] block mb-2 font-mono">
            JOIN OUR CAMPUS FAMILY
          </span>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] text-slate-950 tracking-tight leading-tight">
            Plan Your Visit
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
            Whether you&apos;re a fresher stepping onto campus for the first time or a returning scholar, we have a warm seat waiting for you. Expect vibrant praise, sound doctrine, and genuine community.
          </p>

          {/* Fellowship Location Highlight */}
          <div className="mt-8 sm:mt-10 rounded-[28px] bg-white border border-stone-200/80 p-6 sm:p-9 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-5 text-slate-800 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#0077cc] border border-sky-100">
              <MapPin className="h-7 w-7 text-[#0095ff]" />
            </div>
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc] block font-mono">
                FELLOWSHIP VENUE
              </span>
              <span className="font-serif font-bold text-xl sm:text-2xl text-slate-950 block mt-0.5">
                NLT 5, Faculty of Law, ESUI
              </span>
              <span className="text-sm text-slate-600 font-medium">
                Edo State University Iyamho &bull; Law Faculty Lecture Theatre 5
              </span>
            </div>
          </div>

          {/* Direct Enquiry / Direction Assistance */}
          <div className="mt-8 sm:mt-10 max-w-2xl mx-auto text-center space-y-5">
            <p className="text-sm sm:text-base text-slate-700 font-medium">
              Need help locating the venue or arranging transport? Message{' '}
              <span className="font-bold text-slate-950">{safeContact}</span> on WhatsApp or email our team:
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.861.947 3.013.947 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.454-.471-4.908-1.292l-5.092 1.354 1.38-5.041c-.911-1.507-1.428-3.266-1.428-5.021 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                </svg>
                <span>Message {safeContact} ({safePhone})</span>
              </a>

              <a
                href={`mailto:${safeEmail}?subject=Planning%20a%20Visit%20to%20ECCF`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-white border border-stone-300 text-slate-800 hover:text-[#0077cc] hover:border-sky-300 font-bold px-8 py-3.5 text-xs sm:text-sm uppercase tracking-wider shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Mail className="h-4 w-4 text-[#0077cc]" />
                <span>Email Fellowship</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}