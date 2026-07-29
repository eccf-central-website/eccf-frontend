'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, Variants } from 'framer-motion'
import {
  Play,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react'
import GivingHubSection from '@/components/home/GivingHubSection'
import PhotoGallerySection from '@/components/home/PhotoGallerySection'
import LiveAudioPlayer from '@/components/home/LiveAudioPlayer'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export default function Home() {
  // Audio Player State
  const [audioPlayerOpen, setAudioPlayerOpen] = useState(false)
  const [audioTitle, setAudioTitle] = useState('ECCF Radio 24/7')
  const [audioSubtitle, setAudioSubtitle] = useState('Live Worship & Teaching')
  const [isPlaying, setIsPlaying] = useState(true)

  const handlePlayAudio = (title: string, subtitle: string) => {
    setAudioTitle(title)
    setAudioSubtitle(subtitle)
    setAudioPlayerOpen(true)
    setIsPlaying(true)
  }

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-[#00a8ff] selection:text-white overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 text-center md:pt-24 md:pb-28">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* Location Pill Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-xs font-bold text-[#00a8ff] border border-sky-100 mb-8 shadow-sm"
          >
            <MapPin className="h-3.5 w-3.5 text-[#00a8ff]" />
            <span>EDO STATE UNIVERSITY, IYAMHO</span>
          </motion.div>

          {/* Hero Title */}
          <motion.h1
            variants={itemVariants}
            className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl leading-[1.15]"
          >
            Spiritual Dynamites <br className="hidden sm:inline" />
            <span className="text-[#00a8ff]">and Academic Giants.</span>
          </motion.h1>

          {/* Hero Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed"
          >
            A vibrant community of campus students pursuing God&apos;s purpose with academic excellence. You belong here &mdash; whether you&apos;re new on campus or looking for a spiritual family.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row w-full sm:w-auto"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Link
                href="#visit"
                className="block w-full sm:w-auto text-center rounded-full bg-[#00a8ff] hover:bg-[#0092e0] text-white font-bold px-8 py-3.5 shadow-md shadow-sky-500/25 transition-all"
              >
                Join the Fellowship
              </Link>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePlayAudio('ECCF Radio Live', 'Tune in to continuous worship & sermons')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-sky-300 bg-white text-[#00a8ff] font-bold px-8 py-3.5 shadow-sm transition-all hover:bg-sky-50 hover:border-sky-400"
            >
              <Play className="h-4 w-4 fill-[#00a8ff]" />
              <span>Watch / Tune In</span>
            </motion.button>
          </motion.div>

          {/* Quick Stats Bar */}
          <motion.div
            variants={itemVariants}
            className="mt-16 mx-auto grid max-w-xl grid-cols-3 gap-6 border-t border-slate-200/80 pt-10 text-center w-full"
          >
            <div>
              <div className="text-3xl font-extrabold text-slate-900 sm:text-4xl">400+</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Active Members</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#00a8ff] sm:text-4xl">6</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Weekly Programs</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 sm:text-4xl">10yrs</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">Of Impact</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SERMON VAULT — LATEST MESSAGES                                         */}
      {/* ========================================================================= */}
      <section className="py-20 border-t border-slate-200/60 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff]">
                SERMON VAULT
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mt-1">
                Latest Messages
              </h2>
            </div>
            <Link
              href="/sermons"
              className="inline-flex items-center gap-1 text-sm font-bold text-[#00a8ff] hover:text-[#0092e0] transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                tag: 'FAVOUR UNVEILED',
                title: 'Walking in Uncommon Favour',
                speaker: 'Bro. Emmanuel Obi',
                date: 'July 6, 2025',
                duration: '48 min',
                bgGradient: 'from-amber-400/20 to-sky-400/20',
              },
              {
                tag: 'CAMPUS GIANTS',
                title: 'The Discipline of the Anointed Student',
                speaker: 'Sis. Grace Iyamu',
                date: 'June 29, 2025',
                duration: '52 min',
                bgGradient: 'from-indigo-400/20 to-sky-400/20',
              },
              {
                tag: 'POWER & PRAYER',
                title: 'Praying with Authority',
                speaker: 'Bro. Samuel Edosa',
                date: 'June 22, 2025',
                duration: '45 min',
                bgGradient: 'from-emerald-400/20 to-sky-400/20',
              },
            ].map((sermon, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-lg hover:shadow-sky-500/10 cursor-pointer"
                onClick={() => handlePlayAudio(sermon.title, sermon.speaker)}
              >
                {/* Thumbnail Image placeholder with Play Button */}
                <div className={`relative h-48 w-full bg-gradient-to-br ${sermon.bgGradient} flex items-center justify-center p-4`}>
                  <div className="absolute top-3 right-3 rounded-full bg-slate-900/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{sermon.duration}</span>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00a8ff] text-white shadow-lg shadow-sky-500/30"
                  >
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00a8ff]">
                    {sermon.tag}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2 group-hover:text-[#00a8ff] transition-colors leading-snug">
                    {sermon.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    {sermon.speaker} &bull; {sermon.date}
                  </p>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00a8ff] hover:underline"
                  >
                    <Play className="h-3.5 w-3.5 fill-[#00a8ff]" />
                    <span>Listen Now</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. GLOBAL GIVING HUB (INTERACTIVE COMPONENT)                              */}
      {/* ========================================================================= */}
      <GivingHubSection />

      {/* ========================================================================= */}
      {/* 4. WHO WE ARE SECTION & SERVICE SCHEDULE                                   */}
      {/* ========================================================================= */}
      <section id="about" className="py-24 border-t border-slate-200/60 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            {/* Text & Service Grid */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff]">
                WHO WE ARE
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mt-2 leading-tight">
                A fellowship built on faith, love & excellence.
              </h2>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                ECCF is the campus arm of the Evangelical Church Winning All (ECWA), raised to produce students who are spiritual dynamites and academic giants. We meet weekly for Bible studies, prayer, worship, and outreach on the Edo State University campus.
              </p>

              {/* 2x2 Service Schedule */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { day: 'SUNDAY', time: '9:00 AM', title: 'Praise & Worship' },
                  { day: 'TUESDAY', time: '6:00 PM', title: 'Bible Study' },
                  { day: 'THURSDAY', time: '6:30 PM', title: 'Prayer Meeting' },
                  { day: 'FRIDAY', time: '5:00 PM', title: 'Outreach' },
                ].map((serv) => (
                  <motion.div
                    key={serv.day}
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-sky-200 hover:bg-sky-50/50"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#00a8ff] uppercase">
                      <Calendar className="h-3 w-3" />
                      <span>{serv.day}</span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900 mt-1">{serv.time}</div>
                    <div className="text-xs text-slate-500">{serv.title}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Visual Photo Cards Collage using Real Fellowship Pictures */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <Image
                  src="/gallery/gallery-1.jpg"
                  alt="Worship at ECCF"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm mt-6">
                <Image
                  src="/gallery/gallery-2.jpg"
                  alt="Student Prayer Session"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PHOTO GALLERY SECTION                                                  */}
      {/* ========================================================================= */}
      <PhotoGallerySection />

      {/* ========================================================================= */}
      {/* 6. PLAN A VISIT (CTA SECTION)                                             */}
      {/* ========================================================================= */}
      <section id="visit" className="py-20 border-t border-slate-200/60 bg-[#f8fafc] text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl px-6"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff]">
            JOIN US THIS SUNDAY
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mt-2">
            Planning a Visit to ECCF?
          </h2>
          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            We would love to welcome you in person! Whether you&apos;re a fresh student or a returning scholar, there is a place for you at our table.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="mailto:edsuchristiancampusfellowship@gmail.com?subject=Planning%20a%20Visit"
              className="w-full sm:w-auto rounded-full bg-[#00a8ff] hover:bg-[#0092e0] text-white font-bold px-8 py-3.5 shadow-md shadow-sky-500/25 transition-all"
            >
              Plan a Visit
            </motion.a>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Link
                href="/give"
                className="block w-full sm:w-auto rounded-full border border-slate-300 bg-white text-slate-700 font-bold px-8 py-3.5 hover:bg-slate-50 transition-all"
              >
                Give Online
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Interactive Floating Live Audio Player Component */}
      <LiveAudioPlayer
        isOpen={audioPlayerOpen}
        title={audioTitle}
        subtitle={audioSubtitle}
        onClose={() => setAudioPlayerOpen(false)}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((prev) => !prev)}
      />
    </div>
  )
}
