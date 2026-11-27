/**
 * Sermon Vault Page — /sermons
 *
 * React Server Component — fetches live sermons and AI Search config from Sanity Studio.
 * Zero hardcoded fallback data. Supports AI Message Finder (?ai=1&q=...), exact keyword
 * search (?q=...&exact=1), topic filtering, and podcast/video detail playback.
 */

import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { getSanityClient } from '@/lib/sanity'
import PreviewBanner from '@/components/common/PreviewBanner'
import { PUBLIC_AI_SEARCH_CONFIG_QUERY, SERMONS_QUERY } from '@/lib/queries'
import SermonsFeed, { SermonItem } from '@/components/sermons/SermonsFeed'
import { triggerBackgroundSyncIfNeeded } from '@/lib/sermonSync'
import { mergeAiSearchConfig, pickRandomSuggestions } from '@/lib/sermon-ai/defaults'
import type { AiSearchConfig } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Sermon Vault & Podcasts | ECCF Family',
  description:
    'Listen, watch, and search inspired sermons preached live at Edo State University Christian Campus Fellowship (ECCF).',
}

function getParam(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

export default async function SermonsPage({
  searchParams,
}: {
  searchParams?: {
    preview?: string
    q?: string | string[]
    ai?: string | string[]
    exact?: string | string[]
  }
}) {
  const isPreview = draftMode().isEnabled || searchParams?.preview === 'true'
  triggerBackgroundSyncIfNeeded()
  const client = getSanityClient(isPreview)

  const [rawSermons, rawAiConfig] = await Promise.all([
    client.fetch<SermonItem[]>(SERMONS_QUERY).catch((err) => {
      console.error('[SermonsPage] Failed to fetch live sermons:', err)
      return [] as SermonItem[]
    }),
    client.fetch<Partial<AiSearchConfig> | null>(PUBLIC_AI_SEARCH_CONFIG_QUERY).catch((err) => {
      console.error('[SermonsPage] Failed to fetch AI search config:', err)
      return null
    }),
  ])

  const sermons = Array.isArray(rawSermons) ? rawSermons : []
  const aiConfig = mergeAiSearchConfig(rawAiConfig)
  const initialSuggestions = pickRandomSuggestions(aiConfig.suggestions, 5)

  const initialQuery = getParam(searchParams?.q).trim()
  const exactParam = getParam(searchParams?.exact).toLowerCase()
  const aiParam = getParam(searchParams?.ai).toLowerCase()

  const initialExactMode = exactParam === '1' || exactParam === 'true'
  const initialAiMode = !initialExactMode && (aiParam === '1' || aiParam === 'true')

  return (
    <div className="min-h-screen bg-[#fafaf9] pt-28 sm:pt-32 md:pt-36 pb-20 sm:pb-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#0077cc] font-mono block mb-3">
            ECCF SERMON VAULT &amp; PODCASTS
          </span>
          <h1 className="font-serif font-bold text-3xl sm:text-5xl lg:text-6xl text-slate-950 tracking-tight leading-tight">
            Listen &amp; Watch Inspired Teachings
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-700 font-normal leading-relaxed">
            Equipping your heart and mind with life-transforming scriptures preached live at Edo State University. Stream audio on Spotify or YouTube Music, or watch on YouTube.
          </p>
        </div>

        <SermonsFeed
          sermons={sermons}
          aiConfig={aiConfig}
          initialSuggestions={initialSuggestions}
          initialQuery={initialQuery}
          initialAiMode={initialAiMode}
          initialExactMode={initialExactMode}
        />
      </div>

      {isPreview && <PreviewBanner exitUrl="/api/exit-preview?slug=/sermons" />}
    </div>
  )
}
