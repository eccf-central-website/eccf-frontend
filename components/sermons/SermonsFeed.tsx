/**
 * SermonsFeed — Client Component
 *
 * Interactive search, topic filter, and multi-format direct stream links for ECCF Sermon Vault.
 * Receives live sermons directly from Server Component. Zero hardcoded fallbacks.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Search, Clock, BookOpen, Calendar, Filter, Radio, Disc3, Play } from 'lucide-react'
import { SpotifyIcon, YouTubeMusicIcon, YouTubeIcon } from '@/components/ui/PlatformIcons'
import { SermonPlayerItem as SermonItem, getYoutubeVideoId, getSpotifyEmbedUrl } from '@/lib/sermonUtils'
export type { SermonPlayerItem as SermonItem } from '@/lib/sermonUtils'

interface Props {
  sermons?: SermonItem[] | null
}

export default function SermonsFeed({ sermons }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('All')

  const safeSermons = sermons || []

  // Derive dynamic topic filters from live sermons
  const dynamicTopics = [
    'All',
    ...Array.from(
      new Set(
        safeSermons.flatMap((s) => s.topics || []).filter(Boolean)
      )
    ),
  ]

  const filtered = safeSermons.filter((sermon) => {
    const titleStr = sermon.title || ''
    const preacherStr = sermon.preacher || ''
    const seriesStr = sermon.series || ''
    const query = searchQuery.toLowerCase()

    const matchesSearch =
      titleStr.toLowerCase().includes(query) ||
      preacherStr.toLowerCase().includes(query) ||
      seriesStr.toLowerCase().includes(query)
    const matchesTopic =
      selectedTopic === 'All' || (sermon.topics && sermon.topics.includes(selectedTopic))
    return matchesSearch && matchesTopic
  })

  return (
    <>
      {/* Search & Topic Filters */}
      <div className="mb-10 sm:mb-14 flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-stone-200/80 p-5 sm:p-6 rounded-[24px] shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, preacher, or series..."
            className="w-full rounded-2xl border border-stone-200 bg-[#fafaf9] pl-12 pr-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] focus:outline-none transition-all"
          />
        </div>

        {dynamicTopics.length > 1 && (
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400 mr-1 hidden sm:block" />
            {dynamicTopics.map((topic) => {
              const isActive = selectedTopic === topic
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`rounded-full px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-md'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                  }`}
                >
                  {topic}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Disc3 className="h-16 w-16 text-slate-300 animate-pulse" />
          <p className="font-serif font-bold text-2xl text-slate-800 tracking-tight">
            {searchQuery || selectedTopic !== 'All'
              ? 'No sermons match your filter'
              : 'No sermons published in the vault yet'}
          </p>
          <p className="text-base text-slate-600 max-w-md">
            {searchQuery || selectedTopic !== 'All'
              ? 'Try clearing your search query or choosing another topic.'
              : 'Recordings, podcasts, and video messages will appear here once published from Sanity Studio.'}
          </p>
        </div>
      )}

      {/* Sermon Cards Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((sermon, idx) => {
            const youtubeId = getYoutubeVideoId(sermon)
            const spotifyEmbedUrl = getSpotifyEmbedUrl(sermon)
            const hasPlayableMedia = Boolean(youtubeId || spotifyEmbedUrl || sermon.mediaUrl || sermon.youtubeUrl || sermon.spotifyUrl)

            return (
              <motion.div
                key={sermon._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group flex flex-col justify-between overflow-hidden rounded-[24px] bg-white border border-stone-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all"
              >
                <div>
                  {/* Thumbnail / Media Header */}
                  <div className="relative h-48 sm:h-56 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                    {youtubeId ? (
                      <>
                        <Image
                          src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                          alt={sermon.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-black/20 to-transparent pointer-events-none" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-slate-200/50" />
                    )}

                    {sermon.duration && (
                      <div className="absolute top-3.5 right-3.5 z-10 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 flex items-center gap-1.5 shadow-sm">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{sermon.duration}</span>
                      </div>
                    )}

                    {sermon.series && (
                      <div className="absolute top-3.5 left-3.5 z-10 rounded-full bg-white/95 backdrop-blur-md text-[#0077cc] text-[11px] font-bold px-3.5 py-1 uppercase tracking-wider shadow-sm">
                        {sermon.series}
                      </div>
                    )}

                    {/* Play Button Trigger */}
                    {hasPlayableMedia ? (
                      <a
                        href={sermon.youtubeUrl || sermon.spotifyUrl || sermon.mediaUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Play ${sermon.title}`}
                        className={`relative z-10 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full text-white shadow-xl group-hover:scale-110 transition-all cursor-pointer ${
                          youtubeId
                            ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                            : 'bg-[#0095ff] hover:bg-sky-500 shadow-sky-500/30'
                        }`}
                      >
                        <Play className="h-6 w-6 fill-white translate-x-0.5" />
                      </a>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0077cc] shadow-sm">
                        <Radio className="h-5 w-5 text-[#0077cc]" />
                      </div>
                    )}
                  </div>

                  {/* Sermon Info */}
                  <div className="p-6 sm:p-7">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2.5">
                      {sermon.datePreached && (
                        <>
                          <Calendar className="h-3.5 w-3.5 text-[#0077cc]" />
                          <span>{sermon.datePreached}</span>
                        </>
                      )}
                      {sermon.datePreached && sermon.scriptureReference && <span>&bull;</span>}
                      {sermon.scriptureReference && (
                        <>
                          <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{sermon.scriptureReference}</span>
                        </>
                      )}
                    </div>

                    <a
                      href={sermon.youtubeUrl || sermon.spotifyUrl || sermon.mediaUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block font-serif font-bold text-xl text-slate-950 group-hover:text-[#0077cc] transition-colors leading-snug ${
                        hasPlayableMedia ? 'cursor-pointer' : ''
                      }`}
                    >
                      {sermon.title}
                    </a>

                    <p className="text-sm font-semibold text-slate-600 mt-2">
                      {sermon.preacher}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-3 flex items-center justify-between border-t border-slate-100">
                  {hasPlayableMedia ? (
                    <a
                      href={sermon.youtubeUrl || sermon.spotifyUrl || sermon.mediaUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0077cc] hover:text-sky-800 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{youtubeId ? 'Watch Video' : 'Listen Now'}</span>
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Stream on:</span>
                  )}

                  <div className="flex items-center gap-2">
                    {sermon.spotifyUrl && (
                      <a
                        href={sermon.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Listen on Spotify"
                        aria-label="Listen on Spotify"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-stone-200/60"
                      >
                        <SpotifyIcon className="h-4 w-4" />
                      </a>
                    )}

                    {sermon.youtubeMusicUrl && (
                      <a
                        href={sermon.youtubeMusicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Listen on YouTube Music"
                        aria-label="Listen on YouTube Music"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-stone-200/60"
                      >
                        <YouTubeMusicIcon className="h-4 w-4" />
                      </a>
                    )}

                    {sermon.youtubeUrl && (
                      <a
                        href={sermon.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Watch on YouTube"
                        aria-label="Watch on YouTube"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-stone-200/60"
                      >
                        <YouTubeIcon className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </>
  )
}