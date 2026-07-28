/**
 * Footer — Global Footer Component
 *
 * Matches the exact clean, minimal, professional layout from the official UI sketch.
 */

import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200/80 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-sky-100 bg-sky-50 p-0.5">
                <Image
                  src="/logos/ECCF LOGO.png"
                  alt="ECCF Logo"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-2xl font-extrabold text-[#00a8ff] tracking-tight">
                ECCF
              </span>
            </div>

            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Edo State University Christian Campus Fellowship. Raising spiritual dynamites and academic giants for God&apos;s kingdom.
            </p>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
              <span className="hover:text-[#00a8ff] cursor-pointer transition-colors">IG</span>
              <span className="hover:text-[#00a8ff] cursor-pointer transition-colors">FB</span>
              <span className="hover:text-[#00a8ff] cursor-pointer transition-colors">WA</span>
              <span className="hover:text-[#00a8ff] cursor-pointer transition-colors">YT</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/sermons" className="hover:text-[#00a8ff] transition-colors">
                  Sermons
                </Link>
              </li>
              <li>
                <Link href="/give" className="hover:text-[#00a8ff] transition-colors">
                  Giving
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-[#00a8ff] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-[#00a8ff] transition-colors">
                  Programs
                </Link>
              </li>
              <li>
                <Link href="mailto:edsuchristiancampusfellowship@gmail.com" className="hover:text-[#00a8ff] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Contact
            </h3>
            <address className="not-italic space-y-2 text-sm text-slate-500">
              <p>Edo State University, Iyamho</p>
              <p>Etsako West, Edo State</p>
              <p className="pt-2">
                <a
                  href="mailto:edsuchristiancampusfellowship@gmail.com"
                  className="text-xs font-medium text-[#00a8ff] hover:underline"
                >
                  edsuchristiancampusfellowship@gmail.com
                </a>
              </p>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {currentYear} ECCF &mdash; Edo State University Christian Campus Fellowship. All rights reserved.</p>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-slate-500 hover:text-[#00a8ff] font-medium transition-colors"
          >
            🔒 Exco Dashboard Login
          </Link>
        </div>
      </div>
    </footer>
  )
}
