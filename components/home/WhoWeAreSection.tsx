/**
 * WhoWeAreSection — Formula 4 Editorial Style
 *
 * Redesigned to match the current theme:
 * - Edge-to-edge alignment (px-6 sm:px-8 lg:px-12) matching Navbar & Hero
 * - Finer editorial serif typography (Playfair Display) with larger, legible font sizes
 * - Substantial, tall photography (up to 580px) giving presence and breathing room
 * - Soft off-white canvas with clean editorial dividers
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

interface Props {
  photo1?: string | null
  photo2?: string | null
}

const pillars = [
  {
    num: '01',
    title: 'Spiritual Dynamites',
    desc: 'Deep prayer, uncompromised scriptural doctrine, apostolic impartation, and practical holiness on campus.',
  },
  {
    num: '02',
    title: 'Academic Giants',
    desc: 'Rigorous study discipline, peer tutorial mentorship, intellectual diligence, and graduating at the top of every faculty.',
  },
  {
    num: '03',
    title: 'Kingdom Family & Community',
    desc: 'A loving, supportive brotherhood and sisterhood providing welfare assistance, encouragement, and lifelong Christian friendships.',
  },
]

export default function WhoWeAreSection({
  photo1,
  photo2,
}: Props) {
  const p1 = photo1 || '/gallery/gallery-1.jpg'
  const p2 = photo2 || '/gallery/gallery-2.jpg'

  return (
    <section id="about" className="w-full bg-[#fcfbf9] border-b border-stone-200 py-10 sm:py-14 lg:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 xl:gap-20 items-center">
          
          {/* ================================================================ */}
          {/* LEFT COLUMN: Editorial Typography & Dual Mandate                 */}
          {/* ================================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-center text-left items-start"
          >
            {/* Top Label */}
            <span className="text-xs sm:text-sm font-bold tracking-[0.2em] text-[#0077cc] uppercase mb-2.5 sm:mb-3 block text-left">
              Who We Are
            </span>

            {/* Headline — Finer editorial serif, prominent & bold */}
            <h2 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] text-slate-950 tracking-tight leading-[1.14] mb-3.5 sm:mb-5 text-left text-balance break-words">
              Raised for Kingdom Impact &amp; Academic Distinction.
            </h2>

            {/* Main paragraph — punchy, clear & readable */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-700 leading-relaxed font-normal max-w-xl mb-5 sm:mb-6 text-left">
              ECCF exists to eliminate the false divide between spiritual fervency and academic excellence, empowering university students to walk in the fullness of the Holy Spirit while graduating at the top of their faculties.
            </p>

            {/* Numbered Core Pillars — Compact horizontal swipe rail on mobile, vertical stream on desktop */}
            <div className="w-full">
              <div className="flex lg:flex-col gap-2.5 sm:gap-3 overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 snap-x scrollbar-none">
                {pillars.map((pillar, idx) => (
                  <motion.div
                    key={pillar.num}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="snap-start shrink-0 w-[82%] sm:w-[48%] lg:w-full rounded-2xl bg-white border border-stone-200/90 p-3.5 sm:p-4 shadow-2xs group hover:border-[#0077cc]/30 transition-all"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="font-serif text-sm sm:text-base font-bold text-[#0095ff] shrink-0">
                        {pillar.num}
                      </span>
                      <h4 className="font-serif text-base sm:text-lg font-bold text-slate-950 group-hover:text-[#0077cc] transition-colors leading-tight">
                        {pillar.title}
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {pillar.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="pt-3 w-full flex justify-start">
              <Link
                href="/#teams"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0077cc] hover:text-sky-800 transition-colors group"
              >
                <span>Explore Our Ministry Teams</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* ================================================================ */}
          {/* RIGHT COLUMN: Photography (Single wide photo on mobile, dual on desktop) */}
          {/* ================================================================ */}
          <div className="lg:col-span-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-center">
            {/* Photo 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-[220px] sm:h-[300px] lg:h-[420px] w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg shadow-black/5 bg-stone-200"
            >
              <Image
                src={p1}
                alt="Worship at Edo State University Christian Campus Fellowship"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 35vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </motion.div>

            {/* Photo 2 (Desktop only, staggered offset for editorial rhythm) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block h-[420px] w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg shadow-black/5 mt-10 bg-stone-200"
            >
              <Image
                src={p2}
                alt="Student Fellowship at Edo State University"
                fill
                sizes="35vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}