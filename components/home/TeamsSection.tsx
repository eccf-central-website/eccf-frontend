/**
 * TeamsSection — Fellowship Operational Teams & Student Life
 *
 * Implements Section 2.5 of SDD and CLAUDE.md guidelines.
 * 100% powered by live Sanity Studio data (teamUnit & galleryItem).
 * Zero hardcoded fallback arrays.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Maximize2, X, Users } from 'lucide-react'
import Link from 'next/link'

export interface TeamItem {
  _id: string
  name: string
  role?: string
  description: string
  imageUrl?: string
  tag?: string
}

export interface GalleryItem {
  _id: string
  src: string
  title: string
  category: string
}

interface Props {
  teams?: TeamItem[] | null
  gallery?: GalleryItem[] | null
}

export default function TeamsSection({ teams, gallery }: Props) {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null)
  const [showAllGallery, setShowAllGallery] = useState(false)

  const safeTeams = teams || []
  const safeGallery = gallery || []
  const displayedGallery = showAllGallery ? safeGallery : safeGallery.slice(0, 8)

  if (safeTeams.length === 0 && safeGallery.length === 0) return null

  return (
    <section id="teams" className="py-16 sm:py-24 bg-white relative overflow-hidden border-t border-stone-100">
      <div className="w-full px-6 sm:px-8 lg:px-12">
        
        {/* Clean Centered Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <span className="text-xs sm:text-sm font-bold tracking-widest text-[#0077cc] uppercase block mb-3 font-mono">
            FELLOWSHIP OPERATIONAL TEAMS
          </span>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] text-slate-950 tracking-tight leading-tight">
            Find Your Place to Serve &amp; Lead
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
            Every university student has a God-given gift. Connect with one of our operational teams to build lifelong leadership, ministry skills, and Christian character.
          </p>
        </motion.div>

        {/* Seamless 3-Column Team Cards */}
        {safeTeams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {safeTeams.map((team, idx) => (
              <motion.div
                key={team._id || team.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group flex flex-col justify-between overflow-hidden rounded-[24px] bg-[#fafaf9] border border-stone-200/70 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all"
              >
                <div>
                  {/* Photo with Overlay */}
                  <div className="relative h-60 sm:h-64 w-full overflow-hidden bg-slate-900 flex items-center justify-center">
                    {team.imageUrl ? (
                      <Image
                        src={team.imageUrl}
                        alt={team.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Users className="h-12 w-12 text-slate-300" />
                        <span className="text-sm font-semibold">{team.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />
                    
                    <div className="absolute top-4 left-4">
                      <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10">
                        {team.tag || 'MINISTRY TEAM'}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-5 right-5 text-white">
                      {team.role && (
                        <span className="text-xs font-semibold text-sky-300 block uppercase tracking-wider mb-0.5">
                          {team.role}
                        </span>
                      )}
                      <h3 className="font-serif font-bold text-2xl text-white leading-tight">
                        {team.name}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-6 sm:p-7">
                    <p className="text-base text-slate-700 leading-relaxed font-normal">
                      {team.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Join Action */}
                <div className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-slate-100/60 pt-4">
                  <span className="text-xs font-semibold text-slate-400">Open to all students</span>
                  <Link
                    href="#visit"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0077cc] group-hover:text-sky-800 transition-colors"
                  >
                    <span>Join Team</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Integrated Fellowship Moments Photo Stream */}
        {safeGallery.length > 0 && (
          <div className="mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-stone-100">
            <div className="flex items-end justify-between mb-8 sm:mb-10">
              <div>
                <span className="text-xs sm:text-sm font-bold tracking-widest text-[#0077cc] uppercase block mb-2 font-mono">
                  FELLOWSHIP LIFE
                </span>
                <h3 className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-950">
                  Moments in God&apos;s Presence
                </h3>
              </div>
              <span className="text-xs sm:text-sm text-slate-500 font-medium">Click photo to zoom</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {displayedGallery.map((img, idx) => (
                <motion.div
                  key={img._id || idx}
                  initial={{ opacity: 0, scale: 0.94 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.04, 0.3) }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedImage(img)}
                  className="group relative h-48 sm:h-64 overflow-hidden rounded-[20px] shadow-sm cursor-pointer bg-slate-900 border border-stone-200/60"
                >
                  <Image
                    src={img.src}
                    alt={img.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-6 w-6 text-white" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Expand / Collapse Toggle */}
            {safeGallery.length > 8 && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllGallery((prev) => !prev)}
                  className="inline-flex items-center justify-center px-7 py-3 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 hover:text-[#0077cc] transition-colors shadow-sm"
                >
                  {showAllGallery
                    ? 'Show Less Highlights'
                    : `View All ${safeGallery.length} Moments`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-slate-900 rounded-[28px] overflow-hidden shadow-2xl"
            >
              <div className="relative h-80 sm:h-[500px] w-full bg-black">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="p-6 bg-slate-900 flex items-center justify-between border-t border-slate-800">
                <div>
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                    {selectedImage.category}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">
                    {selectedImage.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="h-11 w-11 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors"
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