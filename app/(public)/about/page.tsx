/**
 * About Us Page — /about
 *
 * Turning Point USA (tpusa.com)-inspired comprehensive About Page.
 * Server component fetching live Sanity data (aboutPage, siteSettings, teamUnits, workers)
 * with robust canonical fallbacks.
 *
 * Features:
 * - High-energy Mission & Impact Hero
 * - Fellowship History & Chronological Milestones
 * - Core Values & Three Pillars
 * - Central Student Governing Body (CSGB) & Ministry Directors ("Our Team")
 * - Complete 14 Fellowship Operational Units (relocated from homepage)
 * - High-impact Get-Involved CTA
 */

import { Metadata } from 'next'
import { sanityClient, urlForImage } from '@/lib/sanity'
import {
  ABOUT_PAGE_QUERY,
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

interface RawSanityAboutPage {
  _id?: string
  heroBadge?: string
  heroSubheading?: string
  heroHeadline?: string
  heroSubtitle?: string
  missionCreed?: string
  heroPhoto?: unknown
  heroPhotoUrl?: string
  metricOperationalTeams?: string
  metricResidenceHalls?: string
  metricWeeklyEncounters?: string
  metricStudentImpact?: string
  storyHeadline?: string
  storyLead?: string
  storyParagraphs?: string[]
  storyQuote?: string
  storyPhoto1?: unknown
  storyPhoto1Url?: string
  storyPhoto2?: unknown
  storyPhoto2Url?: string
  milestones?: {
    _key?: string
    year: string
    badge: string
    title: string
    desc: string
  }[]
  pillarsHeadline?: string
  pillarsLead?: string
  pillar1Title?: string
  pillar1Subtitle?: string
  pillar1Scripture?: string
  pillar1Desc?: string
  pillar1Points?: string[]
  pillar2Title?: string
  pillar2Subtitle?: string
  pillar2Scripture?: string
  pillar2Desc?: string
  pillar2Points?: string[]
  pillar3Title?: string
  pillar3Subtitle?: string
  pillar3Scripture?: string
  pillar3Desc?: string
  pillar3Points?: string[]
  leadershipHeadline?: string
  leadershipLead?: string
  teamsHeadline?: string
  teamsLead?: string
  ctaTag?: string
  ctaHeadline?: string
  ctaSubtitle?: string
}

export default async function AboutPage() {
  // Concurrently fetch aboutPage, settings, teams, and excos from Sanity
  const [aboutData, settings, rawTeams, rawExcos] = await Promise.all([
    sanityClient.fetch<RawSanityAboutPage>(ABOUT_PAGE_QUERY).catch((err) => {
      console.error('[AboutPage] Failed to fetch aboutPage:', err)
      return null
    }),
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
    urlForImage(aboutData?.heroPhoto) ||
    aboutData?.heroPhotoUrl ||
    urlForImage(settings?.heroPhoto) ||
    settings?.heroPhotoUrl ||
    '/gallery/gallery-1.jpg'

  const storyPhoto1 =
    urlForImage(aboutData?.storyPhoto1) ||
    aboutData?.storyPhoto1Url ||
    '/gallery/gallery-2.jpg'

  const storyPhoto2 =
    urlForImage(aboutData?.storyPhoto2) ||
    aboutData?.storyPhoto2Url ||
    '/gallery/gallery-3.jpg'

  return (
    <div className="relative min-h-screen w-full max-w-full bg-[#fafaf9] text-slate-900 font-sans selection:bg-[#0077cc] selection:text-white overflow-x-hidden pt-16 sm:pt-20">
      {/* 1. Hero & Mission Manifesto */}
      <AboutHero
        badge={aboutData?.heroBadge}
        subheading={aboutData?.heroSubheading}
        headline={aboutData?.heroHeadline}
        subtitle={aboutData?.heroSubtitle}
        missionCreed={aboutData?.missionCreed}
        heroImage={heroImage}
        stats={{
          operationalTeams: aboutData?.metricOperationalTeams || '14',
          residenceHalls: aboutData?.metricResidenceHalls || '8',
          weeklyEncounters:
            aboutData?.metricWeeklyEncounters ||
            settings?.statsWeeklyServices ||
            '3',
          studentImpact: aboutData?.metricStudentImpact || '100%',
          activeMembers: settings?.statsActiveMembers,
          weeklyServices: settings?.statsWeeklyServices,
          campusLegacy: settings?.statsCampusLegacy,
        }}
      />

      {/* 2. Our Story & Chronological Milestones */}
      <AboutHistory
        headline={aboutData?.storyHeadline}
        lead={aboutData?.storyLead}
        paragraphs={aboutData?.storyParagraphs}
        quote={aboutData?.storyQuote}
        photo1={storyPhoto1}
        photo2={storyPhoto2}
        milestones={aboutData?.milestones}
      />

      {/* 3. Core Pillars (Spiritual Dynamites, Academic Giants, Kingdom Community) */}
      <AboutPillars
        headline={aboutData?.pillarsHeadline}
        lead={aboutData?.pillarsLead}
        pillar1={{
          title: aboutData?.pillar1Title,
          subtitle: aboutData?.pillar1Subtitle,
          scripture: aboutData?.pillar1Scripture,
          desc: aboutData?.pillar1Desc,
          points: aboutData?.pillar1Points,
        }}
        pillar2={{
          title: aboutData?.pillar2Title,
          subtitle: aboutData?.pillar2Subtitle,
          scripture: aboutData?.pillar2Scripture,
          desc: aboutData?.pillar2Desc,
          points: aboutData?.pillar2Points,
        }}
        pillar3={{
          title: aboutData?.pillar3Title,
          subtitle: aboutData?.pillar3Subtitle,
          scripture: aboutData?.pillar3Scripture,
          desc: aboutData?.pillar3Desc,
          points: aboutData?.pillar3Points,
        }}
      />

      {/* 4. Our Team — Executive Leadership (CSGB & Ministry Directors) */}
      <AboutLeadership
        headline={aboutData?.leadershipHeadline}
        lead={aboutData?.leadershipLead}
        excos={excos}
      />

      {/* 5. Fellowship Operational Teams (All 14 Units) */}
      <AboutTeams
        headline={aboutData?.teamsHeadline}
        lead={aboutData?.teamsLead}
        teams={teams}
      />

      {/* 6. High-Impact Action CTA */}
      <AboutCTA
        tag={aboutData?.ctaTag}
        headline={aboutData?.ctaHeadline}
        subtitle={aboutData?.ctaSubtitle}
      />
    </div>
  )
}
