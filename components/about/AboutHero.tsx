/**
 * AboutHero — Turning Point USA-inspired High-Energy Mission Hero
 *
 * Features:
 * - Bold, authoritative editorial typography with high-contrast accenting
 * - Core Mission Manifesto callout
 * - High-impact 4-metric stat bar
 * - Quick-jump sticky anchor navigation rail to smoothly browse the page
 */

'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowDown, Flame, Compass } from 'lucide-react'

export interface AboutHeroProps {
  badge?: string
  subheading?: string
  headline?: string
  subtitle?: string
  missionCreed?: string
  heroImage?: string | null
  stats?: {
    operationalTeams?: string | null
    residenceHalls?: string | null
    weeklyEncounters?: string | number | null
    studentImpact?: string | null
    // Fallback props
    activeMembers?: string | number | null
    weeklyServices?: string | number | null
    campusLegacy?: string | number | null
  } | null
}

const NAV_ANCHORS = [
  { label: 'Our Story', href: '#story' },
  { label: 'Core Mandate', href: '#pillars' },
  { label: 'Executive Leadership', href: '#leadership' },
  { label: 'Operational Units', href: '#teams' },
  { label: 'Get Involved', href: '#get-involved' },
]

export default function AboutHero({
  badge,
  subheading,
  headline,
  subtitle,
  missionCreed,
  heroImage,
  stats,
}: AboutHeroProps) {
  const primaryPhoto = heroImage || '/gallery/gallery-1.jpg'

  return (
    <section className="relative w-full bg-[#fcfbf9] border-b border-stone-200 pt-8 sm:pt-14 pb-12 sm:pb-16 overflow-hidden">
      {/* Subtle background ambient blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        
        {/* Top Tag & Category */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-4 sm:mb-6"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-bold uppercase tracking-widest text-[#0077cc]">
            <Flame className="w-3.5 h-3.5 text-[#0095ff]" />
            {badge || 'About ECCF'}
          </span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest hidden sm:inline-block">
            {subheading || 'Edo State University Iyamho'}
          </span>
        </motion.div>

        {/* Hero Headline & Manifesto Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Left Column: Bold Headline & Manifesto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-7 space-y-5 sm:space-y-6 text-left"
          >
            <h1 className="font-serif font-black text-3xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] text-slate-950 tracking-tight leading-[1.08] text-balance">
              {headline ? (
                <span>{headline}</span>
              ) : (
                <>
                  Raising <span className="text-[#0077cc]">Spiritual Dynamites</span> &amp; Academic Giants.
                </>
              )}
            </h1>

            <p className="text-base sm:text-xl text-slate-700 leading-relaxed font-normal max-w-2xl">
              {subtitle ||
                'We are the non-denominational student family on the campus of Edo State University (EDSU/ESUI), dedicated to eliminating the false compromise between spiritual power and first-class scholarship.'}
            </p>

            {/* Mission Manifesto Card (TPUSA Style) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#0095ff]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0077cc] block mb-1">
                OUR CORE CREED &amp; MISSION
              </span>
              <blockquote className="text-sm sm:text-base font-serif italic text-slate-900 leading-snug">
                &ldquo;{missionCreed ||
                  'To empower university students to walk in the fullness of the Holy Spirit, demonstrate Christ-like character in every residence hall, and graduate with unmatched intellectual excellence.'}&rdquo;
              </blockquote>
            </div>
          </motion.div>

          {/* Right Column: Hero Visual with Overlays */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative h-[280px] sm:h-[380px] lg:h-[440px] w-full rounded-3xl overflow-hidden shadow-xl shadow-slate-900/10 border border-stone-200 bg-stone-100">
              <Image
                src={primaryPhoto}
                alt="ECCF Fellowship at Edo State University"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 inline-block mb-1.5">
                  CAMPUS REVIVAL &amp; SCHOLARSHIP
                </span>
                <p className="font-serif text-lg sm:text-xl font-bold leading-tight">
                  One Family Across All 8 Halls of Residence
                </p>
              </div>
            </div>
          </motion.div>

        </div>

        {/* TPUSA-Style Metric Impact Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
        >
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs text-left">
            <span className="text-2xl sm:text-4xl font-black text-slate-950 font-serif block">
              {stats?.operationalTeams || '14'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#0077cc] uppercase tracking-wider block mt-0.5">
              Operational Teams
            </span>
            <p className="text-xs text-slate-500 mt-1 font-normal hidden sm:block">
              Dedicated service and ministry wings
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs text-left">
            <span className="text-2xl sm:text-4xl font-black text-slate-950 font-serif block">
              {stats?.residenceHalls || '8'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#0077cc] uppercase tracking-wider block mt-0.5">
              Residence Halls
            </span>
            <p className="text-xs text-slate-500 mt-1 font-normal hidden sm:block">
              Active fellowship cells &amp; hall reps
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs text-left">
            <span className="text-2xl sm:text-4xl font-black text-slate-950 font-serif block">
              {stats?.weeklyEncounters || stats?.weeklyServices || '3'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#0077cc] uppercase tracking-wider block mt-0.5">
              Weekly Encounters
            </span>
            <p className="text-xs text-slate-500 mt-1 font-normal hidden sm:block">
              Sunday Glory, Bible Study, Exco watches
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs text-left">
            <span className="text-2xl sm:text-4xl font-black text-slate-950 font-serif block">
              {stats?.studentImpact || '100%'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#0077cc] uppercase tracking-wider block mt-0.5">
              Student-Led Impact
            </span>
            <p className="text-xs text-slate-500 mt-1 font-normal hidden sm:block">
              Governed by the Central Governing Body
            </p>
          </div>
        </motion.div>

        {/* TPUSA-Style Quick Jump Anchor Rail */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 sm:mt-10 pt-6 border-t border-stone-200/80 flex items-center justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Compass className="h-4 w-4 text-[#0095ff]" />
            <span>Explore Page:</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {NAV_ANCHORS.map((anchor) => (
              <a
                key={anchor.href}
                href={anchor.href}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-700 hover:text-[#0077cc] border border-stone-200 transition-colors shadow-2xs inline-flex items-center gap-1"
              >
                <span>{anchor.label}</span>
                <ArrowDown className="h-3 w-3 opacity-60" />
              </a>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
