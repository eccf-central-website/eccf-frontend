/**
 * TeamsSection — Our Teams & Fellowship Life
 *
 * Adheres to Section 2.5 of UI/UX Brief and CLAUDE.md naming rules (using `team`):
 * Operational Teams: Choir, Drama (Thespians), Prayer, Ushering & Protocol, Media & Technical.
 * Includes interactive spotlight cards and integrated student fellowship photo stream.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Maximize2, X, Camera, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const fellowshipTeams = [
  {
    name: 'Choir Team',
    role: 'Worship Ministry',
    description: 'Leading the congregation into divine atmospheres of anointed praise and intimate worship during all services.',
    image: '/gallery/gallery-1.jpg',
    tag: 'VOCALS & INSTRUMENTS',
  },
  {
    name: 'Drama (Thespians)',
    role: 'Creative Arts',
    description: 'Preaching the Gospel through inspiring stage plays, spoken word, and creative theatrical productions.',
    image: '/gallery/gallery-4.jpg',
    tag: 'STAGE & DRAMA',
  },
  {
    name: 'Prayer Team',
    role: 'Intercessory Ministry',
    description: 'Interceding continuously for the university campus, spiritual awakening, and student academic victories.',
    image: '/gallery/gallery-2.jpg',
    tag: 'INTERCESSION',
  },
  {
    name: 'Ushering & Protocol',
    role: 'Hospitality & Order',
    description: 'Welcoming members and guests with warmth while maintaining order, comfort, and hospitality in God’s house.',
    image: '/gallery/gallery-5.jpg',
    tag: 'HOSPITALITY',
  },
  {
    name: 'Media & Technical',
    role: 'Digital Outreach',
    description: 'Capturing live audio/video streams, podcast syndication, sound engineering, and campus digital outreach.',
    image: '/gallery/gallery-6.jpg',
    tag: 'SOUND & MEDIA',
  },
]

const galleryMoments = [
  { src: '/gallery/gallery-3.jpg', title: 'Word Exposition & Study', category: 'Wednesday Service' },
  { src: '/gallery/gallery-7.jpg', title: 'Kingdom Leadership Council', category: 'Exco Roster' },
  { src: '/gallery/gallery-8.jpg', title: 'Student Life & Fellowship', category: 'Campus Moments' },
  { src: '/gallery/gallery-9.jpg', title: 'Campus Evangelism Outreach', category: 'Evangelism' },
]

export default function TeamsSection() {
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string; category: string } | null>(null)

  return (
    <section className="py-24 bg-[#fafafa] border-t border-slate-200/60 relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-[#0095ff] uppercase mb-2">
              <Users className="h-4 w-4 text-[#0095ff]" />
              <span>FELLOWSHIP OPERATIONAL TEAMS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Find Your Place to Serve & Lead
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-600 leading-relaxed font-normal">
            Every university student has a God-given gift. Connect with one of our operational teams to build lifelong leadership and ministry skills.
          </p>
        </div>

        {/* 5-Column Grid with Spotlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fellowshipTeams.map((team, idx) => (
            <motion.div
              key={team.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -6 }}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-2 shadow-sm hover:shadow-xl hover:shadow-sky-500/10 transition-all"
            >
              <div>
                {/* Photo with Overlay */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-2xl bg-slate-100">
                  <Image
                    src={team.image}
                    alt={team.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10">
                      {team.tag}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="text-[11px] font-bold text-sky-300 block uppercase tracking-wider">
                      {team.role}
                    </span>
                    <h3 className="text-xl font-black text-white leading-tight">
                      {team.name}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <div className="p-5">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {team.description}
                  </p>
                </div>
              </div>

              {/* Bottom Join Action */}
              <div className="p-4 pt-0 border-t border-slate-100/80 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">Open to all students</span>
                <Link
                  href="#visit"
                  className="inline-flex items-center gap-1 text-xs font-black text-[#0095ff] group-hover:text-sky-700 transition-colors"
                >
                  <span>Join Team</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Integrated Fellowship Moments Photo Stream */}
        <div className="mt-20 border-t border-slate-200/80 pt-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-[#0095ff] uppercase mb-1">
                <Camera className="h-4 w-4 text-[#0095ff]" />
                <span>FELLOWSHIP LIFE</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Moments in God&apos;s Presence
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Click photo to zoom</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {galleryMoments.map((img, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedImage(img)}
                className="group relative h-28 sm:h-44 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm cursor-pointer"
              >
                <Image
                  src={img.src}
                  alt={img.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="h-5 w-5 text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-2xl"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors backdrop-blur-md"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative h-[320px] sm:h-[480px] w-full bg-slate-100">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="p-6 bg-white flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#0095ff]">
                    {selectedImage.category}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedImage.title}
                  </h3>
                </div>
                <div className="text-xs font-bold text-slate-400">
                  Edo State University Christian Campus Fellowship
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
