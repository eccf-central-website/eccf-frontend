/**
 * TeamsSection — Fellowship Operational Teams & Student Life
 *
 * Implements Section 2.5 of SDD and CLAUDE.md guidelines.
 * Naming Rule: Field/entity is strictly 'team' (Choir, Drama/Thespians, Prayer, Ushering, Media).
 */

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Camera, ArrowUpRight, Maximize2, X } from 'lucide-react'
import Link from 'next/link'
import { sanityClient } from '@/lib/sanity'
import { GALLERY_QUERY, TEAMS_QUERY } from '@/lib/queries'

const defaultTeams = [
  {
    name: 'Choir Team',
    role: 'Worship Ministry',
    description: 'Leading the congregation into divine atmospheres of anointed praise and intimate worship during all services.',
    imageUrl: '/gallery/gallery-1.jpg',
    tag: 'VOCALS & INSTRUMENTS',
  },
  {
    name: 'Drama (Thespians)',
    role: 'Creative Arts',
    description: 'Preaching the Gospel through inspiring stage plays, spoken word, and creative theatrical productions.',
    imageUrl: '/gallery/gallery-4.jpg',
    tag: 'STAGE & DRAMA',
  },
  {
    name: 'Prayer Team',
    role: 'Intercessory Ministry',
    description: 'Interceding continuously for the university campus, spiritual awakening, and student academic victories.',
    imageUrl: '/gallery/gallery-2.jpg',
    tag: 'INTERCESSION',
  },
  {
    name: 'Ushering & Protocol',
    role: 'Hospitality & Order',
    description: 'Welcoming members and guests with warmth while maintaining order, comfort, and hospitality in God’s house.',
    imageUrl: '/gallery/gallery-5.jpg',
    tag: 'HOSPITALITY',
  },
  {
    name: 'Media & Technical',
    role: 'Digital Outreach',
    description: 'Capturing live audio/video streams, podcast syndication, sound engineering, and campus digital outreach.',
    imageUrl: '/gallery/gallery-6.jpg',
    tag: 'SOUND & MEDIA',
  },
]

const defaultMoments = [
  { src: '/gallery/gallery-3.jpg', title: 'Word Exposition & Study', category: 'Wednesday Service' },
  { src: '/gallery/gallery-7.jpg', title: 'Kingdom Leadership Council', category: 'Exco Roster' },
  { src: '/gallery/gallery-4.jpg', title: 'Student Life & Fellowship', category: 'Campus Moments' },
  { src: '/gallery/gallery-9.jpg', title: 'Campus Evangelism Outreach', category: 'Evangelism' },
  { src: '/gallery/gallery-10.jpg', title: 'Scriptural Ministration & Reading', category: 'Sunday Worship' },
  { src: '/gallery/gallery-11.jpg', title: 'Choir Anointed Worship', category: 'Music Ministry' },
  { src: '/gallery/gallery-12.jpg', title: 'Congregational Prayer Warfare', category: 'Academic Challenge' },
  { src: '/gallery/gallery-14.jpg', title: 'Exhortation & Preaching', category: 'Spiritual Dynamites' },
]

interface SanityTeam {
  _id: string
  name: string
  description?: string
  imageUrl?: string
  leadName?: string
}

interface SanityGalleryItem {
  _id: string
  title: string
  category?: string
  imageUrl?: string
}

export default function TeamsSection() {
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string; category: string } | null>(null)
  const [teams, setTeams] = useState(defaultTeams)
  const [gallery, setGallery] = useState(defaultMoments)

  useEffect(() => {
    // Fetch live operational teams from Sanity
    sanityClient
      .fetch<SanityTeam[]>(TEAMS_QUERY)
      .then((data) => {
        if (data && data.length > 0) {
          setTeams(
            data.map((t, idx) => ({
              name: t.name,
              role: t.leadName || defaultTeams[idx % defaultTeams.length].role,
              description: t.description || defaultTeams[idx % defaultTeams.length].description,
              imageUrl: t.imageUrl || defaultTeams[idx % defaultTeams.length].imageUrl,
              tag: defaultTeams[idx % defaultTeams.length].tag,
            }))
          )
        }
      })
      .catch((err) => console.warn('Could not fetch Sanity teams, using defaults:', err))

    // Fetch live gallery moments from Sanity
    sanityClient
      .fetch<SanityGalleryItem[]>(GALLERY_QUERY)
      .then((data) => {
        if (data && data.length > 0) {
          setGallery(
            data.map((g) => ({
              src: g.imageUrl || '/gallery/gallery-3.jpg',
              title: g.title,
              category: g.category || 'Fellowship Life',
            }))
          )
        }
      })
      .catch((err) => console.warn('Could not fetch Sanity gallery, using defaults:', err))
  }, [])

  return (
    <section className="py-16 sm:py-24 bg-[#fafafa] border-t border-slate-200/60 relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Clean Centered Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3.5 py-1 text-xs font-black text-[#0095ff] border border-sky-100/80 uppercase tracking-widest text-[10px] mb-3">
            <Users className="h-3.5 w-3.5 text-[#0095ff]" />
            <span>FELLOWSHIP OPERATIONAL TEAMS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
            Find Your Place to Serve & Lead
          </h2>
          <p className="mt-3 text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
            Every university student has a God-given gift. Connect with one of our operational teams to build lifelong leadership, ministry skills, and Christian character.
          </p>
        </motion.div>

        {/* 5-Column Grid with Spotlight Cards & Staggered Upward Entrance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {teams.map((team, idx) => (
            <motion.div
              key={team.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-2.5 shadow-sm hover:shadow-xl hover:shadow-sky-500/10 transition-shadow"
            >
              <div>
                {/* Photo with Overlay */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-2xl bg-slate-100">
                  <Image
                    src={team.imageUrl}
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
                <div className="p-4 sm:p-5">
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
        <div className="mt-16 sm:mt-20 border-t border-slate-200/80 pt-12 sm:pt-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-[#0095ff] uppercase mb-1">
                <Camera className="h-4 w-4 text-[#0095ff]" />
                <span>FELLOWSHIP LIFE</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Moments in God&apos;s Presence
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Click photo to zoom</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {gallery.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: idx * 0.05 }}
                whileHover={{ scale: 1.04 }}
                onClick={() => setSelectedImage(img)}
                className="group relative h-32 sm:h-44 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm cursor-pointer"
              >
                <Image
                  src={img.src}
                  alt={img.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
              className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700"
            >
              <div className="relative h-80 sm:h-[450px] w-full bg-black">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="p-6 bg-slate-900 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                    {selectedImage.category}
                  </span>
                  <h4 className="text-lg font-black text-white mt-0.5">
                    {selectedImage.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
