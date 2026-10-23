/**
 * Announcements Live Preview — /announcements/preview
 *
 * Dedicated live preview endpoint for Sanity Studio iframe pane.
 * Fetches draft or published documents in real-time so editors can
 * inspect both website card rendering and email bulletin layout before publishing.
 */

import { draftMode } from 'next/headers'
import { sanityWriteClient } from '@/lib/sanity'
import { getSession } from '@/lib/dashboard/auth'
import { redirect } from 'next/navigation'
import AnnouncementsFeed, { AnnouncementItem } from '@/components/home/AnnouncementsFeed'
import { toPlainText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Mail, Sparkles } from 'lucide-react'

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
  isPublished?: boolean
  sendBroadcastOnPublish?: boolean
  sentToSubscribers?: boolean
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

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnnouncementPreviewPage({
  searchParams,
}: {
  searchParams: { id?: string; mode?: string; preview?: string }
}) {
  const isPreview = draftMode().isEnabled || searchParams.preview === 'true'
  const session = await getSession()
  if (!session && !isPreview) redirect('/login')

  const rawId = searchParams.id || ''
  const cleanId = rawId.replace(/^drafts\./, '')

  let doc: SanityAnnouncement | null = null

  if (cleanId) {
    try {
      // Prioritize draft document if exists, fallback to published
      const query = `*[_type == "announcement" && (_id == $id || _id == "drafts." + $id)] | order(_updatedAt desc)[0]{
        _id,
        title,
        category,
        isPinned,
        time,
        location,
        eventDate,
        publishDate,
        content,
        isPublished,
        sendBroadcastOnPublish,
        sentToSubscribers
      }`
      doc = await sanityWriteClient.fetch<SanityAnnouncement | null>(query, { id: cleanId })
    } catch (err) {
      console.error('[Preview] Error fetching announcement:', err)
    }
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-[#fafaf9] pt-28 pb-20 px-6 text-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-sky-50 text-[#0077cc] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-6 w-6 shrink-0" />
          </div>
          <h2 className="font-serif text-xl font-bold text-slate-900 mb-2">
            Sanity Live Studio Preview
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            {cleanId
              ? `Could not find announcement with ID "${cleanId}".`
              : 'Select an announcement document in Sanity Studio to see live rendering here.'}
          </p>
          <Link
            href="/announcements"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0077cc] hover:underline"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>Go to Public Announcements</span>
          </Link>
        </div>
      </div>
    )
  }

  const isDraft = doc._id.startsWith('drafts.')
  const eventDateStr = doc.eventDate || doc.publishDate
  const eventDateObj = parseDate(eventDateStr)
  const publishDateObj = parseDate(doc.publishDate)

  const previewItem: AnnouncementItem = {
    _id: doc._id,
    title: doc.title || 'Untitled Announcement',
    category: (doc.category || 'GENERAL').toUpperCase(),
    isPinned: Boolean(doc.isPinned),
    day: eventDateObj.day,
    month: eventDateObj.month,
    year: eventDateObj.year,
    publishDate: publishDateObj.full,
    rawDate: doc.eventDate || doc.publishDate || '',
    time: doc.time || '',
    location: doc.location || 'NLT 5, Faculty of Law, ESUI',
    content: doc.content,
    plainText: extractText(doc.content),
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 pt-20 pb-20">
      {/* Studio Preview Top Bar */}
      <div className="bg-slate-950 text-white px-4 sm:px-6 py-3 border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 shrink-0 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 shrink-0 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wider font-mono uppercase text-sky-400">
              Studio Live Preview
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              &bull; {isDraft ? 'Unsaved / Draft Mode' : 'Published Document'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {doc.isPublished === false && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                Draft (Not Live)
              </span>
            )}
            {doc.sentToSubscribers && (
              <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30 flex items-center gap-1">
                <Mail className="h-3 w-3 shrink-0" />
                <span>Emailed</span>
              </span>
            )}
            <Link
              href="/announcements"
              target="_blank"
              className="text-slate-300 hover:text-white transition-colors flex items-center gap-1 ml-2 font-medium"
            >
              <span>Live Site</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-12 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#0077cc] font-mono">
            WEBSITE RENDERING PREVIEW
          </span>
          <span className="text-xs text-slate-500">
            Updates in real-time as you type in Sanity Studio
          </span>
        </div>

        {/* Render Single Announcement Item with exact design */}
        <AnnouncementsFeed announcements={[previewItem]} />
      </div>
    </div>
  )
}
