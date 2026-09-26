/**
 * Sermon Vault Page — /sermons
 *
 * React Server Component — fetches live sermons from Sanity Studio.
 * Zero hardcoded fallback data. Supports podcast links, topic filtering, and search.
 */

import { sanityClient } from '@/lib/sanity'
import { SERMONS_QUERY } from '@/lib/queries'
import SermonsFeed, { SermonItem } from '@/components/sermons/SermonsFeed'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SermonsPage() {
  let sermons: SermonItem[] = []

  try {
    const raw = await sanityClient.fetch<SermonItem[]>(SERMONS_QUERY)
    if (raw && raw.length > 0) {
      sermons = raw
    }
  } catch (err) {
    console.error('[SermonsPage] Failed to fetch live sermons:', err)
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] pt-28 sm:pt-32 md:pt-36 pb-20 sm:pb-28">
      <div className="w-full px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
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

        <SermonsFeed sermons={sermons} />
      </div>
    </div>
  )
}