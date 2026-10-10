/**
 * AboutHistory — Fellowship History & Heritage (TPUSA Narrative + Milestone Timeline)
 *
 * Implements:
 * - Editorial story of ECCF's founding and campus calling
 * - Chronological milestones timeline matching TPUSA's bold milestone cards
 * - Distinctive dual-mandate quote card
 */

'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { History, CheckCircle2, Milestone } from 'lucide-react'

const MILESTONES = [
  {
    year: '2016',
    title: 'Founding Prayer Altars',
    desc: 'The pioneer Christian students at Edo State University (EDSU/ESUI), Iyamho, began gathering in intimate prayer and fellowship circles, laying the spiritual altar for campus revival.',
    badge: 'GENESIS',
  },
  {
    year: '2018',
    title: 'Operational Wings & Ministry Teams',
    desc: 'Formation of structured service teams — launching the Choir, Ushering, Welfare, and peer-led Academic tutorial network to support growing student admissions.',
    badge: 'EXPANSION',
  },
  {
    year: '2021',
    title: 'Central Student Governing Body (CSGB)',
    desc: 'Adoption of the official ECCF Constitution and creation of the CSGB executive council, standardizing leadership succession and inter-departmental operations.',
    badge: 'GOVERNANCE',
  },
  {
    year: '2023',
    title: 'Residence Hall Cell Network (Halls 1 to 8)',
    desc: 'Fellowship presence decentralized into all 8 campus hostels. Hall Representatives appointed to organize weekly cell prayers, welfare check-ins, and fresher onboarding.',
    badge: 'COMMUNITY',
  },
  {
    year: 'Today',
    title: 'Raising Global Kingdom Ambassadors',
    desc: 'Hundreds of active workers, 14 operational teams, weekly livestreams, and alumni making significant impacts in medicine, engineering, law, technology, and ministry nationwide.',
    badge: 'THE HORIZON',
  },
]

export default function AboutHistory() {
  return (
    <section id="story" className="py-16 sm:py-24 bg-white relative overflow-hidden border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-left max-w-3xl mb-12 sm:mb-16"
        >
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-widest text-[#0077cc] uppercase font-mono mb-3">
            <History className="h-4 w-4" />
            OUR STORY &amp; HERITAGE
          </span>
          <h2 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-tight">
            A Spiritual Altar &amp; Academic Haven on Campus.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
            From humble campus prayer meetings in Iyamho to a thriving university-wide spiritual powerhouse, the journey of Edo State University Christian Campus Fellowship is a testament to God&apos;s unfailing faithfulness.
          </p>
        </motion.div>

        {/* Narrative & Visual Story Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center mb-16 sm:mb-24">
          
          {/* Left Text Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-5 text-slate-700 text-base sm:text-lg leading-relaxed"
          >
            <p>
              When Edo State University was founded, Christian students recognized the urgent need for a spiritual sanctuary &mdash; an atmosphere where tertiary education would not diminish faith, but where faith would invigorate first-class scholarship.
            </p>

            <p>
              Starting as a small circle of believers gathering between lectures, the fellowship quickly grew into a non-denominational spiritual home. We embraced a singular dual mandate: <strong className="text-slate-950 font-semibold">to raise Spiritual Dynamites who burn with prayer and holiness, and Academic Giants who lead the dean&apos;s honor lists</strong>.
            </p>

            {/* Pull Quote Card */}
            <div className="my-6 p-6 rounded-2xl bg-[#fafaf9] border-l-4 border-[#0095ff] border-y border-r border-stone-200">
              <p className="font-serif italic text-lg sm:text-xl text-slate-950 leading-snug">
                &ldquo;We firmly rejected the campus lie that you must choose between God and good grades. Daniel prayed three times a day, yet had an excellent spirit ten times better than his peers.&rdquo;
              </p>
            </div>

            <p>
              Today, ECCF is structured to touch every dimension of student life: from spiritual growth and character formation to exam bootcamps, career guidance, and mutual welfare support across all eight halls of residence.
            </p>
          </motion.div>

          {/* Right Dual-Photo Collage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 grid grid-cols-2 gap-4"
          >
            <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-md bg-stone-100">
              <Image
                src="/gallery/gallery-2.jpg"
                alt="Worship and Prayer at ECCF"
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
            <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-md bg-stone-100 mt-6">
              <Image
                src="/gallery/gallery-3.jpg"
                alt="Student Community at Edo State University"
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
          </motion.div>

        </div>

        {/* TPUSA-Style Chronological Milestones Timeline */}
        <div className="pt-10 border-t border-stone-200">
          <div className="flex items-center gap-2 mb-8">
            <Milestone className="h-5 w-5 text-[#0095ff]" />
            <h3 className="font-serif font-bold text-2xl sm:text-3xl text-slate-950 tracking-tight">
              Fellowship Milestones &amp; Journey
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {MILESTONES.map((item, idx) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-[#fafaf9] border border-stone-200 hover:border-[#0077cc]/40 hover:bg-white shadow-2xs hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-serif font-black text-2xl sm:text-3xl text-[#0095ff]">
                      {item.year}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-[#0077cc]">
                      {item.badge}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-base sm:text-lg text-slate-950 mb-2 leading-tight">
                    {item.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 group-hover:text-[#0077cc] transition-colors">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verified History</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
