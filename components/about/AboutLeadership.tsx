/**
 * AboutLeadership — "Our Team" / Executive Leadership (CSGB & Ministry Directors)
 *
 * Inspired by Justice Nsima Akpabio Chambers (jnac.com.ng/leadership):
 * - Grand 3:4 portrait cards with full-bleed photography
 * - Featured President executive card commanding presence and vision
 * - High-contrast Playfair serif typography, gold/sky blue insignia badges
 * - Fully mobile-first: readable text sizes, smooth tap targets, zero eye strain
 * - Live Sanity integration with canonical portfolio fallbacks
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Sparkles, User } from 'lucide-react'

export interface ExcoMember {
  _id?: string
  fullName: string
  excoPosition?: string
  role?: string
  teamName?: string
  profileImageUrl?: string
  hall?: string
  bio?: string
  category?: 'csgb' | 'director'
}

interface AboutLeadershipProps {
  excos?: ExcoMember[] | null
  headline?: string
  lead?: string
}

// Canonical fellowship leadership roster (CSGB & Key Directors)
const CANONICAL_EXCOS: ExcoMember[] = [
  {
    _id: 'csgb-1',
    fullName: 'Fellowship President',
    excoPosition: 'President & Executive Shepherd',
    role: 'admin',
    teamName: "Christian Students' Governing Board",
    hall: 'Hall 4',
    bio: 'Oversees the apostolic vision, pastoral direction, constitutional integrity, and central campus governance of ECCF at Edo State University.',
    category: 'csgb',
  },
  {
    _id: 'csgb-2',
    fullName: 'Vice President (Admin)',
    excoPosition: "VP - Admin / Brothers' Coordinator",
    role: 'admin',
    teamName: 'Executive Administration',
    hall: 'Hall 2',
    bio: "Coordinates administrative operations, inter-departmental logistics, and men's fellowship discipleship across male hostels.",
    category: 'csgb',
  },
  {
    _id: 'csgb-3',
    fullName: 'Vice President (Evangelism)',
    excoPosition: "VP - Evangelism / Sisters' Coordinator",
    role: 'admin',
    teamName: 'Campus Evangelism',
    hall: 'Hall 1',
    bio: "Spearheads campus soul-winning initiatives, hostel outreaches, and women's discipleship across female hostels.",
    category: 'csgb',
  },
  {
    _id: 'csgb-4',
    fullName: 'General Secretary',
    excoPosition: 'General Secretary',
    role: 'admin',
    teamName: 'Secretariat & Records',
    hall: 'Hall 3',
    bio: 'Custody of fellowship records, constitutional adherence, executive minutes, official correspondence, and registry.',
    category: 'csgb',
  },
  {
    _id: 'csgb-5',
    fullName: 'Prayer Coordinator',
    excoPosition: 'Prayer Coordinator',
    role: 'admin',
    teamName: 'Prayer & Intercession',
    hall: 'Hall 6',
    bio: 'Kindles continuous corporate intercessory fire, midnight prayer vigils, fasting programmes, and service coverage.',
    category: 'csgb',
  },
  {
    _id: 'csgb-6',
    fullName: 'Financial Secretary',
    excoPosition: 'Financial Secretary',
    role: 'finance',
    teamName: 'Finance & Treasury',
    hall: 'Hall 5',
    bio: 'Directs financial stewardship, ledger reconciliation, budget allocations, and sacrificial giving accountability.',
    category: 'csgb',
  },
  {
    _id: 'dir-1',
    fullName: 'Academic Coordinator',
    excoPosition: 'Academic Coordinator',
    role: 'team_lead',
    teamName: 'Academic Directorate',
    hall: 'Hall 7',
    bio: 'Drives peer tutorial groups, CGPA clinics, exam revision bootcamps, and academic scholarship across faculties.',
    category: 'director',
  },
  {
    _id: 'dir-2',
    fullName: 'Choir & Music Director',
    excoPosition: 'Music Director & Head of Psalmists',
    role: 'team_lead',
    teamName: 'Choir & Music Ministry',
    hall: 'Hall 4',
    bio: 'Directs vocal arrangements, instrumentalists, choral anthems, and weekly congregational worship ministry.',
    category: 'director',
  },
  {
    _id: 'dir-3',
    fullName: 'Outreach Coordinator',
    excoPosition: 'Outreach Coordinator',
    role: 'team_lead',
    teamName: 'Evangelism & Missions Wing',
    hall: 'Hall 2',
    bio: 'Organizes campus-wide soul-winning drives, rural gospel missions, and medical outreaches to surrounding communities.',
    category: 'director',
  },
  {
    _id: 'dir-4',
    fullName: 'Welfare & Medical Coordinator',
    excoPosition: 'Welfare & Medical Coordinator',
    role: 'team_lead',
    teamName: 'Student Welfare Directorate',
    hall: 'Hall 8',
    bio: 'Supervises emergency student financial aid, food support, sick-bay visitations, and compassionate student welfare.',
    category: 'director',
  },
  {
    _id: 'dir-5',
    fullName: 'Media Coordinator',
    excoPosition: 'Media & Digital Outreach Head',
    role: 'team_lead',
    teamName: 'Digital Media Directorate',
    hall: 'Hall 3',
    bio: 'Directs digital livestream broadcasting, high-definition photography, social media evangelism, and design.',
    category: 'director',
  },
  {
    _id: 'dir-6',
    fullName: 'Head of Protocol Team',
    excoPosition: 'Protocol Coordinator',
    role: 'team_lead',
    teamName: 'Ministerial Protocol Wing',
    hall: 'Hall 5',
    bio: 'Ensures ministerial order, guest reception, speaker logistics, and platform management during all conferences.',
    category: 'director',
  },
]

export default function AboutLeadership({
  excos,
  headline,
  lead,
}: AboutLeadershipProps) {
  const [filter, setFilter] = useState<'all' | 'csgb' | 'directors'>('all')

  // Merge live Sanity data if present with canonical roster
  const activeList: ExcoMember[] =
    excos && excos.length > 0
      ? excos.map((e) => ({
          ...e,
          category:
            e.role === 'admin' ||
            (e.excoPosition &&
              [
                'President',
                'Vice President',
                'General Secretary',
                'Prayer Coordinator',
                'Financial Secretary',
              ].some((pos) =>
                e.excoPosition?.toLowerCase().includes(pos.toLowerCase())
              ))
              ? 'csgb'
              : 'director',
        }))
      : CANONICAL_EXCOS

  // Find President / Lead Officer for the featured card
  const president =
    activeList.find((e) =>
      e.excoPosition?.toLowerCase().includes('president')
    ) || activeList[0]

  // President initials for monogram fallback
  const presidentInitials = president.fullName
    ? president.fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'FP'

  // Remaining officers
  const remainingOfficers = activeList.filter((e) => e !== president)

  const filteredOfficers =
    filter === 'all'
      ? remainingOfficers
      : remainingOfficers.filter((e) =>
          filter === 'csgb' ? e.category === 'csgb' : e.category === 'director'
        )

  return (
    <section id="leadership" className="py-14 sm:py-24 bg-[#0d1117] text-white relative overflow-hidden border-b border-slate-800">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#0095ff]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

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
              OUR TEAM &amp; EXECUTIVE COUNCIL
            </span>
            <h2 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              {headline || 'Stewards of the Vision & Altar.'}
            </h2>
            <p className="mt-4 text-base sm:text-xl text-slate-300 leading-relaxed font-normal">
              {lead ||
                'Meet the servant leaders of the Central Student Governing Body (CSGB) and Ministry Directors who steward our spiritual life, administration, and campus operations.'}
            </p>
          </motion.div>

          {/* Segmented Category Filter (Mobile-first horizontal scroll) */}
          <div className="inline-flex items-center p-1 sm:p-1.5 rounded-full bg-slate-900 border border-slate-800 self-start md:self-end max-w-full overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
                filter === 'all'
                  ? 'bg-[#0095ff] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Council ({activeList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('csgb')}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
                filter === 'csgb'
                  ? 'bg-[#0095ff] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              CSGB Executives
            </button>
            <button
              type="button"
              onClick={() => setFilter('directors')}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
                filter === 'directors'
                  ? 'bg-[#0095ff] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ministry Leads
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* FEATURED PRESIDENT CARD (Inspired by JNAC's Featured AG Card)    */}
        {/* ================================================================ */}
        {(filter === 'all' || filter === 'csgb') && president && (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55 }}
            className="mb-8 sm:mb-14 overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 border border-sky-500/30 shadow-2xl relative group"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              {/* President Portrait */}
              <div className="lg:col-span-5 relative aspect-[4/5] lg:aspect-auto lg:h-[460px] w-full bg-slate-950 overflow-hidden">
                {president.profileImageUrl ? (
                  <Image
                    src={president.profileImageUrl}
                    alt={president.fullName}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-500 p-6 text-center">
                    <span className="font-serif text-5xl sm:text-7xl font-bold text-sky-400/80 tracking-wider">
                      {presidentInitials}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-widest text-sky-300/60">
                      {president.hall || 'ECCF Presidency'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent lg:hidden" />
              </div>

              {/* President Bio & Mandate */}
              <div className="lg:col-span-7 p-5 sm:p-10 lg:p-12 space-y-4 sm:space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>EXECUTIVE HEAD &bull; CSGB PRESIDENCY</span>
                </div>

                <div>
                  <h3 className="font-serif font-black text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                    {president.fullName}
                  </h3>
                  <span className="text-sm sm:text-base font-semibold text-sky-400 block mt-1.5 uppercase tracking-wide">
                    {president.excoPosition || 'Fellowship President'}
                  </span>
                </div>

                <p className="text-sm sm:text-lg text-slate-300 leading-relaxed font-normal">
                  {president.bio ||
                    'Stewards the overall apostolic vision, pastoral direction, and central governance of the fellowship on the campus of Edo State University.'}
                </p>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs sm:text-sm text-slate-400 font-mono">
                  <span>{president.teamName || "Christian Students' Governing Board"}</span>
                  <span className="text-amber-300 font-bold">{president.hall || 'Hall 4'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================================================================ */}
        {/* JNAC-STYLE 3:4 PORTRAIT GRID FOR REMAINING EXCOS                 */}
        {/* 2-columns on mobile, matching JNAC's mobile leadership layout   */}
        {/* ================================================================ */}
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6"
          >
            {filteredOfficers.map((exco, idx) => {
              const isCsgb = exco.category === 'csgb'
              const initials = exco.fullName
                ? exco.fullName
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'EX'

              return (
                <motion.div
                  layout
                  key={exco._id || exco.fullName + idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: idx * 0.03 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl sm:rounded-3xl bg-slate-900 border border-slate-800 hover:border-sky-400/50 shadow-md hover:shadow-2xl transition-all cursor-pointer"
                >
                  {/* Photo or Grand Monogram Fallback */}
                  {exco.profileImageUrl ? (
                    <Image
                      src={exco.profileImageUrl}
                      alt={exco.fullName}
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
                        {exco.hall || 'Leadership'}
                      </span>
                    </div>
                  )}

                  {/* Top Office Badge */}
                  <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 z-20">
                    <span
                      className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${
                        isCsgb
                          ? 'bg-[#0095ff] text-white shadow-sm'
                          : 'bg-black/60 backdrop-blur-md text-slate-200 border border-white/10'
                      }`}
                    >
                      {isCsgb ? 'CSGB' : 'DIRECTOR'}
                    </span>
                  </div>

                  {/* Gradient Overlay (JNAC Signature Style) */}
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex flex-col justify-end p-3 sm:p-5 text-left">
                    <span className="text-[10px] sm:text-xs font-semibold text-sky-300 uppercase tracking-wider block mb-0.5 sm:mb-1 truncate">
                      {exco.excoPosition || 'Executive Officer'}
                    </span>

                    <h4 className="font-serif font-bold text-sm sm:text-lg text-white leading-tight mb-1 line-clamp-2">
                      {exco.fullName}
                    </h4>

                    <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-slate-400 font-mono mt-0.5 pt-1.5 sm:mt-1 sm:pt-2 border-t border-white/10">
                      <span className="truncate max-w-[85px] sm:max-w-[130px]">{exco.teamName}</span>
                      {exco.hall && <span className="text-sky-400 font-bold shrink-0">{exco.hall}</span>}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  )
}
