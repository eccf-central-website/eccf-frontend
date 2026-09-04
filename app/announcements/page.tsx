/**
 * Announcements Page — /announcements
 *
 * React SERVER Component — fetches directly from Sanity on Vercel's server.
 * No browser-side Sanity calls. No CORS. No client network dependency.
 * Interactive search/filter lives in AnnouncementsFeed (client component).
 */

import { sanityClient } from '@/lib/sanity'
import { ANNOUNCEMENTS_QUERY } from '@/lib/queries'
import AnnouncementsFeed, { AnnouncementItem } from '@/components/home/AnnouncementsFeed'
import type { PortableTextBlock } from '@portabletext/types'
import { toPlainText } from '@portabletext/react'

interface SanityAnnouncement {
  _id: string
  title: string
  category?: string
  isPinned?: boolean
  eventDate?: string
  publishDate?: string
  time?: string
  location?: string
  content?: string | PortableTextBlock[]
}

function extractText(content?: string | PortableTextBlock[]): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    try {
      return toPlainText(content)
    } catch {
      return ''
    }
  }
  return ''
}

function parseDate(dateStr?: string) {
  if (!dateStr) return { day: '--', month: '---', year: '----', full: 'Date not set' }
  const parts = dateStr.split('-').map(Number)
  const y = parts[0], m = parts[1], d = parts[2]
  if (!y || !m || !d) return { day: '--', month: '---', year: '----', full: dateStr }
  const m3 = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  const mf = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return {
    day: String(d).padStart(2, '0'),
    month: m3[m - 1],
    year: String(y),
    full: `${mf[m - 1]} ${d}, ${y}`,
  }
}

// Opt out of all caching — always fetch fresh data on every request
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnnouncementsPage() {
  let announcements: AnnouncementItem[] = []

  try {
    const raw = await sanityClient.fetch<SanityAnnouncement[]>(ANNOUNCEMENTS_QUERY)
    if (raw && raw.length > 0) {
      announcements = raw.map((item) => {
        // Event date is prominently displayed in the left badge (falls back to publishDate if not specified)
        const eventDateStr = item.eventDate || item.publishDate
        const eventDateObj = parseDate(eventDateStr)
        const publishDateObj = parseDate(item.publishDate)
        return {
          _id: item._id,
          title: item.title || 'Fellowship Announcement',
          category: (item.category || 'GENERAL').toUpperCase(),
          isPinned: Boolean(item.isPinned),
          day: eventDateObj.day,
          month: eventDateObj.month,
          year: eventDateObj.year,
          publishDate: publishDateObj.full,
          rawDate: item.eventDate || item.publishDate || '',
          time: item.time || '',
          location: item.location || 'NLT 5, Faculty of Law, ESUI',
          content: item.content,
          plainText: extractText(item.content),
        }
      })
    }
  } catch (err) {
    console.error('[AnnouncementsPage] Sanity fetch error:', err)
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-24 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-[#0077cc] font-mono block mb-2">
            CAMPUS BULLETINS &amp; NOTICES
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
            Fellowship Announcements
          </h1>
          <p className="mt-3 text-xs sm:text-base text-slate-600 font-normal leading-relaxed">
            Stay updated on weekly service schedules, academic prayer alerts, leadership notices, and campus outreach events at Edo State University.
          </p>
        </div>

        {/* Client component handles search, filter & rendering */}
        <AnnouncementsFeed announcements={announcements} />

      </div>
    </div>
  )
}