/**
 * TeamsSection — Integrated Teams, Operational Units & Fellowship Moments Gallery
 *
 * Showcases Choir, Drama, Prayer, Ushering, and Media with mobile-optimized photo dimensions,
 * clear typography, and integrated fellowship snapshot gallery.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Maximize2, X, Camera } from 'lucide-react'

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

const galleryMoments = [
  { src: '/gallery/gallery-3.jpg', title: 'Word Exposition', category: 'Bible Study' },
  { src: '/gallery/gallery-7.jpg', title: 'Kingdom Leadership', category: 'Exco Roster' },
  { src: '/gallery/gallery-8.jpg', title: 'Youthful Fellowship', category: 'Student Life' },
  { src: '/gallery/gallery-9.jpg', title: 'Campus Evangelism', category: 'Outreach' },
]

export default function TeamsSection() {
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string; category: string } | null>(null)

  return (
    <section className="py-16 sm:py-24 border-t border-slate-200/60 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff] flex items-center justify-center gap-1.5 mb-1">
            <Users className="h-3.5 w-3.5 text-[#00a8ff]" />
            <span>TEAMS & FELLOWSHIP LIFE</span>
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Find Your Place to Serve & Grow
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Every student has a God-given gift. Discover where your passion aligns with ministry and authentic campus fellowship.
          </p>
        </div>

        {/* Operational Teams Grid — Compact Mobile Image Height (h-32 on mobile, h-48 on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {fellowshipTeams.map((team, idx) => (
            <motion.div
              key={team.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -6 }}
              className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-lg hover:shadow-sky-500/10 transition-all"
            >
              <div className="relative h-32 sm:h-48 w-full bg-slate-100 overflow-hidden">
                <Image
                  src={team.image}
                  alt={team.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                <div className="absolute bottom-3 left-4 text-white font-extrabold text-lg sm:text-xl">
                  {team.name}
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-xs sm:text-sm font-normal text-slate-600 leading-relaxed">
                  {team.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Integrated Fellowship Life Snapshots — Compact Mobile Gallery (h-24 on mobile, h-40 on desktop) */}
        <div className="mt-12 sm:mt-16 border-t border-slate-100 pt-10 sm:pt-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Camera className="h-4 w-4 text-[#00a8ff]" />
              <span>More Fellowship Moments</span>
            </h3>
            <span className="text-[11px] sm:text-xs text-slate-400">Click photo to view</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {galleryMoments.map((img, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.03 }}
                onClick={() => setSelectedImage(img)}
                className="group relative h-24 sm:h-40 overflow-hidden rounded-2xl border border-slate-200 shadow-sm cursor-pointer"
              >
                <Image
                  src={img.src}
                  alt={img.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
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
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors backdrop-blur-md"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative h-[300px] sm:h-[450px] w-full bg-slate-100">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="p-4 sm:p-6 bg-white flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00a8ff]">
                    {selectedImage.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    {selectedImage.title}
                  </h3>
                </div>
                <div className="text-xs font-medium text-slate-400">
                  ECCF Edo State University
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
