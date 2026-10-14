/**
 * AboutPillars — Core Values & Distinctives of ECCF
 *
 * Implements:
 * - The 3 foundational pillars of ECCF's dual mandate
 * - Scriptural anchors and practical applications
 * - TPUSA-style bold 3-column card grid with contrasting accent colors
 */

'use client'

import { motion } from 'framer-motion'
import { Sparkles, Flame, GraduationCap, HeartHandshake, Check } from 'lucide-react'

export interface PillarOverride {
  title?: string
  subtitle?: string
  scripture?: string
  desc?: string
  points?: string[] | null
}

export interface AboutPillarsProps {
  headline?: string
  lead?: string
  pillar1?: PillarOverride | null
  pillar2?: PillarOverride | null
  pillar3?: PillarOverride | null
}

const DEFAULT_PILLARS = [
  {
    num: '01',
    title: 'Spiritual Dynamites',
    subtitle: 'Apostolic Power & Holiness',
    scripture: 'Acts 1:8',
    icon: Flame,
    color: 'border-sky-500',
    accentBg: 'bg-sky-50 text-[#0077cc]',
    desc: 'Cultivating students who burn with uncompromised faith, apostolic prayer fervency, and practical holiness across lecture rooms and student hostels.',
    bulletPoints: [
      'Relentless personal and corporate intercession',
      'Uncompromised biblical doctrine and expository preaching',
      'Operating in spiritual gifts with humility and order',
      'Exemplary moral integrity and campus Christian witness',
    ],
  },
  {
    num: '02',
    title: 'Academic Giants',
    subtitle: 'Intellectual Rigor & Excellence',
    scripture: 'Daniel 1:17, 20',
    icon: GraduationCap,
    color: 'border-amber-500',
    accentBg: 'bg-amber-50 text-amber-700',
    desc: 'Destroying academic apathy and mediocrity. We believe the Spirit of God is a spirit of excellence that inspires top-tier scholarship.',
    bulletPoints: [
      'Departmental and faculty peer tutorial networks',
      'Pre-exam bootcamps, study halls, and past question vaults',
      'Mentorship for freshers and struggling students',
      'Targeting First Class honors across all colleges',
    ],
  },
  {
    num: '03',
    title: 'Kingdom Community',
    subtitle: 'Brotherhood, Welfare & Love',
    scripture: '1 Peter 4:10',
    icon: HeartHandshake,
    color: 'border-emerald-500',
    accentBg: 'bg-emerald-50 text-emerald-700',
    desc: 'A vibrant campus family where no student falls through the cracks. We provide practical welfare, emotional care, and lifelong kingdom friendships.',
    bulletPoints: [
      'Active hostel cell networks across Halls 1 through 8',
      'Confidential student welfare support and emergency food assistance',
      'Hospital visitation, health outreach, and emotional care',
      'Lifelong Christian alumni network and professional mentorship',
    ],
  },
]

export default function AboutPillars({
  headline,
  lead,
  pillar1,
  pillar2,
  pillar3,
}: AboutPillarsProps) {
  const pillars = [
    {
      ...DEFAULT_PILLARS[0],
      title: pillar1?.title || DEFAULT_PILLARS[0].title,
      subtitle: pillar1?.subtitle || DEFAULT_PILLARS[0].subtitle,
      scripture: pillar1?.scripture || DEFAULT_PILLARS[0].scripture,
      desc: pillar1?.desc || DEFAULT_PILLARS[0].desc,
      bulletPoints:
        pillar1?.points && pillar1.points.length > 0
          ? pillar1.points
          : DEFAULT_PILLARS[0].bulletPoints,
    },
    {
      ...DEFAULT_PILLARS[1],
      title: pillar2?.title || DEFAULT_PILLARS[1].title,
      subtitle: pillar2?.subtitle || DEFAULT_PILLARS[1].subtitle,
      scripture: pillar2?.scripture || DEFAULT_PILLARS[1].scripture,
      desc: pillar2?.desc || DEFAULT_PILLARS[1].desc,
      bulletPoints:
        pillar2?.points && pillar2.points.length > 0
          ? pillar2.points
          : DEFAULT_PILLARS[1].bulletPoints,
    },
    {
      ...DEFAULT_PILLARS[2],
      title: pillar3?.title || DEFAULT_PILLARS[2].title,
      subtitle: pillar3?.subtitle || DEFAULT_PILLARS[2].subtitle,
      scripture: pillar3?.scripture || DEFAULT_PILLARS[2].scripture,
      desc: pillar3?.desc || DEFAULT_PILLARS[2].desc,
      bulletPoints:
        pillar3?.points && pillar3.points.length > 0
          ? pillar3.points
          : DEFAULT_PILLARS[2].bulletPoints,
    },
  ]

  return (
    <section id="pillars" className="py-16 sm:py-24 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-left md:text-center max-w-3xl md:mx-auto mb-10 sm:mb-16"
        >
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-widest text-[#0077cc] uppercase font-mono mb-3">
            <Sparkles className="h-4 w-4" />
            CORE PILLARS &amp; MANDATE
          </span>
          <h2 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-tight">
            {headline || 'The Three Pillars That Define Us.'}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
            {lead ||
              'Everything we do in ECCF is anchored on these three pillars. They guide our Sunday services, weekly Bible studies, residence hall meetings, and daily campus living.'}
          </p>
        </motion.div>

        {/* 3-Column Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <motion.div
                key={pillar.num}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm hover:shadow-xl transition-all"
              >
                <div>
                  {/* Top Bar with Number and Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif font-black text-3xl sm:text-4xl text-[#0095ff]">
                      {pillar.num}
                    </span>
                    <div className={`p-3 rounded-2xl ${pillar.accentBg}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Header & Subtitle */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0077cc]">
                        {pillar.subtitle}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] font-mono font-semibold text-slate-400">
                        {pillar.scripture}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-2xl text-slate-950 leading-tight">
                      {pillar.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 font-normal">
                    {pillar.desc}
                  </p>

                  {/* Bullet points */}
                  <ul className="space-y-2.5 pt-4 border-t border-stone-100">
                    {pillar.bulletPoints.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <Check className="h-4 w-4 text-[#0095ff] shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
