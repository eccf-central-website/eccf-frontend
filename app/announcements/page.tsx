/**
 * Announcements Page — /announcements
 *
 * Real-time fellowship notices, upcoming campus service schedules, and executive updates.
 */

'use client'

import { motion } from 'framer-motion'
import { Bell, Calendar, MapPin, CheckCircle2 } from 'lucide-react'

const fallbackAnnouncements = [
  {
    _id: '1',
    title: 'Academic Challenge & Wonder Service Special',
    category: 'SPECIAL SERVICE',
    content:
      'Join us this Friday at 04:50 PM in Campus Fellowship Hall for an anointed session of academic prayer, study tips, and spiritual empowerment ahead of upcoming examinations.',
    publishDate: '2025-07-25',
    location: 'Campus Fellowship Hall',
  },
  {
    _id: '2',
    title: 'Sunday Worship Service — Favour Unveiled',
    category: 'SUNDAY SERVICE',
    content:
      'Glorious praise and deep scripture exposition await you this Sunday at 08:00 AM. Free transportation and student protocol support available at all hall quarters.',
    publishDate: '2025-07-20',
    location: 'Campus Fellowship Hall',
  },
  {
    _id: '3',
    title: 'Weekly Word Service — Book of Romans Study',
    category: 'BIBLE STUDY',
    content:
      'Deep dive into the Epistle to the Romans every Wednesday at 04:50 PM. Come with your Bibles, notebooks, and questions!',
    publishDate: '2025-07-16',
    location: 'Campus Fellowship Hall',
  },
]

export default function AnnouncementsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 sm:py-20">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff] flex items-center justify-center gap-1.5 mb-1">
            <Bell className="h-3.5 w-3.5 text-[#00a8ff]" />
            <span>ECCF NEWS & ANNOUNCEMENTS</span>
          </span>
          <h1 className="text-3xl font-black text-slate-900 sm:text-5xl mt-2">
            Campus Fellowship Updates
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Stay informed on weekly service times, special programs, executive notices, and campus outreach events.
          </p>
        </div>

        {/* Announcements List */}
        <div className="space-y-6">
          {fallbackAnnouncements.map((item, idx) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3.5 py-1 text-xs font-black text-[#00a8ff] border border-sky-100 uppercase tracking-wider">
                  <CheckCircle2 className="h-3 w-3" />
                  {item.category}
                </span>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Calendar className="h-3.5 w-3.5 text-[#00a8ff]" />
                  <span>{item.publishDate}</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {item.title}
              </h2>

              <p className="mt-3 text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                {item.content}
              </p>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-[#00a8ff]" />
                <span>{item.location}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
