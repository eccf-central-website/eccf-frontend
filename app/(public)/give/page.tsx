/**
 * Online Giving Page — /give
 *
 * Dedicated global giving portal showing current fellowship bank transfer details.
 */

import { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { getSanityClient } from '@/lib/sanity'
import PreviewBanner from '@/components/common/PreviewBanner'
import { SITE_SETTINGS_QUERY } from '@/lib/queries'
import { SiteSettingsData } from '@/components/home/HeroSection'
import GivingHubSection from '@/components/home/GivingHubSection'
import SocialMediaBanner from '@/components/home/SocialMediaBanner'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Give Online | ECCF Edo State University Fellowship',
  description:
    'Support ECCF through confirmed fellowship bank transfer details for tithes, offerings, projects, and welfare.',
}

export default async function GivePage({
  searchParams,
}: {
  searchParams?: { preview?: string }
}) {
  const isPreview = draftMode().isEnabled || searchParams?.preview === 'true'
  const client = getSanityClient(isPreview)

  const settings = await client
    .fetch<SiteSettingsData>(SITE_SETTINGS_QUERY)
    .catch(() => null)

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <GivingHubSection settings={settings} />
      <SocialMediaBanner
        youtubeUrl={settings?.socialYouTube}
        instagramUrl={settings?.socialInstagram}
        xUrl={settings?.socialX}
        facebookUrl={settings?.socialFacebook}
        tiktokUrl={settings?.socialTikTok}
        telegramUrl={settings?.socialTelegram}
      />
      {isPreview && <PreviewBanner exitUrl="/api/exit-preview?slug=/give" />}
    </div>
  )
}

