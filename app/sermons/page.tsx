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
    <div className="min-h-screen bg-[#fafaf9] pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-[#0077cc] font-mono block mb-2">
            ECCF SERMON VAULT & PODCASTS
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
            Listen & Watch Inspired Teachings
          </h1>
          <p className="mt-3 text-xs sm:text-base text-slate-600 font-normal leading-relaxed">
            Equipping your heart and mind with life-transforming scriptures preached live at Edo State University. Stream audio on Spotify or YouTube Music, or watch on YouTube.
          </p>
        </div>

        <SermonsFeed sermons={sermons} />
      </div>
    </div>
  )
}