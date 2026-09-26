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

import Image from 'next/image'
import { motion } from 'framer-motion'

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
    <section id="about" className="w-full bg-[#fcfbf9] border-b border-stone-200 py-20 lg:py-28 overflow-hidden">
      <div className="w-full px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-20 items-center">
          
          {/* ================================================================ */}
          {/* LEFT COLUMN: Editorial Typography & Dual Mandate                 */}
          {/* ================================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-center text-left"
          >
            {/* Top Label */}
            <span className="text-xs sm:text-sm font-bold tracking-widest text-[#0077cc] uppercase mb-4 block">
              Who We Are
            </span>

            {/* Headline — Finer editorial serif, prominent & bold */}
            <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] text-slate-950 tracking-tight leading-[1.16] mb-6">
              Raised for Kingdom Impact & Academic Distinction.
            </h2>

            {/* Main paragraph — larger, clear & readable */}
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal max-w-xl mb-10">
              ECCF exists to eliminate the false divide between spiritual fervency and academic excellence. We empower students to walk in the fullness of the Holy Spirit while attaining top academic honors.
            </p>

            {/* Numbered Core Pillars — Refined Editorial Stream */}
            <div className="divide-y divide-stone-200/80 border-t border-stone-200/80">
              {pillars.map((pillar, idx) => (
                <motion.div
                  key={pillar.num}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="flex items-start gap-4 sm:gap-6 py-5 sm:py-6 group"
                >
                  <span className="font-serif text-lg sm:text-xl font-bold text-[#0095ff] shrink-0 pt-0.5">
                    {pillar.num}
                  </span>
                  <div>
                    <h4 className="font-serif text-lg sm:text-xl font-bold text-slate-950 group-hover:text-[#0077cc] transition-colors leading-tight">
                      {pillar.title}
                    </h4>
                    <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed font-normal max-w-lg">
                      {pillar.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ================================================================ */}
          {/* RIGHT COLUMN: Substantial, Tall Dynamic Photography Collage      */}
          {/* ================================================================ */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4 sm:gap-6 items-center">
            {/* Photo 1 (Tall, Anchored) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-[360px] sm:h-[480px] lg:h-[560px] w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg shadow-black/5 bg-stone-200"
            >
              <Image
                src={p1}
                alt="Worship at Edo State University Christian Campus Fellowship"
                fill
                priority
                sizes="(max-width: 1024px) 50vw, 35vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </motion.div>

            {/* Photo 2 (Tall, Staggered offset for editorial rhythm) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-[360px] sm:h-[480px] lg:h-[560px] w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg shadow-black/5 mt-8 sm:mt-14 bg-stone-200"
            >
              <Image
                src={p2}
                alt="Student Fellowship at Edo State University"
                fill
                sizes="(max-width: 1024px) 50vw, 35vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}