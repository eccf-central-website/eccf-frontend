/**
 * Navbar — Global Sticky Navigation Component
 *
 * Designed to strictly follow the ECCF UI/UX Design Requirements Brief.
 * Uses official Light Blue brand color scheme (#0ea5e9 / Sky-500) and displays the official ECCF logo.
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Who We Are', href: '/#about' },
  { label: 'Service Times', href: '/#services' },
  { label: 'Teams', href: '/#teams' },
  { label: 'Sermons', href: '/sermons' },
  { label: 'Announcements', href: '/announcements' },
  { label: 'Give', href: '/give' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-[#070d19]/90 backdrop-blur-xl border-b border-sky-900/30 shadow-lg shadow-sky-950/20 py-3.5'
          : 'bg-[#070d19]/60 backdrop-blur-md border-b border-white/5 py-4'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6">
        {/* Official ECCF Logo & Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-sky-500/30 bg-sky-950/40 p-0.5 shadow-md shadow-sky-500/20 transition-transform group-hover:scale-105">
            <Image
              src="/logos/ECCF LOGO.png"
              alt="ECCF Logo"
              width={40}
              height={40}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div>
            <span className="block text-base font-extrabold tracking-tight text-white leading-none group-hover:text-sky-400 transition-colors">
              ECCF
            </span>
            <span className="block text-[10px] font-medium text-sky-400/90 leading-none tracking-wider mt-0.5">
              Edo State University
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <ul className="hidden lg:flex items-center gap-1.5">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-sky-500/10 hover:text-sky-400"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Primary CTA: "Plan a Visit" Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/#visit"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-400/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            Plan a Visit
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex lg:hidden flex-col items-center justify-center h-10 w-10 gap-1.5 rounded-xl border border-sky-500/20 bg-sky-950/30 text-sky-400 hover:bg-sky-500/10 transition-colors"
          >
            <span
              className={`block h-0.5 w-5 bg-sky-400 transition-all duration-300 ${
                mobileOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-sky-400 transition-all duration-300 ${
                mobileOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-sky-400 transition-all duration-300 ${
                mobileOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-[450px] border-t border-sky-900/30 bg-[#070d19]/95 backdrop-blur-2xl' : 'max-h-0'
        }`}
      >
        <ul className="flex flex-col px-6 py-5 gap-1.5">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-sky-500/10 hover:text-sky-400"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="mt-3 pt-3 border-t border-sky-900/30">
            <Link
              href="/#visit"
              onClick={() => setMobileOpen(false)}
              className="block rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-sky-500/25"
            >
              Plan a Visit
            </Link>
          </li>
        </ul>
      </div>
    </header>
  )
}
