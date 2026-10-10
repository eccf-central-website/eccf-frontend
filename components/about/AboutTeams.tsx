/**
 * AboutTeams — All 14 Fellowship Operational Teams (Relocated from Homepage)
 *
 * Implements:
 * - Complete 14-unit canonical operational team roster
 * - Live Sanity integration with fallback content
 * - TPUSA-style category filtering (All, Spiritual, Music & Arts, Logistics & Care, Media & Academics)
 * - Search bar for quick filtering
 * - Direct "Join Team" action linking to worker onboarding registration
 */

'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, ArrowUpRight } from 'lucide-react'

export interface OperationalTeam {
  _id?: string
  name: string
  tag?: string
  role?: string
  description: string
  imageUrl?: string
  category: 'spiritual' | 'music_arts' | 'logistics' | 'media_academic'
}

interface AboutTeamsProps {
  teams?: {
    _id: string
    name: string
    tag?: string
    role?: string
    description: string
    imageUrl?: string
  }[] | null
  headline?: string
  lead?: string
}

// Canonical 14 Fellowship Operational Teams with rich details and categories
const CANONICAL_14_TEAMS: OperationalTeam[] = [
  {
    name: 'Bible Study/Sunday School Team',
    tag: 'DOCTRINE & DISCIPLESHIP',
    role: 'Discipleship & Exposition',
    category: 'spiritual',
    description:
      'Anchors weekly word exposition, outlines interactive Bible study modules, and equips students with sound scriptural foundations to defend their Christian faith.',
    imageUrl: '/gallery/gallery-4.jpg',
  },
  {
    name: 'Prayer Team',
    tag: 'INTERCESSION & REVIVAL',
    role: 'Intercessory Warfare',
    category: 'spiritual',
    description:
      'Maintains round-the-clock spiritual fire on campus through intercessory watches, midnight vigils, praying through fellowship services, and spiritual shielding.',
    imageUrl: '/gallery/gallery-2.jpg',
  },
  {
    name: 'Protocol Team',
    tag: 'ORDER & MINISTERIAL CARE',
    role: 'Ministerial Protocol & Security',
    category: 'logistics',
    description:
      'Ensures divine order, ministerial hospitality, guest reception, pulpit coordination, and seamless logistics during central services and campus conferences.',
    imageUrl: '/gallery/gallery-5.jpg',
  },
  {
    name: 'Financial Team',
    tag: 'STEWARDSHIP & INTEGRITY',
    role: 'Financial Administration',
    category: 'logistics',
    description:
      'Stewards fellowship resources with impeccable integrity, managing accounting ledgers, project disbursements, sacrificial giving records, and financial audits.',
    imageUrl: '/gallery/gallery-6.jpg',
  },
  {
    name: 'Choir Team',
    tag: 'PRAISE & WORSHIP',
    role: 'Vocal Ministry & Psalmists',
    category: 'music_arts',
    description:
      'Leads the campus congregation into the manifest presence of God through anointed choral anthems, contemporary gospel praise, and passionate worship.',
    imageUrl: '/gallery/gallery-1.jpg',
  },
  {
    name: 'Ushering Team',
    tag: 'WARMTH & AUDIENCE CARE',
    role: 'Sanctuary Hospitality',
    category: 'logistics',
    description:
      'Welcomes students with radiant Christian love, manages auditorium seating, coordinates tithe and offering collections, and maintains sanctuary decorum.',
    imageUrl: '/gallery/gallery-7.jpg',
  },
  {
    name: 'Drama/Creative Media Team',
    tag: 'FAITH ON STAGE',
    role: 'Theatrical Evangelism',
    category: 'music_arts',
    description:
      'Preaches Christ through anointed theatrical plays, dramatic monologues, spoken word poetry, and creative storytelling that bring the Gospel to life.',
    imageUrl: '/gallery/gallery-8.jpg',
  },
  {
    name: 'Outreach Team',
    tag: 'EVANGELISM & MISSIONS',
    role: 'Campus Soul-Winning',
    category: 'spiritual',
    description:
      'Spearheads aggressive hostel-to-hostel evangelism campaigns, campus gospel invasions, rural missionary trips, and fresher evangelism outreaches.',
    imageUrl: '/gallery/gallery-9.jpg',
  },
  {
    name: 'Welfare/Medical Team',
    tag: 'COMPASSION & STUDENT CARE',
    role: 'Practical Christian Benevolence',
    category: 'logistics',
    description:
      'The compassionate heartbeat of ECCF on campus, providing food support, emergency financial aid, hospital visits, and health guidance to students in need.',
    imageUrl: '/gallery/gallery-10.jpg',
  },
  {
    name: 'Academic Team',
    tag: 'SCHOLARSHIP & MENTORSHIP',
    role: 'Academic Distinction',
    category: 'media_academic',
    description:
      'Drives peer tutorial groups, organizes pre-exam bootcamps, provides study materials, and mentors undergraduates to attain First Class academic distinction.',
    imageUrl: '/gallery/gallery-11.jpg',
  },
  {
    name: 'Colporteur/Library Team',
    tag: 'CHRISTIAN LITERATURE',
    role: 'Resource Distribution',
    category: 'media_academic',
    description:
      'Curates the fellowship lending library, disseminates Christian books, Bibles, and spiritually enriching literature to foster deep intellectual devotion.',
    imageUrl: '/gallery/gallery-12.jpg',
  },
  {
    name: 'Technical Team',
    tag: 'SOUND & POWER SYSTEMS',
    role: 'Audio Engineering',
    category: 'media_academic',
    description:
      'Manages high-fidelity live sound consoles, stage microphones, electrical power distribution, and stage equipment to deliver crisp acoustic experiences.',
    imageUrl: '/gallery/gallery-13.jpg',
  },
  {
    name: 'Media Team',
    tag: 'LIVESTREAM & DIGITAL OUTREACH',
    role: 'Digital Ministry & Media Production',
    category: 'media_academic',
    description:
      'Broadcasts services live to the world, captures high-definition photography, edits video recaps, and produces digital flyers to saturate social media with Christ.',
    imageUrl: '/gallery/gallery-14.jpg',
  },
  {
    name: 'Decoration Team',
    tag: 'SANCTUARY BEAUTIFICATION',
    role: 'Visual Atmosphere & Aesthetics',
    category: 'music_arts',
    description:
      'Transforms fellowship auditoriums and conference venues into breathtaking atmospheres of worship that reflect the beauty, majesty, and order of God.',
    imageUrl: '/gallery/gallery-15.jpg',
  },
]

export default function AboutTeams({ teams, headline, lead }: AboutTeamsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Merge live Sanity data if present with canonical roster
  const allTeams: OperationalTeam[] = useMemo(() => {
    if (!teams || teams.length === 0) return CANONICAL_14_TEAMS

    return CANONICAL_14_TEAMS.map((canon) => {
      const match = teams.find(
        (t) =>
          t.name.toLowerCase().includes(canon.name.toLowerCase()) ||
          canon.name.toLowerCase().includes(t.name.toLowerCase())
      )
      if (match) {
        return {
          ...canon,
          description: match.description || canon.description,
          imageUrl: match.imageUrl || canon.imageUrl,
          tag: match.tag || canon.tag,
          role: match.role || canon.role,
        }
      }
      return canon
    })
  }, [teams])

  const filteredTeams = useMemo(() => {
    return allTeams.filter((team) => {
      const matchesCategory =
        activeCategory === 'all' || team.category === activeCategory
      const matchesSearch =
        searchQuery.trim() === '' ||
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.tag && team.tag.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesCategory && matchesSearch
    })
  }, [allTeams, activeCategory, searchQuery])

  return (
    <section id="teams" className="py-16 sm:py-24 bg-[#fafaf9] relative overflow-hidden border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-left md:text-center max-w-3xl md:mx-auto mb-10 sm:mb-16"
        >
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-widest text-[#0077cc] uppercase font-mono mb-3">
            <Users className="h-4 w-4" />
            OPERATIONAL UNITS &amp; WORKFORCE
          </span>
          <h2 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-tight">
            {headline || 'Find Your Place to Serve & Lead.'}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
            {lead ||
              'Every university student has a God-given gift. Discover where your passion intersects with kingdom impact across our 14 specialized operational teams.'}
          </p>
        </motion.div>

        {/* TPUSA-Style Filter & Search Bar */}
        <div className="mb-10 sm:mb-12 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Category Pills — Wrap cleanly, zero scrollbars on mobile and desktop */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: 'all', label: `All Units (${allTeams.length})` },
              { id: 'spiritual', label: 'Spiritual & Prayer' },
              { id: 'music_arts', label: 'Music & Creative Arts' },
              { id: 'logistics', label: 'Logistics & Care' },
              { id: 'media_academic', label: 'Media & Academics' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  activeCategory === cat.id
                    ? 'bg-slate-950 text-white shadow-sm font-bold'
                    : 'bg-white border border-stone-200 text-slate-600 hover:text-slate-900 hover:bg-stone-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px] md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team or keyword..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-stone-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0077cc]/20 focus:border-[#0077cc]"
            />
          </div>
        </div>

        {/* 3-Column Team Cards Grid */}
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {filteredTeams.map((team, idx) => (
              <motion.div
                layout
                key={team.name}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, delay: idx * 0.03 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group flex flex-col justify-between overflow-hidden rounded-[24px] bg-white border border-stone-200 shadow-sm hover:shadow-xl transition-all"
              >
                <div>
                  {/* Photo with Overlay */}
                  <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-slate-900 flex items-center justify-center">
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

                    {/* Tag Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10">
                        {team.tag || 'MINISTRY TEAM'}
                      </span>
                    </div>

                    {/* Bottom overlay titles */}
                    <div className="absolute bottom-4 left-5 right-5 text-white">
                      {team.role && (
                        <span className="text-xs font-semibold text-sky-300 block uppercase tracking-wider mb-0.5">
                          {team.role}
                        </span>
                      )}
                      <h3 className="font-serif font-bold text-xl sm:text-2xl text-white leading-tight">
                        {team.name}
                      </h3>
                    </div>
                  </div>

                  {/* Body & Description */}
                  <div className="p-6">
                    <p className="text-sm text-slate-700 leading-relaxed font-normal">
                      {team.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="px-6 pb-6 pt-3 flex items-center justify-between border-t border-stone-100">
                  <span className="text-[11px] font-semibold text-slate-400">Open to all students</span>
                  <Link
                    href={`/register?team=${encodeURIComponent(team.name)}`}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0077cc] group-hover:text-sky-800 transition-colors"
                  >
                    <span>Join Team</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  )
}
