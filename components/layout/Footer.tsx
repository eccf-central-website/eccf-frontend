/**
 * Footer — Global Footer Component
 *
 * Implements Section 2.7 of SDD and CLAUDE.md guidelines.
 * Uses official, pixel-perfect web SVG icons for social platforms and Lucide Lock for Exco auth.
 */

import Link from 'next/link'
import Image from 'next/image'
import { Lock } from 'lucide-react'

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

            {/* Social Media Links with Official Vector Paths */}
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
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
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
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
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
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>Exco Dashboard Login</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
