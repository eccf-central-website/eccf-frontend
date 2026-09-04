/**
 * WhoWeAreSection — Client Component
 *
 * Implements Section 2.2 of SDD & CLAUDE.md guidelines.
 * Displays the Dual Mandate (Spiritual Dynamites & Academic Giants)
 * with dynamic photo collage from live Sanity gallery.
 */

'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

interface Props {
  photo1?: string
  photo2?: string
}

export default function WhoWeAreSection({
  photo1 = '/gallery/gallery-1.jpg',
  photo2 = '/gallery/gallery-2.jpg',
}: Props) {
  return (
    <section id="about" className="py-14 sm:py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
          
          {/* Left Column: The Dual Mandate */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5 }}
            className="md:col-span-7 space-y-4 sm:space-y-6"
          >
            <div>
              <span className="text-xs font-black tracking-widest text-[#0077cc] uppercase block mb-2 font-mono">
                WHO WE ARE
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                Raised for Kingdom Impact & Academic Distinction.
              </h2>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal">
                ECCF exists to eliminate the false divide between spiritual fervency and academic excellence. We empower students to walk in the fullness of the Holy Spirit while attaining top academic honors.
              </p>
            </div>

            {/* Numbered Core Pillars — Open Editorial Stream */}
            <div className="divide-y divide-slate-100 pt-1 sm:pt-2">
              {[
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
              ].map((pillar, idx) => (
                <motion.div
                  key={pillar.num}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="flex items-start gap-3.5 sm:gap-4 py-3.5 sm:py-5 group"
                >
                  <span className="text-xs sm:text-sm font-black text-[#0077cc] font-mono pt-0.5 tracking-wider shrink-0">
                    {pillar.num}
                  </span>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#0077cc] transition-colors">
                      {pillar.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-normal">
                      {pillar.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Dynamic Student Moments Collage */}
          <div className="md:col-span-5 grid grid-cols-2 gap-2.5 sm:gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.03 }}
              className="relative h-44 xs:h-48 sm:h-60 md:h-68 lg:h-76 w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm bg-slate-100"
            >
              <Image
                src={photo1}
                alt="Worship at ECCF"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="relative h-44 xs:h-48 sm:h-60 md:h-68 lg:h-76 w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm mt-3 sm:mt-8 bg-slate-100"
            >
              <Image
                src={photo2}
                alt="Student Prayer Session"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}