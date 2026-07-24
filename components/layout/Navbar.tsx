/**
 * Navbar — Global navigation component
 *
 * Public-facing top navigation for the ECCF website.
 * Uses Next.js <Link> for client-side navigation.
 * Mobile-first: hamburger menu on small screens, full nav on md+.
 */

'use client'

import Link from 'next/link'
import {useState} from 'react'

const navLinks = [
  {label: 'Home', href: '/'},
  {label: 'About', href: '/about'},
  {label: 'Sermons', href: '/sermons'},
  {label: 'Events', href: '/events'},
  {label: 'Announcements', href: '/announcements'},
  {label: 'Give', href: '/give'},
  {label: 'Contact', href: '/contact'},
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0f1e]/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-[#0a0f1e] shadow-lg shadow-amber-500/20 transition-transform group-hover:scale-105">
            EC
          </div>
          <div className="hidden sm:block">
            <span className="block text-sm font-bold leading-none text-white">ECCF</span>
            <span className="block text-[10px] leading-none text-amber-400/80 tracking-wide">
              Edo State University
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/give"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-[#0a0f1e] shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 hover:shadow-amber-400/30 hover:-translate-y-px active:translate-y-0"
          >
            Give
          </Link>

          {/* Mobile hamburger */}
          <button
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex md:hidden flex-col items-center justify-center h-9 w-9 gap-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span
              className={`block h-0.5 w-5 bg-white transition-all duration-300 ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`}
            />
            <span
              className={`block h-0.5 w-5 bg-white transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}
            />
            <span
              className={`block h-0.5 w-5 bg-white transition-all duration-300 ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-96 border-t border-white/10' : 'max-h-0'}`}
      >
        <ul className="flex flex-col px-6 py-4 gap-1">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="mt-2 pt-2 border-t border-white/10">
            <Link
              href="/give"
              onClick={() => setMobileOpen(false)}
              className="block rounded-full bg-amber-500 px-4 py-2.5 text-center text-sm font-semibold text-[#0a0f1e] hover:bg-amber-400 transition-colors"
            >
              Give Now
            </Link>
          </li>
        </ul>
      </div>
    </header>
  )
}
