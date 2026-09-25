/**
 * TheLauncher — 1-Click Church Next Steps Floating Widget
 *
 * Implements "The Launcher" specification from "The Church Website Homepage Formula"
 * (Formulas 1-4). Provides a persistent, floating launcher button docked at bottom-right
 * that expands into an interactive quick-access drawer for all key campus fellowship actions.
 * ADR-002 Compliant: links to Spotify & YouTube Podcasts rather than retired radio.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  X,
  Compass,
  Radio,
  Calendar,
  Heart,
  Megaphone,
  Lock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'

export interface LauncherAction {
  id: string
  title: string
  subtitle: string
  href: string
  icon: typeof Compass
  badge?: string
  color: string
  isExternal?: boolean
}

const defaultActions: LauncherAction[] = [
  {
    id: 'sermons',
    title: 'Sermon Podcasts',
    subtitle: 'Listen on Spotify & YouTube',
    href: '/sermons',
    icon: Radio,
    badge: 'ADR-002',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  {
    id: 'visit',
    title: 'Plan a Visit',
    subtitle: 'Service times & campus location',
    href: '/#visit',
    icon: Calendar,
    badge: 'Sunday 8AM',
    color: 'bg-sky-50 text-sky-600 border-sky-200',
  },
  {
    id: 'give',
    title: 'Give Online',
    subtitle: 'Support the vision via Flutterwave',
    href: '/#giving',
    icon: Heart,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
  },
  {
    id: 'announcements',
    title: 'Announcements',
    subtitle: 'Campus updates & weekly events',
    href: '/announcements',
    icon: Megaphone,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  {
    id: 'portal',
    title: 'Exco Portal',
    subtitle: 'Attendance, roster & finance CRM',
    href: '/dashboard',
    icon: Lock,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  },
]

export default function TheLauncher() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={menuRef} className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50">
      {/* Expanded Quick-Access Card Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-16 right-0 w-[310px] sm:w-[340px] rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl shadow-slate-950/20 overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0077cc] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-wider uppercase">
                      ECCF Quick Steps
                    </h4>
                    <p className="text-[10px] text-sky-200">
                      Everything accessible in 1 click
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Launcher"
                  className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="p-3 space-y-1.5 max-h-[380px] overflow-y-auto">
              {defaultActions.map((action) => {
                const IconComponent = action.icon
                return (
                  <Link
                    key={action.id}
                    href={action.href}
                    onClick={() => setIsOpen(false)}
                    target={action.isExternal ? '_blank' : undefined}
                    rel={action.isExternal ? 'noopener noreferrer' : undefined}
                    className="group flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center border ${action.color} group-hover:scale-105 transition-transform`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-[#0077cc] transition-colors">
                            {action.title}
                          </span>
                          {action.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 text-[#0077cc]">
                              {action.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block leading-tight">
                          {action.subtitle}
                        </span>
                      </div>
                    </div>
                    {action.isExternal ? (
                      <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#0077cc] group-hover:translate-x-0.5 transition-all" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Drawer Footer */}
            <div className="bg-slate-50 border-t border-slate-100 p-2.5 text-center">
              <span className="text-[10px] text-slate-400 font-medium">
                Edo State University Christian Campus Fellowship
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Trigger Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open Quick Steps Launcher"
        aria-expanded={isOpen}
        className="relative group flex items-center gap-2 rounded-full bg-slate-950 hover:bg-[#0077cc] text-white px-4 py-3 shadow-xl shadow-slate-950/25 border border-white/20 transition-all duration-300"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400" />
        </span>
        <span className="text-xs font-black uppercase tracking-wider hidden sm:inline-block">
          Next Steps
        </span>
        {isOpen ? (
          <X className="h-4 w-4 text-sky-400 transition-transform rotate-90" />
        ) : (
          <Compass className="h-4 w-4 text-sky-400 transition-transform group-hover:rotate-45" />
        )}
      </motion.button>
    </div>
  )
}
