'use client'

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
  Sun,
  GraduationCap
} from 'lucide-react'
import GivingHubSection from '@/components/home/GivingHubSection'
import TeamsSection from '@/components/home/TeamsSection'
import CountUpNumber from '@/components/ui/CountUpNumber'

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

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-[#00a8ff] selection:text-white overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 2.2 HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="relative w-full bg-gradient-to-b from-sky-50/60 via-[#f8fafc] to-[#f8fafc] py-16 md:py-24 border-b border-slate-200/60">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            {/* Location Pill Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-xs font-bold text-[#00a8ff] border border-sky-200/80 mb-8 shadow-sm"
            >
              <MapPin className="h-3.5 w-3.5 text-[#00a8ff]" />
              <span>EDO STATE UNIVERSITY, IYAMHO</span>
            </motion.div>

            {/* Official Primary Headline Tagline */}
            <motion.h1
              variants={itemVariants}
              className="mx-auto max-w-4xl text-4xl font-extrabold tracking-[-0.02em] text-slate-900 sm:text-6xl md:text-7xl leading-[1.08]"
            >
              An Assembly Of <br className="hidden sm:inline" />
              Spiritual <span className="text-[#00a8ff]">Dynamites</span> And Academic Giants.
            </motion.h1>

            {/* Official Subheadline Tagline */}
            <motion.p
              variants={itemVariants}
              className="mx-auto mt-6 max-w-2xl text-base font-bold text-[#00a8ff] tracking-widest sm:text-lg uppercase"
            >
              &ldquo;JESUS IN OUR HEARTS, LETTERS IN OUR HEADS.&rdquo;
            </motion.p>

            {/* Hero Subtitle */}
            <motion.p
              variants={itemVariants}
              className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-slate-600 leading-relaxed font-normal"
            >
              The official website of Edo State University Christian Campus Fellowship (ECCF)
            </motion.p>

            {/* Hero CTAs */}
            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row w-full sm:w-auto"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Link
                  href="#visit"
                  className="block w-full sm:w-auto text-center rounded-full bg-[#00a8ff] hover:bg-[#0092e0] text-white font-bold px-8 py-3.5 text-sm shadow-md shadow-sky-500/20 transition-all"
                >
                  Plan a Visit
                </Link>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-sky-200 bg-white text-[#00a8ff] font-bold px-8 py-3.5 text-sm shadow-sm transition-all hover:bg-sky-50 hover:border-sky-300"
              >
                <Play className="h-4 w-4 fill-[#00a8ff]" />
                <span>Watch / Tune In</span>
              </motion.button>
            </motion.div>

            {/* Quick Stats Bar */}
            <motion.div
              variants={itemVariants}
              className="mt-12 mx-auto flex flex-col sm:flex-row max-w-3xl justify-center sm:justify-start items-center gap-8 sm:gap-12 border-t border-slate-200/80 pt-8 text-left w-full"
            >
              <div className="flex flex-col items-center sm:items-start">
                <div className="text-4xl sm:text-5xl font-black text-[#00a8ff]">
                  <CountUpNumber end={400} suffix="+" />
                </div>
                <div className="text-sm font-bold text-slate-600 mt-2 uppercase tracking-wider">Active Members</div>
              </div>
              <div className="hidden sm:block h-14 w-px bg-slate-200" />
              <div className="flex flex-col items-center sm:items-start">
                <div className="text-4xl sm:text-5xl font-black text-[#00a8ff]">
                  <CountUpNumber end={6} />
                </div>
                <div className="text-sm font-bold text-slate-600 mt-2 uppercase tracking-wider">Weekly Programs</div>
              </div>
              <div className="hidden sm:block h-14 w-px bg-slate-200" />
              <div className="flex flex-col items-center sm:items-start">
                <div className="text-4xl sm:text-5xl font-black text-[#00a8ff]">
                  <CountUpNumber end={10} suffix="yrs+" />
                </div>
                <div className="text-sm font-bold text-slate-600 mt-2 uppercase tracking-wider">Of Impact</div>
              </div>
            </motion.div>

            {/* Framed Fellowship Photo Showcase */}
            <motion.div
              variants={itemVariants}
              className="mt-10 sm:mt-14 w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-2 sm:p-3 shadow-xl shadow-slate-200/60"
            >
              <div className="relative h-44 sm:h-96 w-full overflow-hidden rounded-xl sm:rounded-2xl">
                <Image
                  src="/gallery/gallery-4.jpg"
                  alt="ECCF Student Fellowship Community"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 85vw"
                  className="object-cover hover:scale-103 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-6">
                  <div className="text-left text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                      CAMPUS FELLOWSHIP COMMUNITY
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5 leading-snug">
                      Raising Kingdom Leaders on Campus
                    </h3>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.3 WHO WE ARE (MISSION, VISION, CORE VALUES)                              */}
      {/* ========================================================================= */}
      <section id="about" className="py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-xl"
            >
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="h-px w-8 bg-[#00a8ff]"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff]">
                  Our Foundation
                </span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 sm:text-5xl leading-[1.15]">
                Raised for Kingdom Impact & Academic Distinction.
              </h2>
              <p className="mt-6 text-base text-slate-600 leading-relaxed font-normal">
                ECCF is dedicated to nurturing university students into grounded believers who excel in their studies and manifest the power of God on campus.
              </p>

              <div className="mt-12 flex flex-col gap-8">
                {/* Mission */}
                <div className="group flex gap-5 items-start">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#00a8ff] group-hover:border-sky-200 group-hover:bg-sky-50 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00a8ff]/0 to-[#00a8ff]/0 group-hover:from-[#00a8ff]/10 group-hover:to-transparent transition-colors"></div>
                    <Target className="h-6 w-6 relative z-10" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 group-hover:text-[#00a8ff] transition-colors">Our Mission</h4>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      To raise Spirit-filled leaders, foster intellectual growth, and preach Christ across Edo State University.
                    </p>
                  </div>
                </div>

                {/* Vision */}
                <div className="group flex gap-5 items-start">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#00a8ff] group-hover:border-sky-200 group-hover:bg-sky-50 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00a8ff]/0 to-[#00a8ff]/0 group-hover:from-[#00a8ff]/10 group-hover:to-transparent transition-colors"></div>
                    <Sparkles className="h-6 w-6 relative z-10" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 group-hover:text-[#00a8ff] transition-colors">Our Vision</h4>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      A campus transformed by the Gospel, producing graduates who excel spiritually and academically nationwide.
                    </p>
                  </div>
                </div>

                {/* Core Values */}
                <div className="group flex gap-5 items-start">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#00a8ff] group-hover:border-sky-200 group-hover:bg-sky-50 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00a8ff]/0 to-[#00a8ff]/0 group-hover:from-[#00a8ff]/10 group-hover:to-transparent transition-colors"></div>
                    <BookOpen className="h-6 w-6 relative z-10" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 group-hover:text-[#00a8ff] transition-colors">Core Values</h4>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      Faith, Academic Discipline, Integrity, Fellowship, and Unwavering Commitment to God&apos;s Word.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Images (Premium Layered Composition) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative h-[450px] sm:h-[550px] w-full mt-10 lg:mt-0"
            >
              {/* Background Dot Pattern Accent */}
              <div className="absolute -right-8 -top-8 h-40 w-40 bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:16px_16px] z-0 opacity-60"></div>
              
              {/* Main Large Image */}
              <div className="absolute right-0 top-0 h-[380px] sm:h-[460px] w-[85%] overflow-hidden rounded-[2rem] shadow-2xl z-10 bg-slate-100">
                <div className="absolute inset-0 bg-[#00a8ff]/5 mix-blend-overlay z-10" />
                <Image
                  src="/gallery/gallery-1.jpg"
                  alt="Worship at ECCF"
                  fill
                  sizes="(max-width: 1024px) 85vw, 50vw"
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              
              {/* Overlapping Smaller Image */}
              <div className="absolute left-0 bottom-0 h-[220px] sm:h-[280px] w-[60%] overflow-hidden rounded-3xl border-[8px] sm:border-[12px] border-white shadow-xl z-20 bg-slate-100">
                <Image
                  src="/gallery/gallery-2.jpg"
                  alt="Student Prayer Session"
                  fill
                  sizes="(max-width: 1024px) 60vw, 30vw"
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.4 SERVICE TIMES & LOCATION                                              */}
      {/* ========================================================================= */}
      <section className="py-24 border-t border-slate-200/60 bg-[#f8fafc]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff] flex items-center justify-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5 text-[#00a8ff]" />
              <span>WEEKLY SCHEDULE</span>
            </span>
            <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">
              Service Times & Location
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Join us weekly on campus. Save or screenshot our fellowship hours!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {[
              {
                name: 'Sunday Service',
                day: 'SUNDAY',
                time: '08:00 AM',
                subtitle: 'Praise, Worship & Word',
                icon: Sun,
              },
              {
                name: 'Word Service',
                day: 'WEDNESDAY',
                time: '04:50 PM',
                subtitle: 'Deep Scripture Exposition',
                icon: BookOpen,
              },
              {
                name: 'Academic Challenge / Wonder Service',
                day: 'FRIDAY',
                time: '04:50 PM',
                subtitle: 'Academic Prayer & Empowerment',
                icon: GraduationCap,
              },
            ].map((service, idx) => {
              const Icon = service.icon
              return (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm hover:shadow-xl hover:shadow-sky-500/10 transition-all hover:border-sky-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 text-[#00a8ff] border border-sky-100 px-3.5 py-1 text-xs font-black uppercase tracking-wider">
                      <Calendar className="h-3 w-3" />
                      {service.day}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 leading-snug min-h-[3.25rem] flex items-center">
                    {service.name}
                  </h3>

                  <p className="text-xs text-slate-500 font-medium mb-6">
                    {service.subtitle}
                  </p>

                  <div className="flex items-center gap-3 rounded-2xl bg-sky-50/60 border border-sky-100 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00a8ff] text-white shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        START TIME
                      </span>
                      <span className="text-2xl font-black text-[#0069B0] tracking-tight">
                        {service.time}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )})}
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
            <MapPin className="h-5 w-5 text-[#0069B0]" />
            <span>Campus Fellowship Hall — </span>
            <Link href="#" className="text-[#0069B0] hover:underline font-semibold">View on Google Maps</Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.5 INTEGRATED TEAMS & FELLOWSHIP LIFE GALLERY                            */}
      {/* ========================================================================= */}
      <TeamsSection />

      {/* ========================================================================= */}
      {/* SERMON VAULT                                                              */}
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
              },
              {
                tag: 'CAMPUS GIANTS',
                title: 'The Discipline of the Anointed Student',
                speaker: 'Sis. Grace Iyamu',
                date: 'June 29, 2025',
                duration: '52 min',
              },
              {
                tag: 'POWER & PRAYER',
                title: 'Praying with Authority',
                speaker: 'Bro. Samuel Edosa',
                date: 'June 22, 2025',
                duration: '45 min',
              },
            ].map((sermon, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-lg hover:shadow-sky-500/10 cursor-pointer"
              >
                <div className="relative h-40 w-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center p-4">
                  <div className="absolute top-3 right-3 rounded-full bg-slate-900 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{sermon.duration}</span>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00a8ff] text-white shadow-lg"
                  >
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  </motion.div>
                </div>

                <div className="p-6">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#00a8ff]">
                    {sermon.tag}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2 group-hover:text-[#00a8ff] transition-colors leading-snug">
                    {sermon.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-4">
                    {sermon.speaker} &bull; {sermon.date}
                  </p>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0069B0] hover:underline"
                  >
                    <Play className="h-3.5 w-3.5 fill-[#0069B0]" />
                    <span>Listen Now</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* HIGH-IMPACT CONVERSION BANNER (GLOBAL GIVING HUB)                          */}
      {/* ========================================================================= */}
      <GivingHubSection />

      {/* ========================================================================= */}
      {/* 2.6 PLAN A VISIT                                                          */}
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
          <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            We would love to welcome you in person! Whether you&apos;re a fresh student or a returning scholar, expect a warm welcome, powerful worship, and zero pressure.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="mailto:edsuchristiancampusfellowship@gmail.com?subject=Planning%20a%20Visit"
              className="w-full sm:w-auto rounded-full bg-[#00a8ff] hover:bg-[#0092e0] text-white font-bold px-8 py-3.5 text-sm shadow-md shadow-sky-500/20 transition-all"
            >
              Plan a Visit
            </motion.a>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Link
                href="/give"
                className="block w-full sm:w-auto rounded-full border border-slate-300 bg-white text-slate-700 font-bold px-8 py-3.5 text-sm hover:bg-slate-50 transition-all"
              >
                Give Online
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

    </div>
  )
}
