/**
 * Announcements Page — /announcements
 *
 * Real-time fellowship notices, upcoming campus service schedules, and executive updates.
 * Designed with category filtering, search, date badges, and clean editorial layout.
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Search,
  Filter,
  Pin,
  Clock,
} from 'lucide-react'

const announcementsData = [
  {
    _id: '1',
    title: 'Academic Challenge & Wonder Service Special: Exam Preparatory Impartation',
    category: 'ACADEMIC & EXAMS',
    isPinned: true,
    day: '25',
    month: 'JUL',
    time: '04:50 PM',
    content:
      'Join the fellowship this Friday for a specialized academic prayer and study empowerment session. Anointed senior scholars and faculty advisers will share practical study systems and lead intense breakthrough prayers ahead of university examinations.',
    publishDate: 'July 25, 2025',
    location: 'Campus Fellowship Hall, Edo State University',
  },
  {
    _id: '2',
    title: 'Sunday Worship Service — Favour Unveiled & Freshers Welcome',
    category: 'WEEKLY SERVICES',
    isPinned: false,
    day: '20',
    month: 'JUL',
    time: '08:00 AM',
    content:
      'Glorious praise, intimate worship, and deep scripture exposition await you this Sunday morning. Free fellowship transport shuttles will be operating across all hostel quarters starting from 07:15 AM.',
    publishDate: 'July 20, 2025',
    location: 'Campus Fellowship Hall, Edo State University',
  },
  {
    _id: '3',
    title: 'Weekly Word Service — Systematic Study of the Book of Romans',
    category: 'BIBLE STUDY',
    isPinned: false,
    day: '16',
    month: 'JUL',
    time: '04:50 PM',
    content:
      'Deep dive into the Epistle to the Romans every Wednesday. Come with your study Bibles, notebooks, and questions as we unpack grace, justification by faith, and Christian discipleship.',
    publishDate: 'July 16, 2025',
    location: 'Campus Fellowship Hall, Edo State University',
  },
  {
    _id: '4',
    title: 'Special Workers Roster & Ministry Team Auditions',
    category: 'EXCO UPDATES',
    isPinned: false,
    day: '10',
    month: 'JUL',
    time: '03:30 PM',
    content:
      'All newly admitted and returning students interested in serving in the Choir, Drama (Thespians), Prayer, Media, or Ushering & Protocol teams are invited to the orientation and audition session this Saturday.',
    publishDate: 'July 10, 2025',
    location: 'Choir & Media Room, Fellowship Hall',
  },
]

const categories = ['All', 'Weekly Services', 'Academic & Exams', 'Bible Study', 'Exco Updates']

export default function AnnouncementsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredAnnouncements = announcementsData.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat =
      selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCat
  })

  return (
    <div className="min-h-screen bg-[#fafaf9] pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-24 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-[#0095ff] font-mono block mb-2">
            CAMPUS BULLETINS & NOTICES
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
            Fellowship Announcements
          </h1>
          <p className="mt-3 text-xs sm:text-base text-slate-600 font-normal leading-relaxed">
            Stay updated on weekly service schedules, academic prayer alerts, leadership notices, and campus outreach events at Edo State University.
          </p>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="mb-10 sm:mb-12 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements..."
              className="w-full rounded-2xl border-0 bg-[#fafaf9] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#0095ff]/30 focus:outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400 mr-1 hidden sm:block" />
            {categories.map((cat) => {
              const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Announcements Stream */}
        <div className="space-y-6">
          {filteredAnnouncements.map((item, idx) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className={`relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-all ${
                item.isPinned ? 'ring-2 ring-sky-400/40' : ''
              }`}
            >
              {item.isPinned && (
                <div className="absolute top-0 right-0 rounded-bl-2xl bg-sky-500 text-white px-4 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Pin className="h-3 w-3 fill-white" />
                  <span>PINNED NOTICE</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Date Capsule (2 cols) */}
                <div className="md:col-span-2 flex md:flex-col items-center justify-center rounded-2xl bg-[#fafaf9] p-3.5 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0095ff] block">
                    {item.month}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none my-0.5">
                    {item.day}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 block">
                    2025
                  </span>
                </div>

                {/* Main Content (10 cols) */}
                <div className="md:col-span-10 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-0.5 text-[11px] font-black text-[#0095ff] uppercase tracking-wider">
                      {item.category}
                    </span>

                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.time}</span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
                    {item.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                    {item.content}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#0095ff] shrink-0" />
                      <span>{item.location}</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Published {item.publishDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  )
}
