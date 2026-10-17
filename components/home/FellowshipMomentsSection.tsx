/**
 * FellowshipMomentsSection — Photo Stream & Campus Highlights
 *
 * Displays the fellowship photo stream in view-only mode.
 * Modal/lightbox click-on feature is removed per user specification.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Users } from 'lucide-react'

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
  const [showAllGallery, setShowAllGallery] = useState(false)

  const safeGallery = gallery || []
  const displayedGallery = showAllGallery ? safeGallery : safeGallery.slice(0, 8)

  if (safeGallery.length === 0) return null

  return (
    <section id="moments" className="py-16 sm:py-24 bg-white relative overflow-hidden border-t border-stone-100">
      <div className="w-full px-6 sm:px-10 md:px-14 lg:px-14 xl:px-20 2xl:px-28">
        
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

        {/* Photo Grid — View Only, No Click-On Lightbox */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayedGallery.map((img, idx) => (
            <motion.div
              key={img._id || idx}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: Math.min(idx * 0.04, 0.3) }}
              className="group relative h-48 sm:h-64 overflow-hidden rounded-[20px] shadow-sm bg-slate-900 border border-stone-200/60"
            >
              <Image
                src={img.src}
                alt={img.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
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
    </section>
  )
}
