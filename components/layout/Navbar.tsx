/**
 * Navbar — Global Navigation & Live Audio Banner Component
 *
 * Implements the exact clean, bright, professional layout from the official
 * ECCF UI sketch (eccf_website_ui_sketch_.png).
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

const navLinks = [
  { label: 'Sermons', href: '/sermons' },
  { label: 'Giving', href: '/give' },
  { label: 'About', href: '/#about' },
  { label: 'Announcements', href: '/announcements' },
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
    <div className="w-full">
      {/* Top Banner — AzuraCast Live Radio Stream Bar */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-semibold text-slate-200">🎙️ ECCF Radio — Live Now</span>
            <span className="hidden sm:inline-block rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border border-amber-500/30">
              LIVE
            </span>
            <span className="hidden md:inline text-slate-400 text-[11px]">24/7 Worship & Teaching</span>
          </div>
          <Link
            href="/sermons"
            className="inline-flex items-center gap-1 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-semibold px-3 py-1 text-[11px] transition-all"
          >
            Tune In &rarr;
          </Link>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm py-3'
            : 'bg-white border-b border-slate-100 py-4'
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6">
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-sky-100 bg-sky-50 p-0.5 transition-transform group-hover:scale-105">
              <Image
                src="/logos/ECCF LOGO.png"
                alt="ECCF Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <span className="block text-xl font-extrabold text-[#00a8ff] tracking-tight leading-none">
                ECCF
              </span>
              <span className="block text-[10px] font-medium text-slate-400 leading-none mt-0.5">
                Edo State University
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-[#00a8ff]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Action CTA: Plan a Visit */}
          <div className="flex items-center gap-3">
            <Link
              href="/#visit"
              className="hidden sm:inline-flex items-center justify-center rounded-full bg-[#00a8ff] hover:bg-[#0092e0] text-white text-sm font-bold px-6 py-2.5 shadow-md shadow-sky-500/20 transition-all hover:shadow-sky-500/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              Plan a Visit
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="flex md:hidden flex-col items-center justify-center h-9 w-9 gap-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span
                className={`block h-0.5 w-5 bg-slate-700 transition-all duration-300 ${
                  mobileOpen ? 'translate-y-2 rotate-45' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-5 bg-slate-700 transition-all duration-300 ${
                  mobileOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-5 bg-slate-700 transition-all duration-300 ${
                  mobileOpen ? '-translate-y-2 -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileOpen ? 'max-h-80 border-t border-slate-100 bg-white' : 'max-h-0'
          }`}
        >
          <ul className="flex flex-col px-6 py-4 gap-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#00a8ff]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 pt-2 border-t border-slate-100">
              <Link
                href="/#visit"
                onClick={() => setMobileOpen(false)}
                className="block rounded-full bg-[#00a8ff] text-white text-center text-sm font-bold py-2.5 shadow-sm"
              >
                Plan a Visit
              </Link>
            </li>
          </ul>
        </div>
      </header>
    </div>
  )
}
