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
  teams?: TeamItem[]
  gallery?: GalleryItem[]
}

export default function TeamsSection({ teams = [], gallery = [] }: Props) {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null)

  if (teams.length === 0 && gallery.length === 0) return null

  return (
    <section id="teams" className="py-16 sm:py-24 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Clean Centered Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <span className="text-xs font-black tracking-widest text-[#0077cc] uppercase block mb-2 font-mono">
            FELLOWSHIP OPERATIONAL TEAMS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
            Find Your Place to Serve & Lead
          </h2>
          <p className="mt-3 text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
            Every university student has a God-given gift. Connect with one of our operational teams to build lifelong leadership, ministry skills, and Christian character.
          </p>
        </motion.div>

        {/* Seamless 3-Column Team Cards */}
        {teams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {teams.map((team, idx) => (
              <motion.div
                key={team._id || team.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-[#fafaf9] shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all"
              >
                <div>
                  {/* Photo with Overlay */}
                  <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
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
                        <span className="text-xs font-semibold">{team.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    
                    <div className="absolute top-3.5 left-3.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white">
                        {team.tag || 'MINISTRY TEAM'}
                      </span>
                    </div>

                    <div className="absolute bottom-3.5 left-4 right-4 text-white">
                      {team.role && (
                        <span className="text-[11px] font-bold text-sky-300 block uppercase tracking-wider">
                          {team.role}
                        </span>
                      )}
                      <h3 className="text-xl font-black text-white leading-tight">
                        {team.name}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-5 sm:p-6">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {team.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Join Action */}
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Open to all students</span>
                  <Link
                    href="#visit"
                    className="inline-flex items-center gap-1 text-xs font-black text-[#0077cc] group-hover:text-sky-800 transition-colors"
                  >
                    <span>Join Team</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Integrated Fellowship Moments Photo Stream */}
        {gallery.length > 0 && (
          <div className="mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-black tracking-widest text-[#0077cc] uppercase block mb-1 font-mono">
                  FELLOWSHIP LIFE
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                  Moments in God&apos;s Presence
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Click photo to zoom</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {gallery.map((img, idx) => (
                <motion.div
                  key={img._id || idx}
                  initial={{ opacity: 0, scale: 0.94 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.04, 0.3) }}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setSelectedImage(img)}
                  className="group relative h-36 sm:h-48 overflow-hidden rounded-3xl shadow-sm cursor-pointer bg-slate-100"
                >
                  <Image
                    src={img.src}
                    alt={img.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-5 w-5 text-white" />
                  </div>
                </motion.div>
              ))}
            </div>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl"
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
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    {selectedImage.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors"
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