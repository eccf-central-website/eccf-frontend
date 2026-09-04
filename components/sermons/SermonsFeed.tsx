/**
 * SermonsFeed — Client Component
 *
 * Interactive search and dynamic topic filter feed for ECCF Sermon Vault.
 * Receives live sermons directly from Server Component. Zero hardcoded fallbacks.
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Clock, BookOpen, Calendar, Filter, Radio, Disc3 } from 'lucide-react'
import { SpotifyIcon, YouTubeMusicIcon, YouTubeIcon } from '@/components/ui/PlatformIcons'

export interface SermonItem {
  _id: string
  title: string
  preacher: string
  series?: string
  topics?: string[]
  datePreached?: string
  scriptureReference?: string
  duration?: string
  spotifyUrl?: string
  youtubeUrl?: string
  youtubeMusicUrl?: string
  mediaUrl?: string
}

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
      <div className="mb-10 sm:mb-12 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, preacher, or series..."
            className="w-full rounded-2xl border-0 bg-[#fafaf9] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#0077cc]/30 focus:outline-none transition-all"
          />
        </div>

        {dynamicTopics.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400 mr-1 hidden sm:block" />
            {dynamicTopics.map((topic) => {
              const isActive = selectedTopic === topic
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
          <Disc3 className="h-14 w-14 text-slate-300 animate-pulse" />
          <p className="text-lg font-black text-slate-700 tracking-tight">
            {searchQuery || selectedTopic !== 'All'
              ? 'No sermons match your filter'
              : 'No sermons published in the vault yet'}
          </p>
          <p className="text-sm text-slate-500 max-w-md">
            {searchQuery || selectedTopic !== 'All'
              ? 'Try clearing your search query or choosing another topic.'
              : 'Recordings, podcasts, and video messages will appear here once published from Sanity Studio.'}
          </p>
        </div>
      )}

      {/* Sermon Cards Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((sermon, idx) => (
            <motion.div
              key={sermon._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-white shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all"
            >
              <div>
                {/* Thumbnail Header */}
                <div className="relative h-44 sm:h-48 w-full bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-slate-200/50 flex items-center justify-center p-4">
                  {sermon.duration && (
                    <div className="absolute top-3.5 right-3.5 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{sermon.duration}</span>
                    </div>
                  )}

                  {sermon.series && (
                    <div className="absolute top-3.5 left-3.5 rounded-full bg-white/80 backdrop-blur-md text-[#0077cc] text-[10px] font-black px-3 py-1 uppercase tracking-wider">
                      {sermon.series}
                    </div>
                  )}

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0077cc] shadow-sm group-hover:scale-110 transition-transform">
                    <Radio className="h-5 w-5 text-[#0077cc]" />
                  </div>
                </div>

                {/* Sermon Info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                    {sermon.datePreached && (
                      <>
                        <Calendar className="h-3.5 w-3.5 text-[#0077cc]" />
                        <span>{sermon.datePreached}</span>
                      </>
                    )}
                    {sermon.datePreached && sermon.scriptureReference && <span>&bull;</span>}
                    {sermon.scriptureReference && (
                      <>
                        <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{sermon.scriptureReference}</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-900 group-hover:text-[#0077cc] transition-colors leading-snug">
                    {sermon.title}
                  </h3>

                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {sermon.preacher}
                  </p>
                </div>
              </div>

              {/* Clean Platform Links */}
              <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-slate-100/60">
                <span className="text-[11px] font-bold text-slate-400">Stream on:</span>
                <div className="flex items-center gap-2">
                  {sermon.spotifyUrl && (
                    <a
                      href={sermon.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Listen on Spotify"
                      aria-label="Listen on Spotify"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fafaf9] text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
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
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fafaf9] text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
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
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fafaf9] text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    >
                      <YouTubeIcon className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  )
}