/**
 * ECCF Homepage — /
 *
 * React SERVER Component — 100% powered by live Sanity Studio data.
 * Zero hardcoded fallback arrays. Zero dummy data.
 * Fetches settings, service schedule, operational teams, photo gallery,
 * and latest sermons concurrently on the Next.js server.
 */

import { sanityClient, urlForImage } from '@/lib/sanity'
import {
  SITE_SETTINGS_QUERY,
  SERVICES_QUERY,
  TEAMS_QUERY,
  GALLERY_QUERY,
  LATEST_SERMONS_QUERY,
} from '@/lib/queries'
import HeroSection, { SiteSettingsData } from '@/components/home/HeroSection'
import WhoWeAreSection from '@/components/home/WhoWeAreSection'
import ServiceScheduleConsole, { ServiceItem } from '@/components/home/ServiceScheduleConsole'
import TeamsSection, { TeamItem, GalleryItem } from '@/components/home/TeamsSection'
import LatestSermonsSection from '@/components/home/LatestSermonsSection'
import GivingHubSection from '@/components/home/GivingHubSection'
import PlanAVisitSection from '@/components/home/PlanAVisitSection'
import { SermonItem } from '@/components/sermons/SermonsFeed'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

interface RawSanityGallery {
  _id: string
  title: string
  category?: string
  image?: unknown
  imageUrl?: string
}

export default async function Home() {
  // Concurrently fetch all live data from Sanity on the server
  const [settings, services, rawTeams, rawGallery, latestSermons] = await Promise.all([
    sanityClient.fetch<SiteSettingsData>(SITE_SETTINGS_QUERY).catch((err) => {
      console.error('[Home] Failed to fetch siteSettings:', err)
      return null
    }),
    sanityClient.fetch<ServiceItem[]>(SERVICES_QUERY).catch((err) => {
      console.error('[Home] Failed to fetch services:', err)
      return []
    }),
    sanityClient.fetch<RawSanityTeam[]>(TEAMS_QUERY).catch((err) => {
      console.error('[Home] Failed to fetch teams:', err)
      return []
    }),
    sanityClient.fetch<RawSanityGallery[]>(GALLERY_QUERY).catch((err) => {
      console.error('[Home] Failed to fetch gallery:', err)
      return []
    }),
    sanityClient.fetch<SermonItem[]>(LATEST_SERMONS_QUERY).catch((err) => {
      console.error('[Home] Failed to fetch latestSermons:', err)
      return []
    }),
  ])

  // Map teams to component format with crop and hotspot support
  const teams: TeamItem[] = (rawTeams || []).map((t) => ({
    _id: t._id,
    name: t.name,
    role: t.leadName,
    description: t.description,
    imageUrl: urlForImage(t.image) || t.imageUrl,
    tag: t.tag,
  }))

  // Map gallery to component format with crop and hotspot support
  const gallery: GalleryItem[] = (rawGallery || []).map((g) => ({
    _id: g._id,
    src: urlForImage(g.image) || g.imageUrl || '/gallery/gallery-3.jpg',
    title: g.title,
    category: g.category || 'Fellowship Life',
  }))

  // Dedicated Minister (Pastor/President) & Audience (Students/Congregation) photos
  const ministerPhoto =
    urlForImage(settings?.whoWeArePhotoMinister) ||
    settings?.whoWeArePhotoMinisterUrl ||
    gallery.find((g) =>
      g.title.toLowerCase().includes('preach') ||
      g.title.toLowerCase().includes('exhortation') ||
      g.category === 'Sunday Service'
    )?.src ||
    gallery[0]?.src

  const audiencePhoto =
    urlForImage(settings?.whoWeArePhotoAudience) ||
    settings?.whoWeArePhotoAudienceUrl ||
    gallery.find((g) =>
      g.title.toLowerCase().includes('prayer') ||
      g.title.toLowerCase().includes('smiles') ||
      g.title.toLowerCase().includes('study') ||
      g.category === 'Prayer Night' ||
      g.category === 'Student Life'
    )?.src ||
    gallery[1]?.src

  return (
    <div className="relative min-h-screen bg-[#fafaf9] text-slate-900 font-sans selection:bg-[#0077cc] selection:text-white overflow-x-hidden pt-16 sm:pt-20">
      {/* 1. Hero Section */}
      <HeroSection settings={settings} />

      {/* 2. Who We Are */}
      <WhoWeAreSection
        photo1={ministerPhoto}
        photo2={audiencePhoto}
      />

      {/* 3. Interactive Service Schedule Console */}
      <ServiceScheduleConsole services={services || []} />

      {/* 4. Teams & Fellowship Life Section */}
      <TeamsSection teams={teams || []} gallery={gallery || []} />

      {/* 5. Sermon Vault & Podcasts Section */}
      <LatestSermonsSection sermons={latestSermons || []} />

      {/* 6. Giving Hub Section */}
      <GivingHubSection />

      {/* 7. Plan a Visit Section */}
      <PlanAVisitSection
        contactPerson={settings?.visitContactPerson || undefined}
        whatsAppNumber={settings?.visitWhatsAppNumber || undefined}
        email={settings?.fellowshipEmail || undefined}
      />
    </div>
  )
}