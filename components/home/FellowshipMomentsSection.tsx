/**
 * FellowshipMomentsSection — Photo Stream & Campus Highlights
 *
 * Replaces the old TeamsSection on the homepage, preserving the photo gallery
 * and lightbox modal while directing visitors to the About Page for the 14 operational units.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, X, ArrowRight, Users } from 'lucide-react'

export interface GalleryItem {
  _id: string
  src: string
  title: string
  category: string
}

interface Props {
  gallery?: GalleryItem[] | null
}

export default function FellowshipMomentsSection({ gallery }: Props) {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null)
  const [showAllGallery, setShowAllGallery] = useState(false)

  const safeGallery = gallery || []
  const displayedGallery = showAllGallery ? safeGallery : safeGallery.slice(0, 8)

  if (safeGallery.length === 0) return null

  return (
    <section id="moments" className="py-16 sm:py-24 bg-white relative overflow-hidden border-t border-stone-100">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <span className="text-xs sm:text-sm font-bold tracking-widest text-[#0077cc] uppercase block mb-2 font-mono">
              FELLOWSHIP LIFE &amp; COMMUNITY
            </span>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-tight">
              Moments in God&apos;s Presence
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl font-normal">
              A glimpse into campus worship, prayer vigils, hostel fellowships, and student life across Edo State University.
            </p>
          </div>

          <Link
            href="/about#teams"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-sky-50 hover:bg-sky-100 text-[#0077cc] text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors shrink-0 border border-sky-200/80"
          >
            <Users className="h-4 w-4" />
            <span>Meet Our 14 Teams on About Page</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Photo Grid */}
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

        {/* Expand / Collapse Button */}
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
