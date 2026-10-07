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

import { useState } from 'react'
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

export default function WhoWeAreSection({ photo1, photo2 }: Props) {
  const p1 = photo1 || '/gallery/gallery-1.jpg'
  const p2 = photo2 || '/gallery/gallery-2.jpg'
  const [showAll, setShowAll] = useState(false)

  return (
    <section id="about" className="w-full bg-[#fcfbf9] border-b border-stone-200 py-12 lg:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-20 items-center">
          {/* LEFT COLUMN: Editorial Typography & Content */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-center text-center lg:text-left items-center lg:items-start"
          >
            <span className="text-xs sm:text-sm font-bold tracking-widest text-[#0077cc] uppercase mb-4 block text-center lg:text-left">
              Who We Are
            </span>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] text-slate-950 tracking-tight leading-[1.16] mb-6 text-center lg:text-left text-balance break-words">
              Raised for Kingdom Impact & Academic Distinction.
            </h2>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal max-w-xl mb-6 text-center lg:text-left mx-auto lg:mx-0 line-clamp-4">
              ECCF exists to eliminate the false divide between spiritual fervency and academic excellence. We empower students to walk in the fullness of the Holy Spirit while attaining top academic honors.
            </p>
            {/* Pillars */}
            <div className="flex flex-col gap-2 w-full text-left">
              {pillars.map((pillar, idx) => (
                <motion.div
                  key={pillar.num}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="flex items-start gap-4 sm:gap-6 py-2 sm:py-3 group"
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
            {/* Toggle button */}
            <button
              type="button"
              onClick={() => setShowAll(prev => !prev)}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0095ff] px-6 py-2 text-sm font-bold text-white hover:bg-[#0080e0] transition-colors"
            >
              {showAll ? 'Show Less' : 'View All'}
            </button>
          </motion.div>

          {/* RIGHT COLUMN: Photos */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4 sm:gap-6 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-[280px] sm:h-[360px] lg:h-[420px] w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg shadow-black/5 bg-stone-200"
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
            {showAll && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="relative h-[280px] sm:h-[360px] lg:h-[420px] w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg shadow-black/5 mt-6 sm:mt-10 bg-stone-200"
              >
                <Image
                  src={p2}
                  alt="Student Fellowship at Edo State University"
                  fill
                  sizes="(max-width: 1024px) 50vw, 35vw"
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}