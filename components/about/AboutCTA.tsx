/**
 * AboutCTA — TPUSA-Inspired High-Impact Action Section
 *
 * Implements:
 * - High-energy, contrast-rich call-to-action banner
 * - Direct paths: Join a Team (/register), Connect & Welfare (/connect), Plan a Visit (/#visit)
 * - Residence hall reach reinforcement (Halls 1 to 8)
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, UserPlus, HeartHandshake, MapPin, ArrowRight } from 'lucide-react'

export interface AboutCTAProps {
  tag?: string
  headline?: string
  subtitle?: string
}

export default function AboutCTA({ tag, headline, subtitle }: AboutCTAProps) {
  const cleanHeadline = headline
    ? headline.replace(/at Edo State University/gi, 'at ECCF')
    : 'Step Into Your God-Given Purpose at ECCF.'

  return (
    <section id="get-involved" className="py-16 sm:py-24 bg-slate-950 text-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0095ff]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 relative z-10 text-center">
        
        {/* Top Tag */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-bold uppercase tracking-widest text-sky-400 mb-6"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{tag || 'JOIN THE MOVEMENT ON CAMPUS'}</span>
        </motion.div>

        {/* Big Authoritative Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-serif font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] max-w-4xl mx-auto text-balance"
        >
          {cleanHeadline}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal"
        >
          {subtitle ||
            'Whether you want to join an operational team, need academic guidance and student welfare, or are planning your very first visit — we are ready to welcome you home.'}
        </motion.p>

        {/* Action Button Grid — Redesigned for crisp typography, aligned icons & zero awkward wrapping */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-4xl mx-auto w-full"
        >
          <Link
            href="/register"
            className="group w-full max-w-xs sm:max-w-none sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] hover:from-[#0066b3] hover:to-[#0080e0] text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
          >
            <UserPlus className="h-5 w-5 text-sky-100 shrink-0" />
            <span>Join an Operational Team</span>
            <ArrowRight className="h-4 w-4 text-sky-200 transition-transform duration-200 group-hover:translate-x-1 shrink-0 ml-0.5" />
          </Link>

          <Link
            href="/connect"
            className="group w-full max-w-xs sm:max-w-none sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-semibold text-sm sm:text-base border border-slate-700/80 hover:border-slate-600 shadow-md backdrop-blur-md transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
          >
            <HeartHandshake className="h-5 w-5 text-sky-400 shrink-0" />
            <span>Connect &amp; Welfare Care</span>
          </Link>

          <Link
            href="/#visit"
            className="group w-full max-w-xs sm:max-w-none sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-slate-900/50 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm sm:text-base border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
          >
            <MapPin className="h-5 w-5 text-amber-400 shrink-0" />
            <span>Plan a Visit</span>
          </Link>
        </motion.div>

        {/* Bottom Hall Coverage Pill */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-400 font-mono">
          <span>Active Across All Campus Hostels: Hall 1 &bull; Hall 2 &bull; Hall 3 &bull; Hall 4 &bull; Hall 5 &bull; Hall 6 &bull; Hall 7 &bull; Hall 8</span>
        </div>

      </div>
    </section>
  )
}
