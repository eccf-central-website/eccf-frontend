/**
 * Sermon Vault Page — /sermons
 *
 * Provides a comprehensive, searchable, filterable archive of ECCF audio messages,
 * teachings, and sermon series with integrated live playback capability.
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Search, Clock, BookOpen, Calendar, Filter } from 'lucide-react'

// Fallback sermon data matching Sanity schema shape
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
  },
]

const topicFilters = ['All', 'Academics', 'Faith', 'Prayer', 'Leadership', 'Favour']

export default function SermonsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('All')
  const handlePlay = (title: string, preacher: string) => {
    // Audio player removed per UI updates
    console.log('Play clicked:', title, preacher)
  }

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
    <div className="min-h-screen bg-[#f8fafc] py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff]">
            ECCF SERMON VAULT
          </span>
          <h1 className="text-3xl font-black text-slate-900 sm:text-5xl mt-2">
            Listen to Inspired Word Messages
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Equipping your heart and mind with life-transforming scriptures preached live at Edo State University.
          </p>
        </div>

        {/* Search & Topic Filters */}
        <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, preacher, or series..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-[#00a8ff] focus:ring-1 focus:ring-[#00a8ff] focus:outline-none transition-all"
            />
          </div>

          {/* Topic Pills */}
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
                      ? 'bg-[#00a8ff] text-white shadow-md shadow-sky-500/20'
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
              onClick={() => handlePlay(sermon.title, sermon.preacher)}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:shadow-sky-500/10 transition-all cursor-pointer"
            >
              {/* Card Header & Thumbnail */}
              <div>
                <div className="relative h-44 sm:h-48 w-full bg-gradient-to-br from-sky-100/70 via-sky-50/50 to-slate-100 flex items-center justify-center p-4">
                  <div className="absolute top-3 right-3 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{sermon.duration}</span>
                  </div>

                  <div className="absolute top-3 left-3 rounded-full bg-sky-500/20 backdrop-blur-md text-[#00a8ff] text-[10px] font-extrabold px-3 py-1 border border-sky-300/40">
                    {sermon.series}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00a8ff] text-white shadow-lg shadow-sky-500/30"
                  >
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                    <Calendar className="h-3.5 w-3.5 text-[#00a8ff]" />
                    <span>{sermon.datePreached}</span>
                    <span>&bull;</span>
                    <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{sermon.scriptureReference}</span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 group-hover:text-[#00a8ff] transition-colors leading-snug">
                    {sermon.title}
                  </h3>

                  <p className="text-xs font-bold text-slate-500 mt-1">
                    {sermon.preacher}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {sermon.topics.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#00a8ff] hover:underline"
                >
                  <Play className="h-3 w-3 fill-[#00a8ff]" />
                  <span>Listen</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredSermons.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <p className="text-slate-500 font-medium text-sm">No sermons found matching &ldquo;{searchQuery}&rdquo;</p>
          </div>
        )}
      </div>

    </div>
  )
}
