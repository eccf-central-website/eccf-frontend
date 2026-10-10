/**
 * AboutLeadership — "Our Team" / Executive Leadership (CSGB & Ministry Directors)
 *
 * Implements:
 * - TPUSA-style bold executive leadership showcase
 * - Dual council segmentation: Central Student Governing Board (CSGB) and Ministry Directors
 * - Live Sanity integration with canonical portfolio fallbacks for immediate richness
 * - Filter toggle between "All Leadership", "CSGB Executives", and "Ministry Directors"
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Users } from 'lucide-react'

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
}

// Canonical fellowship leadership roster (CSGB & Key Directors)
const CANONICAL_EXCOS: ExcoMember[] = [
  {
    _id: 'csgb-1',
    fullName: 'Fellowship President',
    excoPosition: 'President',
    role: 'admin',
    teamName: 'CSGB Executive Council',
    hall: 'Hall 4',
    bio: 'Oversees the spiritual vision, pastoral direction, and central governance of the fellowship at Edo State University.',
    category: 'csgb',
  },
  {
    _id: 'csgb-2',
    fullName: "Vice President (Admin)",
    excoPosition: "Vice President - Admin / Brothers' Coordinator",
    role: 'admin',
    teamName: 'Executive Administration',
    hall: 'Hall 2',
    bio: "Coordinates administrative operations, inter-departmental logistics, and men's fellowship discipleship across male hostels.",
    category: 'csgb',
  },
  {
    _id: 'csgb-3',
    fullName: "Vice President (Evangelism)",
    excoPosition: "Vice President - Evangelism / Sisters' Coordinator",
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
    teamName: 'Academic Team',
    hall: 'Hall 7',
    bio: 'Drives peer tutorial groups, CGPA clinics, exam revision bootcamps, and academic scholarship across faculties.',
    category: 'director',
  },
  {
    _id: 'dir-2',
    fullName: 'Choir & Music Director',
    excoPosition: 'Music Director / Head of Instrumentalists',
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
    teamName: 'Outreach Team',
    hall: 'Hall 2',
    bio: 'Organizes campus-wide soul-winning drives, rural gospel missions, and medical outreaches to surrounding communities.',
    category: 'director',
  },
  {
    _id: 'dir-4',
    fullName: 'Welfare & Medical Coordinator',
    excoPosition: 'Welfare & Medical Coordinator',
    role: 'team_lead',
    teamName: 'Welfare/Medical Team',
    hall: 'Hall 8',
    bio: 'Supervises emergency student financial aid, food support, sick-bay visitations, and compassionate student welfare.',
    category: 'director',
  },
  {
    _id: 'dir-5',
    fullName: 'Media & Communications Head',
    excoPosition: 'Media Coordinator',
    role: 'team_lead',
    teamName: 'Media Team',
    hall: 'Hall 3',
    bio: 'Directs digital livestream broadcasting, high-definition photography, social media evangelism, and design.',
    category: 'director',
  },
  {
    _id: 'dir-6',
    fullName: 'Head of Protocol Team',
    excoPosition: 'Head of Protocol Team',
    role: 'team_lead',
    teamName: 'Protocol Team',
    hall: 'Hall 5',
    bio: 'Ensures ministerial order, guest reception, speaker logistics, and platform management during all conferences.',
    category: 'director',
  },
]

export default function AboutLeadership({ excos }: AboutLeadershipProps) {
  const [filter, setFilter] = useState<'all' | 'csgb' | 'directors'>('all')

  // Merge live Sanity data if present with canonical roster
  const activeList: ExcoMember[] =
    excos && excos.length > 0
      ? excos.map((e) => ({
          ...e,
          category:
            e.role === 'admin' ||
            (e.excoPosition &&
              ['President', 'Vice President', 'General Secretary', 'Prayer Coordinator', 'Financial Secretary'].some((pos) =>
                e.excoPosition?.toLowerCase().includes(pos.toLowerCase())
              ))
              ? 'csgb'
              : 'director',
        }))
      : CANONICAL_EXCOS

  const filteredExcos = activeList.filter((item) => {
    if (filter === 'csgb') return item.category === 'csgb'
    if (filter === 'directors') return item.category === 'director'
    return true
  })

  return (
    <section id="leadership" className="py-16 sm:py-24 bg-white relative overflow-hidden border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="text-left max-w-2xl"
          >
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-widest text-[#0077cc] uppercase font-mono mb-3">
              <Shield className="h-4 w-4" />
              OUR TEAM &amp; EXECUTIVE LEADERSHIP
            </span>
            <h2 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-tight">
              Stewards of the Vision &amp; Altar.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
              Meet the servant leaders of the Central Student Governing Body (CSGB) and Ministry Directors who guide our prayer life, administration, and campus operations.
            </p>
          </motion.div>

          {/* TPUSA-Style Filter Segmented Control */}
          <div className="inline-flex items-center p-1.5 rounded-full bg-stone-100 border border-stone-200/80 self-start md:self-end">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                filter === 'all'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Leadership ({activeList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('csgb')}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                filter === 'csgb'
                  ? 'bg-[#0095ff] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CSGB Council
            </button>
            <button
              type="button"
              onClick={() => setFilter('directors')}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                filter === 'directors'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ministry Leads
            </button>
          </div>
        </div>

        {/* Executive Cards Grid */}
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredExcos.map((exco, idx) => {
              const isCsgb = exco.category === 'csgb'
              return (
                <motion.div
                  layout
                  key={exco._id || exco.fullName + idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={`group relative flex flex-col justify-between rounded-3xl overflow-hidden bg-[#fafaf9] border ${
                    isCsgb
                      ? 'border-sky-200/80 shadow-xs hover:border-[#0077cc]'
                      : 'border-stone-200 hover:border-slate-400'
                  } transition-all shadow-sm hover:shadow-xl`}
                >
                  {/* Photo / Avatar Placeholder Header */}
                  <div className="relative h-56 sm:h-64 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                    {exco.profileImageUrl ? (
                      <Image
                        src={exco.profileImageUrl}
                        alt={exco.fullName}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Users className="h-16 w-16 text-slate-600" />
                        <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                          {exco.hall || 'ECCF Exco'}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />

                    {/* Exco Position Pill */}
                    <div className="absolute top-4 left-4">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          isCsgb
                            ? 'bg-[#0095ff] text-white shadow-sm'
                            : 'bg-black/60 backdrop-blur-md text-white border border-white/20'
                        }`}
                      >
                        {isCsgb ? 'CSGB EXECUTIVE' : 'MINISTRY DIRECTOR'}
                      </span>
                    </div>

                    {/* Bottom overlay text */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider block">
                        {exco.excoPosition || 'Executive Officer'}
                      </span>
                      <h3 className="font-serif font-bold text-xl text-white leading-tight">
                        {exco.fullName}
                      </h3>
                    </div>
                  </div>

                  {/* Body & Bio */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                        <span className="font-semibold text-slate-700">{exco.teamName}</span>
                        {exco.hall && <span>{exco.hall}</span>}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        {exco.bio ||
                          'Dedicated servant leader committed to spiritual excellence and student community care at EDSU.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono">Central Leadership</span>
                      <span className="text-[#0077cc] font-bold">EDSU Iyamho</span>
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
