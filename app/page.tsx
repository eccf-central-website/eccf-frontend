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
  Target,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import GivingHubSection from '@/components/home/GivingHubSection'
import PhotoGallerySection from '@/components/home/PhotoGallerySection'
import TeamsSection from '@/components/home/TeamsSection'
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
      {/* 2.2 HERO SECTION (UI/UX BRIEF SPECIFICATION)                              */}
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

          {/* Official Primary Headline Tagline */}
          <motion.h1
            variants={itemVariants}
            className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl leading-[1.15]"
          >
            An Assembly Of <br className="hidden sm:inline" />
            <span className="text-[#00a8ff]">Spiritual Dynamites And Academic Giants.</span>
          </motion.h1>

          {/* Official Subheadline Tagline */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-6 max-w-2xl text-lg font-bold text-slate-700 tracking-wide sm:text-xl uppercase"
          >
            &ldquo;JESUS IN OUR HEARTS, LETTERS IN OUR HEADS.&rdquo;
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-3 max-w-xl text-sm text-slate-500 leading-relaxed"
          >
            The official campus fellowship of Edo State University (ECWA). Raising Kingdom leaders equipped spiritually and academically to dominate their spheres.
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
                Plan a Visit
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
      {/* 2.3 WHO WE ARE (MISSION, VISION, CORE VALUES)                              */}
      {/* ========================================================================= */}
      <section id="about" className="py-24 border-t border-slate-200/60 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            {/* Mission, Vision, Core Values Cards */}
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
                Raised for Kingdom Impact & Academic Distinction.
              </h2>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                ECCF is dedicated to nurturing university students into grounded believers who excel in their studies and manifest the power of God on campus.
              </p>

              {/* Scannable Blocks */}
              <div className="mt-8 space-y-4">
                <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/80">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-[#00a8ff]">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Our Mission</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      To raise Spirit-filled leaders, foster intellectual growth, and preach Christ across Edo State University.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/80">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-[#00a8ff]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Our Vision</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      A campus transformed by the Gospel, producing graduates who excel spiritually and academically nationwide.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/80">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-[#00a8ff]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Core Values</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Faith, Academic Discipline, Integrity, Fellowship, and Unwavering Commitment to God&apos;s Word.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Photo Collage Collage */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <Image
                  src="/gallery/gallery-1.jpg"
                  alt="Worship at ECCF"
                  fill
                  sizes="(max-width: 768px) 50vw, 30vw"
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm mt-8">
                <Image
                  src="/gallery/gallery-2.jpg"
                  alt="Student Prayer Session"
                  fill
                  sizes="(max-width: 768px) 50vw, 30vw"
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.4 SERVICE TIMES & LOCATION (EXACT SPECIFICATION FROM UI/UX BRIEF)       */}
      {/* ========================================================================= */}
      <section className="py-20 border-t border-slate-200/60 bg-[#f8fafc]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff]">
              WEEKLY FELLOWSHIP SCHEDULE
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mt-1">
              Service Times & Location
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Join us weekly on campus. Screenshot or reference these times!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sunday Service',
                day: 'SUNDAY',
                time: '08:00 AM',
                location: 'Campus Fellowship Hall',
                accentColor: 'border-l-sky-500',
              },
              {
                name: 'Word Service',
                day: 'WEDNESDAY',
                time: '04:50 PM',
                location: 'Campus Fellowship Hall',
                accentColor: 'border-l-indigo-500',
              },
              {
                name: 'Academic Challenge / Wonder Service',
                day: 'FRIDAY',
                time: '04:50 PM',
                location: 'Campus Fellowship Hall',
                accentColor: 'border-l-emerald-500',
              },
            ].map((service, idx) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all border-l-4 ${service.accentColor} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-[#00a8ff] tracking-wider uppercase mb-2">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {service.day}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                    {service.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <Clock className="h-4 w-4 text-slate-400 self-center" />
                    <span className="text-2xl font-black text-[#00a8ff]">
                      {service.time}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{service.location}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.5 OUR TEAMS / UNITS (EXACT SPECIFICATION FROM UI/UX BRIEF)              */}
      {/* ========================================================================= */}
      <TeamsSection />

      {/* ========================================================================= */}
      {/* SERMON VAULT — LATEST MESSAGES                                            */}
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
      {/* GLOBAL GIVING HUB (INTERACTIVE COMPONENT)                                 */}
      {/* ========================================================================= */}
      <GivingHubSection />

      {/* ========================================================================= */}
      {/* FELLOWSHIP PHOTO GALLERY                                                  */}
      {/* ========================================================================= */}
      <PhotoGallerySection />

      {/* ========================================================================= */}
      {/* 2.6 PLAN A VISIT (ZERO-FRICTION CTA SECTION FROM UI/UX BRIEF)             */}
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
            We would love to welcome you in person! Whether you&apos;re a fresh student or a returning scholar, expect a warm welcome, powerful worship, and zero pressure.
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
