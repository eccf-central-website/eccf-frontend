/**
 * Navbar — Global Navigation Header
 *
 * Clean, glassmorphic capsule design with persistent active-route indicator,
 * instant navigation feedback, and refined typography.
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Sermons', href: '/sermons' },
  { label: 'Giving', href: '/#giving' },
  { label: 'About', href: '/about' },
  { label: 'Announcements', href: '/announcements' },
  { label: 'Connect', href: '/connect' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')
  const [clickedHref, setClickedHref] = useState<string | null>(null)

  // Sync active section based on URL hash
  useEffect(() => {
    const syncHash = () => {
      if (typeof window !== 'undefined') {
        setActiveSection(window.location.hash)
      }
    }

    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  // Sync section hash on route change and reset clicked state
  useEffect(() => {
    setClickedHref(null)
    if (typeof window !== 'undefined') {
      setActiveSection(window.location.hash)
    }
  }, [pathname])

  // Track scroll position to update navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Observe #giving section when on homepage to reflect active state while scrolling
  useEffect(() => {
    if (pathname !== '/') return

    const givingEl = document.getElementById('giving')
    if (!givingEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection('#giving')
          } else {
            setActiveSection((prev) => (prev === '#giving' ? '' : prev))
          }
        })
      },
      {
        rootMargin: '-20% 0px -40% 0px',
        threshold: 0.1,
      }
    )

    observer.observe(givingEl)
    return () => observer.disconnect()
  }, [pathname])

  const handleLinkClick = (href: string) => {
    setClickedHref(href)

    if (href.includes('#')) {
      const hash = '#' + href.split('#')[1]
      setActiveSection(hash)
      if (pathname === '/') {
        const id = href.split('#')[1]
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }
    } else {
      setActiveSection('')
    }

    setMobileOpen(false)
  }

  const isLinkActive = (href: string) => {
    if (clickedHref) {
      if (clickedHref === href) return true
      if (clickedHref === '/#giving' && href === '/give') return true
      if (clickedHref === '/give' && href === '/#giving') return true
      return false
    }
    if (href === '/#giving' || href === '/give') {
      return pathname === '/give' || (pathname === '/' && activeSection === '#giving')
    }
    if (href === '/') return pathname === '/' && !activeSection
    if (href.startsWith('/#')) return false
    return Boolean(pathname && pathname.startsWith(href))
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-sm py-3'
          : 'bg-white/70 backdrop-blur-sm border-b border-slate-100 py-4'
      }`}
    >
      <nav
        className={`w-full flex items-center justify-between px-6 sm:px-10 md:px-14 lg:px-14 xl:px-20 2xl:px-28 transition-all ${
          mobileOpen ? 'pb-3.5 sm:pb-4 lg:pb-0' : ''
        }`}
      >
        {/* Brand Logo & Monogram */}
        <Link
          href="/"
          onClick={() => handleLinkClick('/')}
          className="flex items-center gap-3 group focus:outline-none min-w-0"
        >
          <div className="relative h-10 w-10 shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/logos/ECCF LOGO.png"
              alt="ECCF Logo"
              width={40}
              height={40}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <span className="block text-xl sm:text-2xl font-serif font-normal text-slate-950 tracking-tight leading-none">
              ECCF Family
            </span>
            <span className="block text-xs sm:text-sm font-bold text-slate-700 tracking-normal leading-none mt-0.5 truncate max-w-[calc(100vw-130px)] sm:max-w-none">
              ESUI Christian Campus Fellowship
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links with Persistent Active State */}
        <ul className="hidden lg:flex items-center gap-1 xl:gap-2.5">
          {navLinks.map((link) => {
            const active = isLinkActive(link.href)

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={`group relative inline-flex items-center px-3 xl:px-4 py-2 text-sm xl:text-base whitespace-nowrap transition-colors duration-200 focus:outline-none ${
                    active
                      ? 'text-[#0095ff] font-bold'
                      : 'text-slate-600 hover:text-[#0095ff] font-semibold'
                  }`}
                >
                  <span>{link.label}</span>
                  {/* Underline indicator: visible ONLY on active/clicked state */}
                  <span
                    className={`absolute bottom-0 left-2.5 right-2.5 h-[2.5px] bg-[#0095ff] rounded-full transition-all duration-200 ease-out origin-center ${
                      active
                        ? 'scale-x-100 opacity-100'
                        : 'scale-x-0 opacity-0 pointer-events-none'
                    }`}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Primary CTA: Plan a Visit */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/#visit"
            className="hidden sm:inline-flex items-center justify-center rounded-full bg-[#0095ff] hover:bg-[#0080e0] text-white text-xs sm:text-sm font-bold px-4 sm:px-6 py-2 sm:py-2.5 shadow-md shadow-sky-500/20 whitespace-nowrap shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Plan a Visit
          </Link>

          {/* Mobile Menu Button */}
          <button
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex lg:hidden items-center justify-center h-10 w-10 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none shrink-0"
          >
            {mobileOpen ? <X className="h-5 w-5 shrink-0" /> : <Menu className="h-5 w-5 shrink-0" />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown with Active States */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-[85vh] border-t border-slate-100 bg-white/95 backdrop-blur-lg' : 'max-h-0'
        }`}
      >
        <ul className="flex flex-col px-6 pt-3.5 pb-4 gap-2">
          {navLinks.map((link) => {
            const active = isLinkActive(link.href)

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={`group relative flex items-center justify-between rounded-r-xl px-4 py-3 text-base sm:text-lg transition-colors overflow-hidden ${
                    active
                      ? 'text-[#0095ff] font-bold border-l-4 border-[#0095ff] bg-sky-50/60 pl-3.5'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#0095ff] font-semibold'
                  }`}
                >
                  <span>{link.label}</span>
                </Link>
              </li>
            )
          })}
          <li className="mt-2 pt-2 border-t border-slate-100">
            <Link
              href="/#visit"
              onClick={() => handleLinkClick('/#visit')}
              className="flex items-center justify-center rounded-full bg-[#0095ff] text-white text-center text-sm font-bold py-3.5 shadow-md shadow-sky-500/20"
            >
              Plan a Visit
            </Link>
          </li>
        </ul>
      </div>
    </header>
  )
}
