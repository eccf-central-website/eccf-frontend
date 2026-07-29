/**
 * TeamsSection — Our Teams & Operational Units
 *
 * Implements Section 2.5 of the UI/UX Requirements Document.
 * Showcases Drama, Prayer, Choir, Ushering, and Media with photos and descriptions.
 */

'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'

const fellowshipTeams = [
  {
    name: 'Choir',
    description: 'Leading the congregation into divine atmospheres of praise and intimate worship.',
    image: '/gallery/gallery-1.jpg',
  },
  {
    name: 'Drama (Thespians)',
    description: 'Preaching the Gospel through inspiring stage plays, spoken word, and creative arts.',
    image: '/gallery/gallery-4.jpg',
  },
  {
    name: 'Prayer Unit',
    description: 'Interceding continuously for the campus, spiritual awakening, and student victories.',
    image: '/gallery/gallery-2.jpg',
  },
  {
    name: 'Ushering & Protocol',
    description: 'Welcoming members and guests with warmth while maintaining order and hospitality.',
    image: '/gallery/gallery-5.jpg',
  },
  {
    name: 'Media & Technical',
    description: 'Capturing live streams, sermon recordings, audio engineering, and digital outreach.',
    image: '/gallery/gallery-6.jpg',
  },
]

export default function TeamsSection() {
  return (
    <section className="py-24 border-t border-slate-200/60 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff] flex items-center justify-center gap-1.5 mb-1">
            <Users className="h-3.5 w-3.5 text-[#00a8ff]" />
            <span>FIND YOUR PLACE TO SERVE</span>
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Our Teams & Operational Units
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Every student has a God-given gift. Discover where your passion aligns with ministry and academic growth.
          </p>
        </div>

        {/* 5-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {fellowshipTeams.map((team, idx) => (
            <motion.div
              key={team.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-lg hover:shadow-sky-500/10 transition-all"
            >
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                <Image
                  src={team.image}
                  alt={team.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                <div className="absolute bottom-3 left-4 text-white font-bold text-lg">
                  {team.name}
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {team.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
