/**
 * About Us Page — /about
 *
 * Turning Point USA (tpusa.com)-inspired comprehensive About Page.
 * Server component fetching live Sanity data (siteSettings, teamUnits, workers)
 * with robust canonical fallbacks.
 *
 * Features:
 * - High-energy Mission & Impact Hero
 * - Fellowship History & Chronological Milestones
 * - Core Values & Three Pillars
 * - Central Student Governing Board (CSGB) & Ministry Directors ("Our Team")
 * - Complete 14 Fellowship Operational Units (relocated from homepage)
 * - High-impact Get-Involved CTA
 */

import { Metadata } from 'next'
import { sanityClient, urlForImage } from '@/lib/sanity'
import {
  SITE_SETTINGS_QUERY,
  TEAMS_QUERY,
  EXCOS_QUERY,
} from '@/lib/queries'
import { SiteSettingsData } from '@/components/home/HeroSection'
import AboutHero from '@/components/about/AboutHero'
import AboutHistory from '@/components/about/AboutHistory'
import AboutPillars from '@/components/about/AboutPillars'
import AboutLeadership, { ExcoMember } from '@/components/about/AboutLeadership'
import AboutTeams from '@/components/about/AboutTeams'
import AboutCTA from '@/components/about/AboutCTA'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'About Us | ESUI Christian Campus Fellowship: Raising Spiritual Dynamites and Academic Giants',
  description:
    'Discover the history, spiritual vision, executive leadership (CSGB), and 14 operational teams of Edo State University Christian Campus Fellowship (ECCF).',
}

interface RawSanityTeam {
  _id: string
  name: string
  tag?: string
  leadName?: string
  description: string
  order?: number
  image?: unknown
  imageUrl?: string
}

interface RawSanityExco {
  _id: string
  fullName: string
  excoPosition?: string
  role?: string
  team?: {
    name?: string
  }
  profileImageUrl?: string
  hall?: string
}

export default async function AboutPage() {
  // Concurrently fetch settings, teams, and excos from Sanity
  const [settings, rawTeams, rawExcos] = await Promise.all([
    sanityClient.fetch<SiteSettingsData>(SITE_SETTINGS_QUERY).catch((err) => {
      console.error('[AboutPage] Failed to fetch siteSettings:', err)
      return null
    }),
    sanityClient.fetch<RawSanityTeam[]>(TEAMS_QUERY).catch((err) => {
      console.error('[AboutPage] Failed to fetch teams:', err)
      return []
    }),
    sanityClient.fetch<RawSanityExco[]>(EXCOS_QUERY).catch((err) => {
      console.error('[AboutPage] Failed to fetch excos:', err)
      return []
    }),
  ])

  // Map Sanity teams
  const teams = (rawTeams || []).map((t) => ({
    _id: t._id,
    name: t.name,
    role: t.leadName,
    description: t.description,
    imageUrl: urlForImage(t.image) || t.imageUrl,
    tag: t.tag,
  }))

  // Map Sanity excos
  const excos: ExcoMember[] = (rawExcos || []).map((e) => ({
    _id: e._id,
    fullName: e.fullName,
    excoPosition: e.excoPosition,
    role: e.role,
    teamName: e.team?.name || 'Executive Council',
    profileImageUrl: e.profileImageUrl,
    hall: e.hall,
  }))

  const heroImage =
    urlForImage(settings?.heroPhoto) ||
    settings?.heroPhotoUrl ||
    '/gallery/gallery-1.jpg'

  return (
    <div className="relative min-h-screen w-full max-w-full bg-[#fafaf9] text-slate-900 font-sans selection:bg-[#0077cc] selection:text-white overflow-x-hidden pt-16 sm:pt-20">
      {/* 1. Hero & Mission Manifesto */}
      <AboutHero
        stats={{
          activeMembers: settings?.statsActiveMembers,
          weeklyServices: settings?.statsWeeklyServices,
          campusLegacy: settings?.statsCampusLegacy,
        }}
        heroImage={heroImage}
      />

      {/* 2. Our Story & Chronological Milestones */}
      <AboutHistory />

      {/* 3. Core Pillars (Spiritual Dynamites, Academic Giants, Kingdom Community) */}
      <AboutPillars />

      {/* 4. Our Team — Executive Leadership (CSGB & Ministry Directors) */}
      <AboutLeadership excos={excos} />

      {/* 5. Fellowship Operational Teams (All 14 Units) */}
      <AboutTeams teams={teams} />

      {/* 6. High-Impact Action CTA */}
      <AboutCTA />
    </div>
  )
}
