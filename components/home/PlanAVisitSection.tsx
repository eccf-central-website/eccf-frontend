/**
 * PlanAVisitSection — Client Component
 *
 * Implements Section 2.8 of SDD & CLAUDE.md guidelines.
 * Displays meeting location, interactive WhatsApp enquiry, and fellowship email.
 * Values driven dynamically by Sanity Studio siteSettings.
 */

'use client'

import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

interface Props {
  contactPerson?: string
  whatsAppNumber?: string
  email?: string
}

export default function PlanAVisitSection({
  contactPerson = 'Ransom',
  whatsAppNumber = '+2348100000000',
  email = 'edsuchristiancampusfellowship@gmail.com',
}: Props) {
  // Strip non-digit characters for wa.me link, keeping country code
  const cleanPhone = whatsAppNumber.replace(/[^0-9]/g, '')
  const waUrl = `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(contactPerson)}%2C%20I%20am%20planning%20to%20visit%20ECCF%20and%20need%20help%20locating%20NLT%205%20Faculty%20of%20Law.`

  return (
    <section id="visit" className="py-14 sm:py-24 bg-[#fafaf9] scroll-mt-16 sm:scroll-mt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
          className="space-y-4 sm:space-y-6"
        >
          <span className="text-xs font-black tracking-widest text-[#0077cc] uppercase block mb-2 font-mono">
            JOIN OUR CAMPUS FAMILY
          </span>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight mt-1">
            Planning a Visit to ECCF?
          </h2>

          <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
            Whether you&apos;re a fresher stepping onto campus for the first time or a returning scholar, we have a warm seat waiting for you. Expect vibrant praise, sound doctrine, and genuine community.
          </p>

          {/* Fellowship Location Highlight */}
          <div className="mt-7 sm:mt-8 rounded-3xl bg-white p-5 sm:p-7 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-slate-800 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#0077cc]">
              <MapPin className="h-6 w-6 text-[#0077cc]" />
            </div>
            <div className="text-center sm:text-left">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#0077cc] block">
                FELLOWSHIP VENUE
              </span>
              <span className="text-base sm:text-xl font-black text-slate-900 block">
                NLT 5, Faculty of Law, ESUI
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Edo State University Iyamho &bull; NLT 5
              </span>
            </div>
          </div>

          {/* Direct Enquiry / Direction Assistance */}
          <div className="mt-7 sm:mt-8 max-w-xl mx-auto text-center space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Need any help locating the venue or arranging a ride? Message{' '}
              <span className="font-bold text-slate-900">{contactPerson}</span> on WhatsApp or email our team:
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.03] active:scale-[0.98] min-h-[44px]"
              >
                <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.861.947 3.013.947 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.782 0-3.454-.471-4.908-1.292l-5.092 1.354 1.38-5.041c-.911-1.507-1.428-3.266-1.428-5.021 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                </svg>
                <span>Message {contactPerson} ({whatsAppNumber})</span>
              </a>

              <a
                href={`mailto:${email}?subject=Planning%20a%20Visit%20to%20ECCF`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 text-slate-800 font-bold px-7 py-3.5 text-xs uppercase tracking-wider hover:bg-slate-200 transition-all hover:scale-[1.03] active:scale-[0.98] min-h-[44px]"
              >
                <span>Email Fellowship</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}