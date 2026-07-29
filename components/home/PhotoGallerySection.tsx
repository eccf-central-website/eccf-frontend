/**
 * PhotoGallerySection — Interactive Campus Life & Fellowship Moments Gallery
 *
 * Displays authentic photography from ECCF fellowship services, worship sessions,
 * academic study groups, and campus outreaches. Includes modal preview zoom.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, Maximize2, MapPin } from 'lucide-react'

const galleryImages = [
  { src: '/gallery/gallery-1.jpg', title: 'Worship & Praise', category: 'Sunday Service' },
  { src: '/gallery/gallery-3.jpg', title: 'Word & Exposition', category: 'Bible Study' },
  { src: '/gallery/gallery-4.jpg', title: 'Fellowship Community', category: 'Student Life' },
  { src: '/gallery/gallery-2.jpg', title: 'Prayer & Consecration', category: 'Prayer Night' },
  { src: '/gallery/gallery-5.jpg', title: 'Academic Mentoring', category: 'Excellence' },
  { src: '/gallery/gallery-6.jpg', title: 'Campus Evangelism', category: 'Outreach' },
  { src: '/gallery/gallery-7.jpg', title: 'Kingdom Leadership', category: 'Exco Roster' },
  { src: '/gallery/gallery-8.jpg', title: 'Youthful Energy', category: 'Fellowship' },
]

export default function PhotoGallerySection() {
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string; category: string } | null>(null)

  return (
    <section className="py-24 border-t border-slate-200/60 bg-[#f8fafc]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff] flex items-center gap-1.5 mb-1">
              <Camera className="h-3.5 w-3.5 text-[#00a8ff]" />
              <span>FELLOWSHIP MOMENTS</span>
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Life at ECCF Iyamho
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Snapshots of worship, prayer, academic study groups, and genuine campus brotherhood.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#00a8ff]">
            <MapPin className="h-3.5 w-3.5" />
            <span>EDO STATE UNIVERSITY</span>
          </div>
        </div>

        {/* Responsive Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {galleryImages.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -6 }}
              onClick={() => setSelectedImage(img)}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md cursor-pointer aspect-square"
            >
              <Image
                src={img.src}
                alt={img.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-between">
                <div className="flex justify-end">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
                    <Maximize2 className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                    {img.category}
                  </span>
                  <h4 className="text-sm font-bold text-white leading-tight mt-0.5">
                    {img.title}
                  </h4>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Image Lightbox Modal */}
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-2xl"
            >
              <button
                onClick={() => setSelectedImage(null)}
                aria-label="Close modal"
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors backdrop-blur-md"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative h-[450px] w-full bg-slate-100">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="p-6 bg-white flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00a8ff]">
                    {selectedImage.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
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
