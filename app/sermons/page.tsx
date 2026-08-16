/**
 * Sermon Vault Page — /sermons
 *
 * Implements ADR-002: Podcast-first media hub with clean, icon-only platform links
 * for Spotify, YouTube Music, and YouTube Video.
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Clock, BookOpen, Calendar, Filter, Headphones } from 'lucide-react'
import { SpotifyIcon, YouTubeMusicIcon, YouTubeIcon } from '@/components/ui/PlatformIcons'

const fallbackSermons = [
  {
    _id: '1',
    title: 'Walking in Uncommon Favour',
    preacher: 'Bro. Emmanuel Obi',
    series: 'Favour Unveiled',
    topics: ['Favour', 'Grace', 'Faith'],
    datePreached: '2025-07-06',
    scriptureReference: 'Psalm 102:13',
    duration: '48 min',
    spotifyUrl: 'https://open.spotify.com',
    youtubeMusicUrl: 'https://music.youtube.com',
    youtubeUrl: 'https://youtube.com',
  },
  {
    _id: '2',
    title: 'The Discipline of the Anointed Student',
    preacher: 'Sis. Grace Iyamu',
    series: 'Campus Giants',
    topics: ['Academics', 'Discipline', 'Leadership'],
    datePreached: '2025-06-29',
    scriptureReference: 'Daniel 1:17',
    duration: '52 min',
    spotifyUrl: 'https://open.spotify.com',
    youtubeMusicUrl: 'https://music.youtube.com',
    youtubeUrl: 'https://youtube.com',
  },
  {
    _id: '3',
    title: 'Praying with Authority on Campus',
    preacher: 'Bro. Samuel Edosa',
    series: 'Power & Prayer',
    topics: ['Prayer', 'Spiritual Warfare'],
    datePreached: '2025-06-22',
    scriptureReference: 'Luke 18:1',
    duration: '45 min',
    spotifyUrl: 'https://open.spotify.com',
    youtubeMusicUrl: 'https://music.youtube.com',
    youtubeUrl: 'https://youtube.com',
  },
  {
    _id: '4',
    title: 'Letters in Our Heads: Academic Excellence',
    preacher: 'Dr. Clement Alabi',
    series: 'Academic Giants',
    topics: ['Academics', 'Excellence', 'Wisdom'],
    datePreached: '2025-06-15',
    scriptureReference: 'Proverbs 4:7',
    duration: '60 min',
    spotifyUrl: 'https://open.spotify.com',
    youtubeMusicUrl: 'https://music.youtube.com',
    youtubeUrl: 'https://youtube.com',
  },
  {
    _id: '5',
    title: 'Jesus in Our Hearts: Uncompromising Faith',
    preacher: 'Bro. Emmanuel Obi',
    series: 'Spiritual Dynamites',
    topics: ['Faith', 'Consecration'],
    datePreached: '2025-06-08',
    scriptureReference: 'Romans 1:16',
    duration: '50 min',
    spotifyUrl: 'https://open.spotify.com',
    youtubeMusicUrl: 'https://music.youtube.com',
    youtubeUrl: 'https://youtube.com',
  },
  {
    _id: '6',
    title: 'Overcoming Examination Anxiety through Prayer',
    preacher: 'Sis. Blessing Okon',
    series: 'Campus Giants',
    topics: ['Academics', 'Peace', 'Prayer'],
    datePreached: '2025-06-01',
    scriptureReference: 'Philippians 4:6-7',
    duration: '42 min',
    spotifyUrl: 'https://open.spotify.com',
    youtubeMusicUrl: 'https://music.youtube.com',
    youtubeUrl: 'https://youtube.com',
  },
]

const topicFilters = ['All', 'Academics', 'Faith', 'Prayer', 'Leadership', 'Favour']

export default function SermonsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('All')

  const filteredSermons = fallbackSermons.filter((sermon) => {
    const matchesSearch =
      sermon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sermon.preacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sermon.series.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTopic =
      selectedTopic === 'All' || sermon.topics.includes(selectedTopic)
    return matchesSearch && matchesTopic
  })

  return (
    <div className="min-h-screen bg-[#fdfdfd] py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-[#0095ff]">
            ECCF SERMON VAULT & PODCASTS
          </span>
          <h1 className="text-3xl font-black text-slate-900 sm:text-5xl mt-2 tracking-tight">
            Listen & Watch Inspired Teachings
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Equipping your heart and mind with life-transforming scriptures preached live at Edo State University. Stream audio on Spotify or YouTube Music, or watch on YouTube.
          </p>
        </div>

        {/* Search & Topic Filters */}
        <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, preacher, or series..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-[#0095ff] focus:ring-1 focus:ring-[#0095ff] focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400 mr-1 hidden sm:block" />
            {topicFilters.map((topic) => {
              const isActive = selectedTopic === topic
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#0095ff] text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {topic}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sermon Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredSermons.map((sermon, idx) => (
            <motion.div
              key={sermon._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ y: -6 }}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl hover:shadow-sky-500/10 transition-all"
            >
              <div>
                {/* Thumbnail Header */}
                <div className="relative h-44 sm:h-48 w-full bg-gradient-to-br from-sky-100/70 via-sky-50/50 to-slate-100 flex items-center justify-center p-4">
                  <div className="absolute top-3 right-3 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{sermon.duration}</span>
                  </div>

                  <div className="absolute top-3 left-3 rounded-full bg-sky-500/20 backdrop-blur-md text-[#0095ff] text-[10px] font-black px-3 py-1 border border-sky-300/40">
                    {sermon.series}
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0095ff] shadow-md">
                    <Headphones className="h-6 w-6 text-[#0095ff]" />
                  </div>
                </div>

                {/* Sermon Info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                    <Calendar className="h-3.5 w-3.5 text-[#0095ff]" />
                    <span>{sermon.datePreached}</span>
                    <span>&bull;</span>
                    <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{sermon.scriptureReference}</span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 group-hover:text-[#0095ff] transition-colors leading-snug">
                    {sermon.title}
                  </h3>

                  <p className="text-xs font-bold text-slate-500 mt-1">
                    {sermon.preacher}
                  </p>
                </div>
              </div>

              {/* Icon-Only Platform Links */}
              <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">Stream on:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={sermon.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Listen on Spotify"
                    aria-label="Listen on Spotify"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 transition-all shadow-sm"
                  >
                    <SpotifyIcon className="h-4 w-4" />
                  </a>

                  <a
                    href={sermon.youtubeMusicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Listen on YouTube Music"
                    aria-label="Listen on YouTube Music"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 transition-all shadow-sm"
                  >
                    <YouTubeMusicIcon className="h-4 w-4" />
                  </a>

                  <a
                    href={sermon.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Watch on YouTube"
                    aria-label="Watch on YouTube"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition-all shadow-sm"
                  >
                    <YouTubeIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
