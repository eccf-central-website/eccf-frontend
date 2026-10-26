/**
 * AboutLeadership — Comprehensive Executive & Ministerial Leadership Gallery
 *
 * Implements:
 * - 5 Hierarchical Leadership Sections:
 *   1. Patrons (curated fallback; Sanity `publicLeader` records with role `patron` override it)
 *   2. CSGB (Christian Student Governing Board)
 *   4. Hall Pastors (Halls 1 through 8)
 *   5. Operational Team Leaders
 *   6. Assistant Team Leaders
 * - JNAC-inspired glossy portrait cards: photo framed in a glass well with the
 *   name and role set beneath it (never over the face)
 * - Editorial tier system: mono eyebrow ("Tier 02 — The Cabinet"), serif title,
 *   live leader count, and a sky gradient hairline rule
 * - Sticky glass tier rail with counts, doubling as an index of the roster
 * - Grand initials monograms for officers awaiting photography
 * - Seamless, gradual scroll transition from light (#fafaf9) to dark (#0d1117)
 * - Mobile-first 2-column portrait grid with horizontally scrollable tier rail
 */

'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

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
// Curated fallback used only when Sanity has no `publicLeader` with role `patron`
// (or a patron-related position/team/badge). Add Patron records in Sanity to
// make this section fully data-driven.
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
    fullName: 'Dr. Matthew',
    excoPosition: 'Patron & Faculty Mentor',
    teamName: 'Board of Patrons',
    bio: 'Senior academic and spiritual patron steering student mentorship, academic scholarship integrity, and kingdom fellowship support at Edo State University.',
    badgeLabel: 'PATRON',
  },
  {
    _id: 'patron-3',
    fullName: 'Dr. Emmanuel Okla',
    excoPosition: 'Patron & Faculty Mentor',
    teamName: 'Board of Patrons',
    bio: 'Senior academic and spiritual patron steering student mentorship, academic scholarship integrity, and kingdom fellowship support at Edo State University.',
    badgeLabel: 'PATRON',
  },
]

// ---------------------------------------------------------------------------
// 3. CSGB (Christian Student Governing Board)
// ---------------------------------------------------------------------------
const CSGB_LIST: LeaderCard[] = [
  {
    _id: 'csgb-1',
    fullName: 'Bro. Emmanuel Okafor',
    excoPosition: 'President & Executive Shepherd',
    teamName: "Christian Student Governing Board",
    bio: 'Oversees the apostolic vision, pastoral direction, constitutional integrity, and central campus governance of ECCF at Edo State University.',
    badgeLabel: 'CSGB PRESIDENT',
  },
  {
    _id: 'csgb-2',
    fullName: 'Bro. Samuel Adeyemi',
    excoPosition: "VP - Admin / Brothers' Coordinator",
    teamName: 'Executive Administration',
    bio: "Coordinates administrative operations, inter-departmental logistics, and men's fellowship discipleship across male hostels.",
    badgeLabel: 'CSGB VP ADMIN',
  },
  {
    _id: 'csgb-3',
    fullName: 'Sis. Blessing Ehigiator',
    excoPosition: "VP - Evangelism / Sisters' Coordinator",
    teamName: 'Campus Evangelism',
    bio: "Spearheads campus soul-winning initiatives, hostel outreaches, and women's discipleship across female hostels.",
    badgeLabel: 'CSGB VP EVANGELISM',
  },
  {
    _id: 'csgb-4',
    fullName: 'Sis. Chidinma Osagie',
    excoPosition: 'General Secretary',
    teamName: 'Secretariat & Records',
    bio: 'Custody of fellowship records, constitutional adherence, executive minutes, official correspondence, and registry.',
    badgeLabel: 'CSGB SECRETARY',
  },
  {
    _id: 'csgb-5',
    fullName: 'Bro. Daniel Idahosa',
    excoPosition: 'Prayer Coordinator',
    teamName: 'Prayer & Intercession',
    bio: 'Kindles continuous corporate intercessory fire, midnight prayer vigils, fasting programmes, and service coverage.',
    badgeLabel: 'CSGB PRAYER',
  },
  {
    _id: 'csgb-6',
    fullName: 'Bro. Efosa Uwaifo',
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
    fullName: 'Bro. Joshua Balogun',
    excoPosition: 'Pastoral Shepherd — Hall 1',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 1',
  },
  {
    _id: 'hp-2',
    fullName: 'Sis. Grace Omoregie',
    excoPosition: 'Pastoral Shepherd — Hall 2',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 2',
  },
  {
    _id: 'hp-3',
    fullName: 'Bro. Tunde Aigbe',
    excoPosition: 'Pastoral Shepherd — Hall 3',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 3',
  },
  {
    _id: 'hp-4',
    fullName: 'Sis. Ruth Eguavoen',
    excoPosition: 'Pastoral Shepherd — Hall 4',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 4',
  },
  {
    _id: 'hp-5',
    fullName: 'Bro. Kelechi Nwosu',
    excoPosition: 'Pastoral Shepherd — Hall 5',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 5',
  },
  {
    _id: 'hp-6',
    fullName: 'Sis. Funmi Obaseki',
    excoPosition: 'Pastoral Shepherd — Hall 6',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 6',
  },
  {
    _id: 'hp-7',
    fullName: 'Bro. Emeka Eze',
    excoPosition: 'Pastoral Shepherd — Hall 7',
    teamName: 'Residence Hall Pastoral Wing',
    badgeLabel: 'HALL 7',
  },
  {
    _id: 'hp-8',
    fullName: 'Sis. Precious Igbinedion',
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
    fullName: 'Bro. Osas Igbinosa',
    excoPosition: 'Discipleship & Bible Study Lead',
    teamName: 'Bible Study / Sunday School Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-2',
    fullName: 'Bro. Victor Ojo',
    excoPosition: 'Head Intercessor & Altar Lead',
    teamName: 'Prayer Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-3',
    fullName: 'Sis. Favour Ehigiator',
    excoPosition: 'Head of Psalmists & Music Ministry',
    teamName: 'Choir Team',
    badgeLabel: 'DIRECTOR',
  },
  {
    _id: 'tl-4',
    fullName: 'Bro. David Okoh',
    excoPosition: 'Ministerial Protocol Coordinator',
    teamName: 'Protocol Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-5',
    fullName: 'Sis. Esther Edeki',
    excoPosition: 'Sanctuary Hospitality Head',
    teamName: 'Ushering Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-6',
    fullName: 'Bro. Israel Osayande',
    excoPosition: 'Theatrical Evangelism Director',
    teamName: 'Drama / Creative Media Team',
    badgeLabel: 'DIRECTOR',
  },
  {
    _id: 'tl-7',
    fullName: 'Bro. Emmanuel Bello',
    excoPosition: 'Campus Soul-Winning Coordinator',
    teamName: 'Outreach Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-8',
    fullName: 'Sis. Rejoice Momoh',
    excoPosition: 'Student Welfare & Benevolence Head',
    teamName: 'Welfare / Medical Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-9',
    fullName: 'Bro. Caleb Akhigbe',
    excoPosition: 'Academic Mentorship & Tutorial Director',
    teamName: 'Academic Team',
    badgeLabel: 'DIRECTOR',
  },
  {
    _id: 'tl-10',
    fullName: 'Bro. Gideon Umoru',
    excoPosition: 'Christian Literature & Library Head',
    teamName: 'Colporteur / Library Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-11',
    fullName: 'Bro. Elijah Obasohan',
    excoPosition: 'Sound & Acoustic Systems Head',
    teamName: 'Technical Team',
    badgeLabel: 'DIRECTOR',
  },
  {
    _id: 'tl-12',
    fullName: 'Bro. Paul Ilevbare',
    excoPosition: 'Digital Broadcast & Media Head',
    teamName: 'Media Team',
    badgeLabel: 'DIRECTOR',
  },
  {
    _id: 'tl-13',
    fullName: 'Sis. Praise Omokaro',
    excoPosition: 'Sanctuary Aesthetics & Ambience Head',
    teamName: 'Decoration Team',
    badgeLabel: 'TEAM LEAD',
  },
  {
    _id: 'tl-14',
    fullName: 'Sis. Victoria Aliu',
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
    fullName: 'Sis. Deborah Agbonlahor',
    excoPosition: 'Assistant Bible Study Coordinator',
    teamName: 'Bible Study / Sunday School Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-2',
    fullName: 'Sis. Peace Okhomina',
    excoPosition: 'Assistant Intercessory Lead',
    teamName: 'Prayer Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-3',
    fullName: 'Bro. Michael Ighodaro',
    excoPosition: 'Assistant Music Director',
    teamName: 'Choir Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-4',
    fullName: 'Sis. Joy Osahon',
    excoPosition: 'Assistant Protocol Coordinator',
    teamName: 'Protocol Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-5',
    fullName: 'Bro. Philip Enabulele',
    excoPosition: 'Assistant Ushering Head',
    teamName: 'Ushering Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-6',
    fullName: 'Sis. Mercy Itua',
    excoPosition: 'Assistant Drama Director',
    teamName: 'Drama / Creative Media Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-7',
    fullName: 'Sis. Dorcas Imasuen',
    excoPosition: 'Assistant Evangelism Coordinator',
    teamName: 'Outreach Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-8',
    fullName: 'Bro. Stephen Oshomah',
    excoPosition: 'Assistant Student Welfare Head',
    teamName: 'Welfare / Medical Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-9',
    fullName: 'Sis. Elizabeth Oshodin',
    excoPosition: 'Assistant Academic Tutorial Director',
    teamName: 'Academic Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-10',
    fullName: 'Sis. Mary Odion',
    excoPosition: 'Assistant Literature Head',
    teamName: 'Colporteur / Library Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-11',
    fullName: 'Bro. Timothy Omo-Ojo',
    excoPosition: 'Assistant Audio Engineering Lead',
    teamName: 'Technical Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-12',
    fullName: 'Sis. Abigail Oshiomhole',
    excoPosition: 'Assistant Digital Media Coordinator',
    teamName: 'Media Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-13',
    fullName: 'Sis. Grace Akhator',
    excoPosition: 'Assistant Sanctuary Aesthetics Lead',
    teamName: 'Decoration Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
  {
    _id: 'atl-14',
    fullName: 'Bro. Josiah Eromosele',
    excoPosition: 'Assistant Treasury Administrator',
    teamName: 'Financial Team',
    badgeLabel: 'ASSISTANT LEAD',
  },
]

type LeaderTier =
  | 'all'
  | 'patrons'
  | 'csgb'
  | 'hall_pastors'
  | 'team_leaders'
  | 'assistant_leaders'

type TierKey = Exclude<LeaderTier, 'all'>

/**
 * Editorial metadata for each tier — the eyebrow carries the "chapter" label
 * (Cabinet, Directorates, Deputies) while the title stays the official name.
 */
const TIER_META: Record<
  TierKey,
  { short: string; eyebrow: string; title: string; subtitle: string; grid: string }
> = {
  patrons: {
    short: 'Patrons',
    eyebrow: 'Tier 01 — Institutional Covering',
    title: 'Board of Patrons & Staff Advisers',
    subtitle:
      'Faculty mentors and staff patrons who give counsel, institutional wisdom, and spiritual covering to the fellowship.',
    grid: 'grid-cols-2 sm:grid-cols-3',
  },
  csgb: {
    short: 'Cabinet',
    eyebrow: 'Tier 02 — The Cabinet',
    title: 'Christian Student Governing Board',
    subtitle:
      'The executive cabinet directing vision, administration, finance, and the spiritual life of the fellowship.',
    grid: 'grid-cols-2 sm:grid-cols-3',
  },
  hall_pastors: {
    short: 'Hall Pastors',
    eyebrow: 'Tier 03 — Pastoral Care',
    title: 'Residence Hall Pastors',
    subtitle:
      'Shepherds assigned across the residence halls, caring for students where they live.',
    grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  },
  team_leaders: {
    short: 'Directors',
    eyebrow: 'Tier 04 — Directorates',
    title: 'Operational Team Leaders',
    subtitle:
      'Directors of the fourteen service units that carry the weekly work of the fellowship.',
    grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  },
  assistant_leaders: {
    short: 'Deputies',
    eyebrow: 'Tier 05 — Deputies',
    title: 'Assistant Team Leaders',
    subtitle:
      'Deputy heads supporting each directorate in execution and continuity.',
    grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  },
}

export default function AboutLeadership({
  excos,
  headline,
  lead,
}: AboutLeadershipProps) {
  const [activeTier, setActiveTier] = useState<LeaderTier>('all')

  // Partition Sanity excos if available
  const csgbList = useMemo(() => {
    if (!excos || excos.length === 0) return CSGB_LIST
    const matched = excos.filter((e) => e.role === 'admin')
    return matched.length > 0 ? matched : CSGB_LIST
  }, [excos])

  const hallPastorsList = useMemo(() => {
    if (!excos || excos.length === 0) return HALL_PASTORS
    const matched = excos.filter((e) => e.role === 'hall_rep')
    return matched.length > 0 ? matched : HALL_PASTORS
  }, [excos])

  const teamLeadersList = useMemo(() => {
    if (!excos || excos.length === 0) return TEAM_LEADERS
    const matched = excos.filter((e) => e.role === 'team_lead')
    return matched.length > 0 ? matched : TEAM_LEADERS
  }, [excos])

  const assistantLeadersList = useMemo(() => {
    if (!excos || excos.length === 0) return ASSISTANT_TEAM_LEADERS
    const matched = excos.filter((e) => e.role === 'assistant_lead')
    return matched.length > 0 ? matched : ASSISTANT_TEAM_LEADERS
  }, [excos])

  const patronsList = useMemo(() => {
    if (!excos || excos.length === 0) return PATRONS_LIST
    const matched = excos.filter((e) => {
      const role = (e.role || '').toLowerCase()
      const excoPosition = (e.excoPosition || '').toLowerCase()
      const teamName = (e.teamName || '').toLowerCase()
      const badgeLabel = (e.badgeLabel || '').toLowerCase()
      return (
        role === 'patron' ||
        role === 'patrons' ||
        excoPosition.includes('patron') ||
        teamName.includes('patron') ||
        badgeLabel.includes('patron')
      )
    })
    return matched.length > 0 ? matched : PATRONS_LIST
  }, [excos])

  const tiers: { key: TierKey; members: LeaderCard[] }[] = [
    { key: 'patrons', members: patronsList },
    { key: 'csgb', members: csgbList },
    { key: 'hall_pastors', members: hallPastorsList },
    { key: 'team_leaders', members: teamLeadersList },
    { key: 'assistant_leaders', members: assistantLeadersList },
  ]

  const totalLeaders = tiers.reduce((sum, tier) => sum + tier.members.length, 0)

  const tabs: { id: LeaderTier; label: string; count: number }[] = [
    { id: 'all', label: 'All Leadership', count: totalLeaders },
    ...tiers.map((tier) => ({
      id: tier.key as LeaderTier,
      label: TIER_META[tier.key].short,
      count: tier.members.length,
    })),
  ]

  const visibleTiers =
    activeTier === 'all' ? tiers : tiers.filter((tier) => tier.key === activeTier)

  const getInitials = (name: string) => {
    return (
      name
        .split(' ')
        .filter((w) => !['Dr.', 'Pastor', 'Bro.', 'Sis.', 'Brother', 'Sister', '&', 'and'].includes(w))
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'LD'
    )
  }

  /** Scrolls the grid back under the sticky rail when the roster is filtered. */
  const handleTierChange = (tier: LeaderTier) => {
    setActiveTier(tier)
    const anchor = document.getElementById('leadership-grid')
    if (!anchor) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const headerOffset = window.innerWidth >= 640 ? 148 : 128
    const top = anchor.getBoundingClientRect().top + window.scrollY - headerOffset
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  // Glossy glass portrait card — photo framed in a glass well, caption beneath.
  // `featured` turns the tier lead into a row-spanning hero: full-bleed on
  // phones, wide portrait + editorial caption on larger screens.
  const renderCard = (leader: LeaderCard, idx: number, featured = false) => {
    const initials = getInitials(leader.fullName)
    const role = leader.excoPosition || leader.role || ''

    return (
      <motion.article
        layout
        key={leader._id || leader.fullName + idx}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.45, delay: Math.min(idx * 0.03, 0.24), ease: [0.22, 1, 0.36, 1] }}
        className={`group relative flex overflow-hidden rounded-[22px] bg-gradient-to-b from-white/[0.11] via-white/[0.045] to-white/[0.02] ring-1 ring-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_24px_48px_-30px_rgba(2,6,23,0.95)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:ring-sky-400/40 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_32px_60px_-28px_rgba(2,6,23,1)] sm:rounded-[26px] ${
          featured
            ? 'col-span-2 flex-row sm:col-span-3'
            : 'flex-col'
        }`}
      >
        {/* Gloss hairline across the top edge */}
        <span className="pointer-events-none absolute inset-x-5 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

        {/* Portrait well */}
        <div
          className={`relative overflow-hidden rounded-[17px] ring-1 ring-white/10 sm:rounded-[20px] ${
            featured
              ? 'm-1.5 aspect-[3/4] w-[40%] shrink-0 self-center sm:m-2 sm:aspect-[4/5] sm:w-[38%] sm:self-auto lg:w-[42%]'
              : 'm-1.5 aspect-[3/4] sm:m-2'
          }`}
        >
          {leader.profileImageUrl ? (
            <Image
              src={leader.profileImageUrl}
              alt={leader.fullName}
              fill
              sizes={
                featured
                  ? '(max-width: 640px) 40vw, (max-width: 1024px) 38vw, 42vw'
                  : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
              }
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/60 bg-[radial-gradient(circle_at_50%_0%,rgba(0,149,255,0.30),transparent_62%)] p-3 text-center">
              <span className="font-serif text-3xl font-bold tracking-wider text-sky-300/85 sm:text-5xl">
                {initials}
              </span>
              <span className="h-px w-8 bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />
              <span className="font-mono text-[8.5px] uppercase tracking-[0.24em] text-slate-400 sm:text-[9.5px]">
                ECCF Leadership
              </span>
            </div>
          )}

          {/* Glossy light sweep */}
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.30)_0%,rgba(255,255,255,0.06)_32%,rgba(255,255,255,0)_52%,rgba(255,255,255,0.10)_100%)] opacity-50 mix-blend-screen transition-opacity duration-500 group-hover:opacity-80" />
          {/* Blend the photo base into the caption */}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/60 to-transparent" />
        </div>

        {/* Caption */}
        <div
          className={`relative text-left ${
            featured
              ? 'flex flex-1 flex-col justify-center px-4 py-4 sm:px-7 sm:py-8 lg:px-10'
              : 'px-3 pb-3.5 pt-0.5 sm:px-3.5 sm:pb-4'
          }`}
        >
          {featured && (
            <span className="mb-3 hidden items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-sky-300/80 sm:inline-flex">
              <span className="h-px w-6 bg-gradient-to-r from-sky-400/80 to-transparent" />
              {leader.badgeLabel || 'Presiding Officer'}
            </span>
          )}
          <h4
            className={`font-serif font-bold leading-snug text-white ${
              featured
                ? 'line-clamp-3 text-[16px] leading-[1.15] sm:line-clamp-2 sm:text-[26px] sm:leading-[1.15] lg:text-[32px]'
                : 'line-clamp-2 text-[15px] sm:text-[17px]'
            }`}
          >
            {leader.fullName}
          </h4>
          {role && (
            <p
              title={role}
              className={`mt-1 font-mono font-semibold uppercase leading-relaxed tracking-[0.08em] text-sky-300 line-clamp-2 ${
                featured
                  ? 'text-xs sm:text-sm lg:text-[14.5px]'
                  : 'text-xs sm:text-[13px]'
              }`}
            >
              {role}
            </p>
          )}
          {featured && leader.teamName && (
            <p className="mt-3 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400 sm:block">
              {leader.teamName}
            </p>
          )}
          {featured && leader.bio && (
            <>
              <span className="mt-5 hidden h-px w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent sm:block" />
              <p className="mt-5 hidden max-w-xl text-sm leading-relaxed text-slate-300/90 sm:line-clamp-4 lg:text-[15px]">
                {leader.bio}
              </p>
            </>
          )}
        </div>
      </motion.article>
    )
  }

  return (
    <section id="leadership" className="relative overflow-x-clip bg-transparent py-16 text-white sm:py-24">
      {/* Ambient light */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.07),transparent_58%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-1/4 h-[520px] w-[520px] rounded-full bg-[#0095ff]/10 blur-[140px]" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-1/3 left-0 h-[420px] w-[420px] rounded-full bg-sky-500/[0.07] blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        {/* ================================================================ */}
        {/* CHAPTER HEADER                                                    */}
        {/* ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl text-left"
        >
          <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-sky-400 sm:text-xs">
            <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Our Team &amp; Ministerial Hierarchy
          </span>
          <h2 className="mt-3 font-serif text-3xl leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
            {headline || 'Stewards of the Vision & Altar.'}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-lg">
            {lead ||
              'Meet the distinguished patrons, student governing executives, hall pastors, and operational leaders who guide our fellowship life.'}
          </p>
        </motion.div>

        {/* ================================================================ */}
        {/* STICKY TIER RAIL — counts double as an index of the roster        */}
        {/* ================================================================ */}
        <div className="sticky top-16 z-30 mt-8 sm:top-20 sm:mt-12">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#0d1117]/85 p-1.5 shadow-[0_18px_40px_-24px_rgba(2,6,23,0.9)] ring-1 ring-white/10 backdrop-blur-xl">
            <div className="no-scrollbar flex min-w-0 items-center gap-1.5 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%_-_28px),transparent)] sm:[mask-image:none]" role="group" aria-label="Filter leadership by tier">
              {tabs.map((tab) => {
                const isActive = activeTier === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleTierChange(tab.id)}
                    className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all sm:px-3.5 sm:text-xs ${
                      isActive
                        ? 'bg-gradient-to-b from-sky-400 to-[#0077cc] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_10px_22px_-10px_rgba(0,149,255,0.85)]'
                        : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`ml-1.5 font-mono text-[9.5px] ${
                        isActive ? 'text-white/80' : 'text-slate-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Session & Roster Info */}
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1 font-mono text-xs shrink-0 text-slate-400">
              <span className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                2026/2027 Session
              </span>
              <span className="text-[11px] text-slate-400">
                <strong className="font-semibold text-white">{totalLeaders}</strong> Appointed Stewards
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* TIER SECTIONS                                                    */}
        {/* ================================================================ */}
        <div id="leadership-grid" className="mt-10 scroll-mt-28 space-y-14 sm:mt-14 sm:space-y-20">
          {visibleTiers.map(({ key, members }) => {
            const meta = TIER_META[key]
            return (
              <section key={key} id={`leadership-${key}`} aria-label={meta.title} className="scroll-mt-32">
                <div className="mb-5 sm:mb-7">
                  <div className="flex items-end justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <span className="block font-mono text-[9.5px] uppercase tracking-[0.26em] text-sky-400/90 sm:text-[10.5px]">
                        {meta.eyebrow}
                      </span>
                      <h3 className="mt-2 font-serif text-[22px] leading-[1.12] text-white sm:text-3xl lg:text-[34px]">
                        {meta.title}
                      </h3>
                    </div>
                    <span className="mb-1 shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-slate-300 ring-1 ring-white/10">
                      {String(members.length).padStart(2, '0')} leaders
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-[15.5px] leading-relaxed text-slate-400 sm:text-[17px]">
                    {meta.subtitle}
                  </p>
                  <div className="mt-4 h-px w-full bg-gradient-to-r from-sky-400/45 via-white/10 to-transparent" />
                </div>

                <div className={`grid gap-3 sm:gap-5 ${meta.grid}`}>
                  {members.map((member, idx) =>
                    renderCard(member, idx, key === 'csgb' && idx === 0)
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </section>
  )
}
