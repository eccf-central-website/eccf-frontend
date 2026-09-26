/**
 * TheLauncher — Nucleus-Style "Next Steps" & Connect Card Drawer
 *
 * 100% faithful to the First Baptist New Orleans / Nucleus "Next Steps" Card:
 * - Floating dark luxury card (bg-[#182329]) docked bottom-right
 * - Top header with Expand/Minimize toggle and "Sign In" link
 * - Centered ECCF crest and "Take your next step here!" subtitle
 * - Stacked full-width rounded buttons:
 *     1. "Connect Card" (with interactive inline slide-in form!)
 *     2. "Join A Team"
 *     3. "Registrations"
 *     4. "Weekly Podcasts"
 *     5. "Give Online"
 *     6. "or, See more next steps"
 * - In-widget Connect Card form powered by `submitFirstTimer` server action
 * - Floating bottom-right trigger button with close 'X' when open
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Maximize2,
  Minimize2,
  X,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Send,
  Heart,
  Calendar,
  Radio,
  Footprints,
  Lock,
} from 'lucide-react'
import { submitFirstTimer } from '@/app/actions/intake-actions'

type ViewMode = 'menu' | 'connect-card' | 'more-steps'

export default function TheLauncher() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [view, setView] = useState<ViewMode>('menu')
  const [formLoading, setFormLoading] = useState(false)
  const [formStatus, setFormStatus] = useState<{ success?: boolean; error?: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Reset view when opened/closed
  useEffect(() => {
    if (!isOpen) {
      setView('menu')
      setFormStatus(null)
      setIsExpanded(false)
    }
  }, [isOpen])

  // Close on click outside
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

  // Close on Escape
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

  async function handleConnectSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormLoading(true)
    setFormStatus(null)

    const formData = new FormData(e.currentTarget)
    try {
      const res = await submitFirstTimer(formData)
      setFormStatus(res)
      if (res.success) {
        ;(e.target as HTMLFormElement).reset()
      }
    } catch {
      setFormStatus({ success: false, error: 'Connection failed. Please try again.' })
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div ref={menuRef} className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={
              isExpanded
                ? 'fixed inset-0 z-[100] w-screen h-screen rounded-none bg-[#182329] text-white flex flex-col overflow-hidden transition-all duration-300'
                : 'fixed sm:absolute bottom-20 right-0 w-[calc(100vw-32px)] sm:w-[370px] h-[580px] max-h-[82vh] rounded-[30px] bg-[#182329] text-white border border-white/10 shadow-2xl shadow-black/70 flex flex-col overflow-hidden transition-all duration-300'
            }
          >
            {/* ========================================================== */}
            {/* TOP BAR: Maximize & Close                                  */}
            {/* ========================================================== */}
            <div
              className={`flex items-center justify-between px-6 pt-5 pb-2 text-slate-400 w-full ${
                isExpanded ? 'max-w-2xl mx-auto' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="hover:text-white transition-colors p-1 -ml-1 rounded-lg focus:outline-none flex items-center gap-1.5 text-xs font-semibold"
                aria-label={isExpanded ? 'Minimize' : 'Maximize to fill screen'}
                title={isExpanded ? 'Minimize' : 'Fill Screen'}
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    <span>Minimize</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ========================================================== */}
            {/* CARD CONTENT AREA (Scrollable)                            */}
            {/* ========================================================== */}
            <div
              className={`flex-1 overflow-y-auto px-6 py-4 flex flex-col justify-between custom-scrollbar w-full ${
                isExpanded ? 'max-w-2xl mx-auto my-auto py-8' : ''
              }`}
            >
              
              {/* ---------------------------------------------------- */}
              {/* VIEW: MAIN NEXT STEPS MENU                           */}
              {/* ---------------------------------------------------- */}
              {view === 'menu' && (
                <div className="flex flex-col flex-1 justify-between">
                  {/* Brand Header */}
                  <div className="text-center pt-2 pb-5">
                    <div className="mx-auto mb-2.5 h-12 w-12 flex items-center justify-center">
                      <Image
                        src="/logos/ECCF LOGO.png"
                        alt="ECCF Logo"
                        width={44}
                        height={44}
                        className="object-contain"
                      />
                    </div>
                    <h3 className="font-serif text-base sm:text-lg font-bold tracking-tight text-white leading-snug max-w-[280px] mx-auto">
                      Edo State University Christian Campus Fellowship
                    </h3>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mt-1">
                      ECCF
                    </p>
                    <p className="text-xs text-slate-300 font-medium mt-1.5">
                      Take your next step here!
                    </p>
                  </div>

                  {/* Nucleus Stacked Pill Action Buttons */}
                  <div className="space-y-2.5 my-auto">
                    {/* 1. CONNECT CARD (Interactive Form Slide-in) */}
                    <button
                      type="button"
                      onClick={() => setView('connect-card')}
                      className="w-full py-3.5 px-5 rounded-2xl bg-[#233138] hover:bg-[#2b3c45] border border-white/5 text-center font-bold text-white text-[15px] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm flex items-center justify-center gap-2 group"
                    >
                      <span>Connect Card</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                        New
                      </span>
                    </button>

                    {/* 2. JOIN A TEAM / WORKERS */}
                    <Link
                      href="/connect"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-3.5 px-5 rounded-2xl bg-[#233138] hover:bg-[#2b3c45] border border-white/5 text-center font-bold text-white text-[15px] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm block"
                    >
                      Join Fellowship & Teams
                    </Link>

                    {/* 3. REGISTRATIONS & EVENTS */}
                    <Link
                      href="/announcements"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-3.5 px-5 rounded-2xl bg-[#233138] hover:bg-[#2b3c45] border border-white/5 text-center font-bold text-white text-[15px] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm block"
                    >
                      Registrations & Events
                    </Link>

                    {/* 4. WEEKLY PODCASTS / BULLETINS */}
                    <Link
                      href="/sermons"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-3.5 px-5 rounded-2xl bg-[#233138] hover:bg-[#2b3c45] border border-white/5 text-center font-bold text-white text-[15px] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm block"
                    >
                      Weekly Podcasts & Messages
                    </Link>

                    {/* 5. GIVE ONLINE */}
                    <Link
                      href="/#giving"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-3.5 px-5 rounded-2xl bg-[#233138] hover:bg-[#2b3c45] border border-white/5 text-center font-bold text-white text-[15px] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm block"
                    >
                      Give Online
                    </Link>

                    {/* 6. SEE MORE NEXT STEPS */}
                    <button
                      type="button"
                      onClick={() => setView('more-steps')}
                      className="w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      or, See more next steps
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* VIEW: INLINE CONNECT CARD FORM                       */}
              {/* ---------------------------------------------------- */}
              {view === 'connect-card' && (
                <div className="flex flex-col flex-1 py-1">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                    <button
                      type="button"
                      onClick={() => setView('menu')}
                      className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                      Connect Card
                    </span>
                  </div>

                  {formStatus?.success ? (
                    <div className="my-auto py-8 text-center">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-base text-white mb-1">
                        Welcome to the Family!
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed px-4">
                        Thank you for filling our Connect Card. Our leadership team will reach out with warm fellowship!
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFormStatus(null)
                          setView('menu')
                        }}
                        className="mt-6 inline-flex rounded-full bg-[#0095ff] px-6 py-2 text-xs font-bold text-white hover:bg-[#0080e0]"
                      >
                        Return to Next Steps
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleConnectSubmit} className="space-y-3 my-auto">
                      <p className="text-xs text-slate-300">
                        First time at ECCF, or visiting campus? Let us connect with you!
                      </p>

                      {formStatus?.error && (
                        <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
                          {formStatus.error}
                        </div>
                      )}

                      <div>
                        <input
                          name="fullName"
                          type="text"
                          required
                          placeholder="Your Full Name *"
                          className="w-full rounded-xl bg-[#233138] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
                        />
                      </div>

                      <div>
                        <input
                          name="phoneNumber"
                          type="tel"
                          required
                          placeholder="WhatsApp Phone Number *"
                          className="w-full rounded-xl bg-[#233138] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          name="department"
                          type="text"
                          placeholder="Department (e.g. Med)"
                          className="w-full rounded-xl bg-[#233138] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
                        />
                        <input
                          name="level"
                          type="text"
                          placeholder="Level (e.g. 100L)"
                          className="w-full rounded-xl bg-[#233138] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          name="hall"
                          type="text"
                          placeholder="Hostel / Hall"
                          className="w-full rounded-xl bg-[#233138] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
                        />
                        <input
                          name="roomNumber"
                          type="text"
                          placeholder="Room No."
                          className="w-full rounded-xl bg-[#233138] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={formLoading}
                        className="w-full py-3 rounded-2xl bg-[#0095ff] hover:bg-[#0080e0] font-bold text-white text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                      >
                        {formLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            Submit Connect Card
                          </>
                        )}
                      </button>

                      <p className="text-[10px] text-center text-slate-400 pt-1">
                        Need welfare or prayer?{' '}
                        <Link
                          href="/connect"
                          onClick={() => setIsOpen(false)}
                          className="text-sky-400 underline"
                        >
                          Open Full Connect Page
                        </Link>
                      </p>
                    </form>
                  )}
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* VIEW: MORE NEXT STEPS                                */}
              {/* ---------------------------------------------------- */}
              {view === 'more-steps' && (
                <div className="flex flex-col flex-1 py-1">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                    <button
                      type="button"
                      onClick={() => setView('menu')}
                      className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                      All Next Steps
                    </span>
                  </div>

                  <div className="space-y-2 my-auto">
                    <Link
                      href="/#visit"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#233138] hover:bg-[#2b3c45] border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-sky-400" />
                        <span className="text-xs font-bold text-white">Plan A Campus Visit</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Sundays 8am</span>
                    </Link>

                    <Link
                      href="/connect"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#233138] hover:bg-[#2b3c45] border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="h-4 w-4 text-rose-400" />
                        <span className="text-xs font-bold text-white">Prayer & Welfare Request</span>
                      </div>
                      <span className="text-[10px] text-slate-400">We Care</span>
                    </Link>

                    <Link
                      href="/sermons"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#233138] hover:bg-[#2b3c45] border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <Radio className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">Spotify & YouTube Podcasts</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Audio/Video</span>
                    </Link>

                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#233138] hover:bg-[#2b3c45] border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">Worker & Exco Portal</span>
                      </div>
                      <span className="text-[10px] text-slate-400">CRM</span>
                    </Link>
                  </div>
                </div>
              )}



            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* FLOATING ACTION TRIGGER BUTTON (Bottom-Right)              */}
      {/* Closed: Circular button with Footprints icon (Formula 4)    */}
      {/* Open: Circular close 'X' button just like FBNO screenshot  */}
      {/* ========================================================== */}
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        aria-label={isOpen ? 'Close Next Steps' : 'Open Next Steps'}
        aria-expanded={isOpen}
        className={
          isOpen
            ? 'h-12 w-12 rounded-full bg-[#182329] border border-white/20 text-white flex items-center justify-center shadow-2xl shadow-black/60 hover:bg-[#22323a] transition-all'
            : 'h-12 w-12 rounded-full bg-[#0095ff] hover:bg-[#0080e0] text-white flex items-center justify-center shadow-xl shadow-sky-500/35 border border-white/20 transition-all duration-300'
        }
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Footprints className="h-6 w-6 text-white" />
        )}
      </motion.button>
    </div>
  )
}
