/**
 * AboutHistory — Fellowship History & Heritage
 *
 * Implements:
 * - Editorial story of ECCF's founding and campus calling
 * - Redesigned, expansive milestone timeline with background imagery & large legible typography
 * - Distinctive dual-mandate quote card
 * - Fully mobile-first: large fonts, zero eye strain, rich contrast
 */

'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { History, Milestone } from 'lucide-react'

export interface MilestoneItem {
  _key?: string
  year: string
  badge: string
  title: string
  desc: string
  bgImage?: string
}

export interface AboutHistoryProps {
  headline?: string
  lead?: string
  paragraphs?: string[] | null
  quote?: string
  photo1?: string | null
  photo2?: string | null
  milestones?: MilestoneItem[] | null
}

const DEFAULT_MILESTONES: MilestoneItem[] = [
  {
    year: '2016',
    title: 'Founding Prayer Altars',
    desc: 'The pioneer Christian students at Edo State University (EDSU/ESUI), Iyamho, began gathering in intimate prayer and fellowship circles, laying the spiritual altar for campus revival.',
    badge: 'GENESIS',
    bgImage: '/gallery/gallery-2.jpg',
  },
  {
    year: '2018',
    title: 'Operational Wings & Ministry Teams',
    desc: 'Formation of structured service teams — launching the Choir, Ushering, Welfare, and peer-led Academic tutorial network to support growing student admissions.',
    badge: 'EXPANSION',
    bgImage: '/gallery/gallery-1.jpg',
  },
  {
    year: '2021',
    title: 'Central Student Governing Body (CSGB)',
    desc: 'Adoption of the official ECCF Constitution and creation of the CSGB executive council, standardizing leadership succession and inter-departmental operations.',
    badge: 'GOVERNANCE',
    bgImage: '/gallery/gallery-5.jpg',
  },
  {
    year: '2023',
    title: 'Residence Hall Cell Network (Halls 1 to 8)',
    desc: 'Fellowship presence decentralized into all 8 campus hostels. Hall Representatives appointed to organize weekly cell prayers, welfare check-ins, and fresher onboarding.',
    badge: 'COMMUNITY',
    bgImage: '/gallery/gallery-7.jpg',
  },
  {
    year: 'Today',
    title: 'Raising Global Kingdom Ambassadors',
    desc: 'Hundreds of active workers, 14 operational teams, weekly livestreams, and alumni making significant impacts in medicine, engineering, law, technology, and ministry nationwide.',
    badge: 'THE HORIZON',
    bgImage: '/gallery/gallery-10.jpg',
  },
]

export default function AboutHistory({
  headline,
  lead,
  paragraphs,
  quote,
  photo1,
  photo2,
  milestones,
}: AboutHistoryProps) {
  const p1 = photo1 || '/gallery/gallery-2.jpg'
  const p2 = photo2 || '/gallery/gallery-3.jpg'
  const activeMilestones =
    milestones && milestones.length > 0
      ? milestones.map((m, idx) => ({
          ...m,
          bgImage:
            m.bgImage ||
            DEFAULT_MILESTONES[idx % DEFAULT_MILESTONES.length].bgImage,
        }))
      : DEFAULT_MILESTONES

  return (
    <section id="story" className="py-14 sm:py-24 bg-white relative overflow-hidden border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-left max-w-3xl mb-10 sm:mb-16"
        >
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-widest text-[#0077cc] uppercase font-mono mb-3">
            <History className="h-4 w-4" />
            OUR STORY &amp; HERITAGE
          </span>
          <h2 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-tight">
            {headline || 'A Spiritual Altar & Academic Haven on Campus.'}
          </h2>
          <p className="mt-4 text-base sm:text-xl text-slate-700 leading-relaxed font-normal">
            {lead ||
              "From humble campus prayer meetings in Iyamho to a thriving university-wide spiritual powerhouse, the journey of Edo State University Christian Campus Fellowship is a testament to God's unfailing faithfulness."}
          </p>
        </motion.div>

        {/* Narrative & Visual Story Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center mb-14 sm:mb-24">
          
          {/* Left Text Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-5 text-slate-700 text-base sm:text-xl leading-relaxed"
          >
            {paragraphs && paragraphs.length > 0 ? (
              paragraphs.map((p, idx) => <p key={idx}>{p}</p>)
            ) : (
              <>
                <p>
                  When Edo State University was founded, Christian students recognized the urgent need for a spiritual sanctuary &mdash; an atmosphere where tertiary education would not diminish faith, but where faith would invigorate first-class scholarship.
                </p>

                <p>
                  Starting as a small circle of believers gathering between lectures, the fellowship quickly grew into a non-denominational spiritual home. We embraced a singular dual mandate: <strong className="text-slate-950 font-bold">to raise Spiritual Dynamites who burn with prayer and holiness, and Academic Giants who lead the dean&apos;s honor lists</strong>.
                </p>
              </>
            )}

            {/* Pull Quote Card */}
            <div className="my-6 p-6 sm:p-7 rounded-2xl bg-[#fafaf9] border-l-4 border-[#0095ff] border-y border-r border-stone-200">
              <p className="font-serif italic text-lg sm:text-2xl text-slate-950 leading-snug">
                &ldquo;{quote ||
                  'We firmly rejected the campus lie that you must choose between God and good grades. Daniel prayed three times a day, yet had an excellent spirit ten times better than his peers.'}&rdquo;
              </p>
            </div>

            {(!paragraphs || paragraphs.length <= 2) && (
              <p>
                Today, ECCF is structured to touch every dimension of student life: from spiritual growth and character formation to exam bootcamps, career guidance, and mutual welfare support across all eight halls of residence.
              </p>
            )}
          </motion.div>

          {/* Right Dual-Photo Collage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4"
          >
            <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-stone-100">
              <Image
                src={p1}
                alt="Worship and Prayer at ECCF"
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-stone-100 mt-6">
              <Image
                src={p2}
                alt="Student Community at Edo State University"
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
          </motion.div>

        </div>

        {/* ================================================================ */}
        {/* BIGGER & BETTER MILESTONES: Engaging Cards with Rich Photography */}
        {/* ================================================================ */}
        <div className="pt-10 sm:pt-14 border-t border-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Milestone className="h-5 w-5 text-[#0095ff]" />
                <span className="text-xs sm:text-sm font-bold tracking-widest text-[#0077cc] uppercase font-mono">
                  CHRONOLOGICAL JOURNEY
                </span>
              </div>
              <h3 className="font-serif font-black text-2xl sm:text-4xl text-slate-950 tracking-tight">
                Fellowship Milestones &amp; History
              </h3>
            </div>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">
              A decade of raising leaders on campus
            </span>
          </div>

          {/* Mobile swipe rail / Desktop 2-and-3 column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {activeMilestones.map((item, idx) => (
              <motion.div
                key={item.year + (item.title || '') + idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className={`group relative overflow-hidden rounded-3xl min-h-[300px] sm:min-h-[340px] flex flex-col justify-between p-6 sm:p-8 bg-slate-950 text-white shadow-lg shadow-black/10 transition-all ${
                  idx === 0 ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                {/* Background Image with Cinematic Dark Overlay */}
                {item.bgImage && (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={item.bgImage}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover opacity-35 group-hover:scale-105 group-hover:opacity-45 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40" />
                  </div>
                )}

                {/* Top: Large Year & Glowing Badge */}
                <div className="relative z-10 flex items-start justify-between gap-3 mb-6">
                  <div>
                    <span className="font-serif font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight block drop-shadow-sm">
                      {item.year}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-white/15 backdrop-blur-md text-sky-300 border border-white/20 shadow-xs">
                    {item.badge}
                  </span>
                </div>

                {/* Bottom: Large Title & Generous Readable Description */}
                <div className="relative z-10 space-y-2.5">
                  <h4 className="font-serif font-bold text-xl sm:text-2xl text-white leading-snug tracking-tight">
                    {item.title}
                  </h4>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
