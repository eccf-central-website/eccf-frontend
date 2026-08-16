/**
 * Navbar — Global Navigation Header
 *
 * Clean, glassmorphic capsule design with refined typography and smooth responsive interactions.
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Sermons', href: '/sermons' },
  { label: 'Giving', href: '/#giving' },
  { label: 'About', href: '/#about' },
  { label: 'Announcements', href: '/announcements' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-sm py-3'
          : 'bg-white/70 backdrop-blur-sm border-b border-slate-100 py-4'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6">
        {/* Brand Logo & Monogram */}
        <Link href="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-sky-100 bg-sky-50 p-0.5 transition-transform group-hover:scale-105 shadow-sm">
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
            <span className="block text-xl font-black text-slate-950 tracking-tight leading-none">
              ECCF
            </span>
            <span className="block text-[10px] font-bold text-slate-400 leading-none mt-1 tracking-wider uppercase">
              Edo State University
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-xs font-bold uppercase tracking-wider text-slate-600 transition-colors hover:text-[#0095ff] focus:outline-none"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Primary CTA: Vibrant Blue Give Online */}
        <div className="flex items-center gap-3">
          <Link
            href="/#giving"
            className="hidden sm:inline-flex items-center justify-center rounded-full bg-[#0095ff] hover:bg-[#0080e0] text-white text-xs font-bold px-6 py-2.5 shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Give Online
          </Link>

          {/* Mobile Menu Button */}
          <button
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex md:hidden items-center justify-center h-9 w-9 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-80 border-t border-slate-100 bg-white/95 backdrop-blur-lg' : 'max-h-0'
        }`}
      >
        <ul className="flex flex-col px-6 py-4 gap-2">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:text-[#0095ff]"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="mt-2 pt-2 border-t border-slate-100">
            <Link
              href="/#giving"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center rounded-full bg-[#0095ff] text-white text-center text-xs font-bold py-3 shadow-md shadow-sky-500/20"
            >
              Give Online
            </Link>
          </li>
        </ul>
      </div>
    </header>
  )
}
