/**
 * AboutLeadership — Comprehensive Executive & Ministerial Leadership Gallery
 *
 * Implements:
 * - 6 Hierarchical Leadership Sections:
 *   1. Patrons (Dr. Andrew Ate, Dr. Matthew & Dr. Emmanuel Okla)
 *   2. Resident Pastor (Pastor Samuel Adebayo-Adesina)
 *   3. CSGB (Central Student Governing Body)
 *   4. Hall Pastors (Halls 1 through 8)
 *   5. Operational Team Leaders
 *   6. Assistant Team Leaders
 * - JNAC-inspired 3:4 portrait cards with Playfair serif names & metallic badges
 * - Grand initials monograms for officers awaiting photography
 * - Strict removal of personal hall labels (no student room/hostel exposure)
 * - Seamless, gradual scroll transition from light (#fafaf9) to dark (#0d1117)
 * - Mobile-first 2-column portrait grid with horizontal-scrolling category pills
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Shield, Sparkles, BookOpen, Users, Church, Compass, Award } from 'lucide-react'

export interface LeaderCard {
  _id?: string
  fullName: string
  excoPosition?: string
  role?: string
  teamName?: string
  profileImageUrl?: string
  bio?: string
  badgeLabel?: string
}

export type ExcoMember = LeaderCard

interface AboutLeadershipProps {
  excos?: LeaderCard[] | null
  headline?: string
  lead?: string
}

// ---------------------------------------------------------------------------
// 1. Patrons (Faculty Mentors & Patrons)
// ---------------------------------------------------------------------------
const PATRONS_LIST: LeaderCard[] = [
  {
    _id: 'patron-1',
    fullName: 'Dr. Andrew Ate',
    excoPosition: 'Patron & Senior Staff Adviser',
    teamName: 'Board of Patrons',
    bio: 'Distinguished academic mentor, university scholar, and spiritual patron providing counsel, institutional wisdom, and faculty backing for ECCF.',
    badgeLabel: 'STAFF PATRON',
  },
  {
    _id: 'patron-2',
    fullName: 'Dr. Matthew & Dr. Emmanuel Okla',
    excoPosition: 'Patrons & Faculty Mentors',
    teamName: 'Board of Patrons',
    bio: 'Senior academic and spiritual patrons steering student mentorship, academic scholarship integrity, and kingdom fellowship support at Edo State University.',
    badgeLabel: 'PATRONS',
  },
]

// ---------------------------------------------------------------------------
// 2. Resident Pastor (Spiritual Oversight)
// ---------------------------------------------------------------------------
const RESIDENT_PASTOR: LeaderCard = {
  _id: 'pastor-1',
  fullName: 'Pastor Samuel Adebayo-Adesina',
  excoPosition: 'Resident Pastor & Spiritual Father',
  teamName: 'Pastoral Council',
  bio: 'Provides apostolic direction, pulpit ministration, spiritual covering, and pastoral fatherhood over the student body and fellowship leadership across all colleges.',
  badgeLabel: 'RESIDENT PASTOR',
}

// ---------------------------------------------------------------------------
// 3. CSGB (Central Student Governing Body)
// ---------------------------------------------------------------------------
const CSGB_LIST: LeaderCard[] = [
  {
    _id: 'csgb-1',
    fullName: 'Fellowship President',
    excoPosition: 'President & Executive Shepherd',
    teamName: "Christian Students' Governing Board",
    bio: 'Oversees the apostolic vision, pastoral direction, constitutional integrity, and central campus governance of ECCF at Edo State University.',
    badgeLabel: 'CSGB PRESIDENT',
  },
  {
    _id: 'csgb-2',
    fullName: 'Vice President (Admin)',
    excoPosition: "VP - Admin / Brothers' Coordinator",
    teamName: 'Executive Administration',
    bio: "Coordinates administrative operations, inter-departmental logistics, and men's fellowship discipleship across male hostels.",
    badgeLabel: 'CSGB VP ADMIN',
  },
  {
    _id: 'csgb-3',
    fullName: 'Vice President (Evangelism)',
    excoPosition: "VP - Evangelism / Sisters' Coordinator",
    teamName: 'Campus Evangelism',
    bio: "Spearheads campus soul-winning initiatives, hostel outreaches, and women's discipleship across female hostels.",
    badgeLabel: 'CSGB VP EVANGELISM',
  },
  {
    _id: 'csgb-4',
    fullName: 'General Secretary',
    excoPosition: 'General Secretary',
    teamName: 'Secretariat & Records',
    bio: 'Custody of fellowship records, constitutional adherence, executive minutes, official correspondence, and registry.',
    badgeLabel: 'CSGB SECRETARY',
  },
  {
    _id: 'csgb-5',
    fullName: 'Prayer Coordinator',
    excoPosition: 'Prayer Coordinator',
    teamName: 'Prayer & Intercession',
    bio: 'Kindles continuous corporate intercessory fire, midnight prayer vigils, fasting programmes, and service coverage.',
    badgeLabel: 'CSGB PRAYER',
  },
  {
    _id: 'csgb-6',
    fullName: 'Financial Secretary',
    excoPosition: 'Financial Secretary',
    teamName: 'Finance & Treasury',
    bio: 'Directs financial stewardship, ledger reconciliation, budget allocations, and sacrificial giving accountability.',
    badgeLabel: 'CSGB FINANCE',
  },
]

// ---------------------------------------------------------------------------
// 4. Hall Pastors (Pastoral Shepherds across Halls 1 to 8)
// ---------------------------------------------------------------------------
const HALL_PASTORS: LeaderCard[] = [
  {
    _id: 'hp-1',
    fullName: 'Hall 1 Pastor',
    excoPosition: 'Pastoral Shepherd — Hall 1',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 1',
  },
  {
    _id: 'hp-2',
    fullName: 'Hall 2 Pastor',
    excoPosition: 'Pastoral Shepherd — Hall 2',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 2',
  },
  {
    _id: 'hp-3',
    fullName: 'Hall 3 Pastor',
    excoPosition: 'Pastoral Shepherd — Hall 3',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 3',
  },
  {
    _id: 'hp-4',
    fullName: 'Hall 4 Pastor',
    excoPosition: 'Pastoral Shepherd — Hall 4',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 4',
  },
  {
    _id: 'hp-5',
    fullName: 'Hall 5 Pastor',
    excoPosition: 'Pastoral Shepherd — Hall 5',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 5',
  },
  {
    _id: 'hp-6',
    fullName: 'Hall 6 Pastor',
    excoPosition: 'Pastoral Shepherd — Hall 6',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 6',
  },
  {
    _id: 'hp-7',
    fullName: 'Hall 7 Pastor',
    excoPosition: 'Pastoral Shepherd — Hall 7',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 7',
  },
  {
    _id: 'hp-8',
    fullName: 'Hall 8 Pastor',
    excoPosition: 'Pastoral Shepherd — Hall 8',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 8',
  },
]

// ---------------------------------------------------------------------------
// 5. Team Leaders (Directors of the 14 Operational Wings)
// ---------------------------------------------------------------------------
const TEAM_LEADERS: LeaderCard[] = [
  {
    _id: 'tl-1',
    fullName: 'Bible Study Team Lead',
    excoPosition: 'Discipleship & Bible Study Lead',
    teamName: 'Bible Study / Sunday School Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-2',
    fullName: 'Prayer Team Lead',
    excoPosition: 'Head Intercessor & Altar Lead',
    teamName: 'Prayer Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-3',
    fullName: 'Choir & Music Director',
    excoPosition: 'Head of Psalmists & Music Ministry',
    teamName: 'Choir Team',
    badgeLabel: 'DIRECTOR',
  },
  {
    _id: 'tl-4',
    fullName: 'Protocol Team Lead',
    excoPosition: 'Ministerial Protocol Coordinator',
    teamName: 'Protocol Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-5',
    fullName: 'Ushering Team Lead',
    excoPosition: 'Sanctuary Hospitality Head',
    teamName: 'Ushering Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-6',
    fullName: 'Drama & Creative Media Lead',
    excoPosition: 'Theatrical Evangelism Director',
    teamName: 'Drama / Creative Media Team',
    badgeLabel: 'DIRECTOR',
  },
  {
    _id: 'tl-7',
    fullName: 'Outreach Team Lead',
    excoPosition: 'Campus Soul-Winning Coordinator',
    teamName: 'Outreach Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-8',
    fullName: 'Welfare & Medical Lead',
    excoPosition: 'Student Welfare & Benevolence Head',
    teamName: 'Welfare / Medical Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-9',
    fullName: 'Academic Team Lead',
    excoPosition: 'Academic Mentorship & Tutorial Director',
    teamName: 'Academic Team',
    badgeLabel: 'DIRECTOR',
  },
  {
    _id: 'tl-10',
    fullName: 'Colporteur & Library Lead',
    excoPosition: 'Christian Literature & Library Head',
    teamName: 'Colporteur / Library Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-11',
    fullName: 'Technical Team Lead',
    excoPosition: 'Sound & Acoustic Systems Head',
    teamName: 'Technical Team',
    badgeLabel: 'DIRECTOR',
  },
  {
    _id: 'tl-12',
    fullName: 'Media Team Lead',
    excoPosition: 'Digital Broadcast & Media Head',
    teamName: 'Media Team',
    badgeLabel: 'DIRECTOR',
  },
  {
    _id: 'tl-13',
    fullName: 'Decoration Team Lead',
    excoPosition: 'Sanctuary Aesthetics & Ambience Head',
    teamName: 'Decoration Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-14',
    fullName: 'Financial Team Lead',
    excoPosition: 'Treasury & Ledger Audit Lead',
    teamName: 'Financial Team',
    badgeLabel: 'TEAM LEAD',
  },
]

// ---------------------------------------------------------------------------
// 6. Assistant Team Leaders (Deputies supporting each wing)
// ---------------------------------------------------------------------------
const ASSISTANT_TEAM_LEADERS: LeaderCard[] = [
  {
    _id: 'atl-1',
    fullName: 'Assistant Bible Study Lead',
    excoPosition: 'Assistant Bible Study Coordinator',
    teamName: 'Bible Study / Sunday School Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-2',
    fullName: 'Assistant Prayer Lead',
    excoPosition: 'Assistant Intercessory Lead',
    teamName: 'Prayer Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-3',
    fullName: 'Assistant Choir Director',
    excoPosition: 'Assistant Music Director',
    teamName: 'Choir Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-4',
    fullName: 'Assistant Protocol Lead',
    excoPosition: 'Assistant Protocol Coordinator',
    teamName: 'Protocol Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-5',
    fullName: 'Assistant Ushering Lead',
    excoPosition: 'Assistant Ushering Head',
    teamName: 'Ushering Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-6',
    fullName: 'Assistant Drama Lead',
    excoPosition: 'Assistant Drama Director',
    teamName: 'Drama / Creative Media Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-7',
    fullName: 'Assistant Outreach Lead',
    excoPosition: 'Assistant Evangelism Coordinator',
    teamName: 'Outreach Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-8',
    fullName: 'Assistant Welfare Lead',
    excoPosition: 'Assistant Student Welfare Head',
    teamName: 'Welfare / Medical Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-9',
    fullName: 'Assistant Academic Lead',
    excoPosition: 'Assistant Academic Tutorial Director',
    teamName: 'Academic Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-10',
    fullName: 'Assistant Colporteur Lead',
    excoPosition: 'Assistant Literature Head',
    teamName: 'Colporteur / Library Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-11',
    fullName: 'Assistant Technical Lead',
    excoPosition: 'Assistant Audio Engineering Lead',
    teamName: 'Technical Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-12',
    fullName: 'Assistant Media Lead',
    excoPosition: 'Assistant Digital Media Coordinator',
    teamName: 'Media Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-13',
    fullName: 'Assistant Decoration Lead',
    excoPosition: 'Assistant Sanctuary Aesthetics Lead',
    teamName: 'Decoration Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-14',
    fullName: 'Assistant Financial Lead',
    excoPosition: 'Assistant Treasury Administrator',
    teamName: 'Financial Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
]

type LeaderTier =
  | 'all'
  | 'patrons'
  | 'pastor'
  | 'csgb'
  | 'hall_pastors'
  | 'team_leaders'
  | 'assistant_leaders'

export default function AboutLeadership({
  headline,
  lead,
}: AboutLeadershipProps) {
  const [activeTier, setActiveTier] = useState<LeaderTier>('all')

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter((w) => !['Dr.', 'Pastor', '&', 'and'].includes(w))
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'LD'
  }

  // Render helper for single 3:4 portrait card
  const renderCard = (leader: LeaderCard, idx: number, badgeAccent?: string) => {
    const initials = getInitials(leader.fullName)

    return (
      <motion.div
        layout
        key={leader._id || leader.fullName + idx}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, delay: idx * 0.03 }}
        whileHover={{ y: -6, transition: { duration: 0.2 } }}
        className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl sm:rounded-3xl bg-slate-900 border border-slate-800 hover:border-sky-400/50 shadow-md hover:shadow-2xl transition-all cursor-pointer"
      >
        {/* Photo or Monogram Fallback */}
        {leader.profileImageUrl ? (
          <Image
            src={leader.profileImageUrl}
            alt={leader.fullName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-slate-400 p-3 text-center">
            <span className="font-serif text-3xl sm:text-5xl font-bold text-sky-400/70 tracking-wider">
              {initials}
            </span>
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-slate-500">
              Leadership
            </span>
          </div>
        )}

        {/* Top Office Badge */}
        <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 z-20">
          <span
            className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${
              badgeAccent
                ? badgeAccent
                : 'bg-black/60 backdrop-blur-md text-slate-200 border border-white/10'
            }`}
          >
            {leader.badgeLabel || 'EXECUTIVE'}
          </span>
        </div>

        {/* Gradient Overlay (JNAC Signature Style) */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex flex-col justify-end p-3 sm:p-5 text-left">
          <span className="text-[10px] sm:text-xs font-semibold text-sky-300 uppercase tracking-wider block mb-0.5 sm:mb-1 truncate">
            {leader.excoPosition || 'Ministerial Leader'}
          </span>

          <h4 className="font-serif font-bold text-sm sm:text-lg text-white leading-tight mb-1 line-clamp-2">
            {leader.fullName}
          </h4>

          <div className="text-[9px] sm:text-[11px] text-slate-400 font-mono mt-0.5 pt-1.5 sm:mt-1 sm:pt-2 border-t border-white/10 truncate">
            <span>{leader.teamName}</span>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <section
      id="leadership"
      className="pt-24 sm:pt-36 pb-16 sm:pb-24 bg-[#0d1117] text-white relative overflow-hidden"
    >
      {/* ================================================================ */}
      {/* GRADUAL SCROLL TRANSITION: Light (#fafaf9) smoothly dissolves   */}
      {/* into midnight dark (#0d1117) with zero harsh line               */}
      {/* ================================================================ */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-44 sm:h-64 bg-gradient-to-b from-[#fafaf9] via-[#0f172a] via-50% to-[#0d1117] pointer-events-none -mt-px z-0"
      />

      {/* Bottom gradual transition back into Teams section (#fafaf9) */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-36 sm:h-52 bg-gradient-to-b from-transparent via-[#0d1117]/80 to-[#fafaf9] pointer-events-none -mb-px z-0"
      />

      {/* Background ambient lighting */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#0095ff]/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 relative z-10">
        
        {/* ================================================================ */}
        {/* SECTION HEADER — Grand & Authoritative                           */}
        {/* ================================================================ */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="text-left max-w-2xl"
          >
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-widest text-sky-400 uppercase font-mono mb-3">
              <Shield className="h-4 w-4" />
              OUR TEAM &amp; MINISTERIAL HIERARCHY
            </span>
            <h2 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              {headline || 'Stewards of the Vision & Altar.'}
            </h2>
            <p className="mt-4 text-base sm:text-xl text-slate-300 leading-relaxed font-normal">
              {lead ||
                'Meet the distinguished patrons, resident pastor, student governing executives, hall pastors, and operational leaders who guide our fellowship life.'}
            </p>
          </motion.div>

          {/* Category Filter Pills — Wrap cleanly with zero scrollbars on mobile and desktop */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-start md:self-end max-w-2xl">
            {[
              { id: 'all', label: 'All Leadership' },
              { id: 'patrons', label: 'Patrons' },
              { id: 'pastor', label: 'Resident Pastor' },
              { id: 'csgb', label: 'CSGB' },
              { id: 'hall_pastors', label: 'Hall Pastors' },
              { id: 'team_leaders', label: 'Team Leaders' },
              { id: 'assistant_leaders', label: 'Assistant Leads' },
            ].map((tab) => {
              const isActive = activeTier === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTier(tab.id as LeaderTier)}
                  className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-[#0095ff] text-white shadow-md shadow-sky-500/25 font-bold ring-2 ring-sky-400/30'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ================================================================ */}
        {/* TIER 1: BOARD OF PATRONS                                         */}
        {/* ================================================================ */}
        {(activeTier === 'all' || activeTier === 'patrons') && (
          <div className="mb-14 sm:mb-20">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/10 text-left">
              <Award className="h-5 w-5 text-amber-400" />
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-tight">
                Board of Patrons &amp; Staff Advisers
              </h3>
              <span className="text-xs font-mono text-slate-400 ml-auto hidden sm:inline-block">
                Institutional &amp; Faculty Mentorship
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5 sm:gap-8 max-w-4xl mx-auto">
              {PATRONS_LIST.map((patron, idx) => (
                <motion.div
                  layout
                  key={patron.fullName + idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 border border-amber-500/30 p-6 sm:p-8 text-left shadow-xl"
                >
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-4">
                    <Sparkles className="h-3 w-3" />
                    <span>{patron.badgeLabel}</span>
                  </div>

                  <h4 className="font-serif font-bold text-2xl sm:text-3xl text-white leading-tight mb-2">
                    {patron.fullName}
                  </h4>

                  <span className="text-xs sm:text-sm font-semibold text-sky-400 block mb-4 uppercase tracking-wide">
                    {patron.excoPosition}
                  </span>

                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    {patron.bio}
                  </p>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{patron.teamName}</span>
                    <span className="text-amber-400 font-bold">EDSU Iyamho</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TIER 2: RESIDENT PASTOR (Featured Hero Card)                     */}
        {/* ================================================================ */}
        {(activeTier === 'all' || activeTier === 'pastor') && (
          <div className="mb-14 sm:mb-20">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/10 text-left">
              <Church className="h-5 w-5 text-sky-400" />
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-tight">
                Resident Pastor &amp; Spiritual Oversight
              </h3>
              <span className="text-xs font-mono text-slate-400 ml-auto hidden sm:inline-block">
                Pastoral Leadership &amp; Ministry
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55 }}
              className="overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 border border-sky-500/30 shadow-2xl relative group"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                {/* Pastor Portrait or Monogram */}
                <div className="lg:col-span-5 relative aspect-[4/5] lg:aspect-auto lg:h-[460px] w-full bg-slate-950 overflow-hidden">
                  {RESIDENT_PASTOR.profileImageUrl ? (
                    <Image
                      src={RESIDENT_PASTOR.profileImageUrl}
                      alt={RESIDENT_PASTOR.fullName}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-500 p-6 text-center">
                      <span className="font-serif text-5xl sm:text-7xl font-bold text-sky-400/80 tracking-wider">
                        SA
                      </span>
                      <span className="font-mono text-xs uppercase tracking-widest text-sky-300/60">
                        Resident Pastorate
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent lg:hidden" />
                </div>

                {/* Pastor Bio & Mandate */}
                <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 space-y-4 sm:space-y-6 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>SPIRITUAL HEAD &bull; RESIDENT PASTOR</span>
                  </div>

                  <div>
                    <h3 className="font-serif font-black text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                      {RESIDENT_PASTOR.fullName}
                    </h3>
                    <span className="text-sm sm:text-base font-semibold text-sky-400 block mt-1.5 uppercase tracking-wide">
                      {RESIDENT_PASTOR.excoPosition}
                    </span>
                  </div>

                  <p className="text-sm sm:text-lg text-slate-300 leading-relaxed font-normal">
                    {RESIDENT_PASTOR.bio}
                  </p>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs sm:text-sm text-slate-400 font-mono">
                    <span>{RESIDENT_PASTOR.teamName}</span>
                    <span className="text-amber-300 font-bold">Spiritual Fatherhood</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TIER 3: CENTRAL STUDENT GOVERNING BODY (CSGB)                    */}
        {/* ================================================================ */}
        {(activeTier === 'all' || activeTier === 'csgb') && (
          <div className="mb-14 sm:mb-20">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/10 text-left">
              <Shield className="h-5 w-5 text-sky-400" />
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-tight">
                Central Student Governing Body (CSGB)
              </h3>
              <span className="text-xs font-mono text-slate-400 ml-auto hidden sm:inline-block">
                Executive Student Governance
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-6">
              {CSGB_LIST.map((officer, idx) =>
                renderCard(officer, idx, 'bg-[#0095ff] text-white shadow-sm')
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TIER 4: RESIDENCE HALL PASTORS (Halls 1 to 8)                     */}
        {/* ================================================================ */}
        {(activeTier === 'all' || activeTier === 'hall_pastors') && (
          <div className="mb-14 sm:mb-20">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/10 text-left">
              <Compass className="h-5 w-5 text-emerald-400" />
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-tight">
                Residence Hall Pastors
              </h3>
              <span className="text-xs font-mono text-slate-400 ml-auto hidden sm:inline-block">
                Pastoral Care Across Halls 1 to 8
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {HALL_PASTORS.map((hp, idx) =>
                renderCard(hp, idx, 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30')
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TIER 5: OPERATIONAL TEAM LEADERS                                 */}
        {/* ================================================================ */}
        {(activeTier === 'all' || activeTier === 'team_leaders') && (
          <div className="mb-14 sm:mb-20">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/10 text-left">
              <Users className="h-5 w-5 text-sky-400" />
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-tight">
                Operational Team Leaders
              </h3>
              <span className="text-xs font-mono text-slate-400 ml-auto hidden sm:inline-block">
                Heads of Specialized Service Units
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {TEAM_LEADERS.map((tl, idx) =>
                renderCard(tl, idx, 'bg-slate-800 text-sky-300 border border-sky-400/20')
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TIER 6: ASSISTANT TEAM LEADERS                                   */}
        {/* ================================================================ */}
        {(activeTier === 'all' || activeTier === 'assistant_leaders') && (
          <div className="mb-14 sm:mb-20">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/10 text-left">
              <BookOpen className="h-5 w-5 text-purple-400" />
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-tight">
                Assistant Team Leaders
              </h3>
              <span className="text-xs font-mono text-slate-400 ml-auto hidden sm:inline-block">
                Deputy Heads Supporting Service Units
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {ASSISTANT_TEAM_LEADERS.map((atl, idx) =>
                renderCard(atl, idx, 'bg-purple-500/20 text-purple-300 border border-purple-500/30')
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
