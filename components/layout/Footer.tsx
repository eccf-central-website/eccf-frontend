/**
 * Footer — Global Footer Component
 *
 * Implements Section 2.7 of SDD and CLAUDE.md guidelines.
 */

import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200/80 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
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
              <span className="text-2xl font-black text-[#0095ff] tracking-tight">
                ECCF
              </span>
            </div>

            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Edo State University Christian Campus Fellowship. Raising spiritual dynamites and academic giants for God&apos;s kingdom.
            </p>

            {/* Social Media Links including TikTok */}
            <div className="flex items-center gap-4 text-slate-400">
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                aria-label="Instagram"
                className="hover:text-[#0095ff] transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                title="TikTok"
                aria-label="TikTok"
                className="hover:text-[#0095ff] transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28 6.34 6.34 0 0 0 9.34 21.6a6.34 6.34 0 0 0 6.34-6.32V8.75a8.28 8.28 0 0 0 4.81 1.54V6.84a4.8 4.8 0 0 1-.9-.15z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube"
                aria-label="YouTube"
                className="hover:text-[#0095ff] transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 7.1C2.5 7.1 2 9.4 2 12c0 2.6.5 4.9.5 4.9 0 0 1.9.1 5 .1h9c3 0 4.9-.1 4.9-.1.5-2.6.6-4.9.6-4.9 0-2.6-.6-4.9-.6-4.9 0 0-1.9-.1-5-.1h-9C4.4 7 2.5 7.1 2.5 7.1z"/>
                  <polygon points="9.5,15 15.5,12 9.5,9"/>
                </svg>
              </a>

              {/* Twitter / X */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Twitter / X"
                aria-label="Twitter / X"
                className="hover:text-[#0095ff] transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                aria-label="Facebook"
                className="hover:text-[#0095ff] transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/sermons" className="hover:text-[#0095ff] transition-colors">
                  Sermons
                </Link>
              </li>
              <li>
                <Link href="/give" className="hover:text-[#0095ff] transition-colors">
                  Giving
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-[#0095ff] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-[#0095ff] transition-colors">
                  Programs
                </Link>
              </li>
              <li>
                <Link href="mailto:edsuchristiancampusfellowship@gmail.com" className="hover:text-[#0095ff] transition-colors">
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
                  className="text-xs font-medium text-[#0095ff] hover:underline"
                >
                  edsuchristiancampusfellowship@gmail.com
                </a>
              </p>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 sm:mt-14 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {currentYear} ECCF &mdash; Edo State University Christian Campus Fellowship. All rights reserved.</p>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-slate-500 hover:text-[#0095ff] font-medium transition-colors"
          >
            🔒 Exco Dashboard Login
          </Link>
        </div>
      </div>
    </footer>
  )
}
