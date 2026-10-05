/**
 * AnnouncementsFeed — Client Component
 *
 * Receives pre-fetched announcements from the server-side page.tsx and
 * provides client-side search + category filtering.
 * Clean, compact bulletin layout avoiding huge bloated rectangles.
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Search, Filter, Pin, Clock, Megaphone } from 'lucide-react'
import { PortableText, PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'

const portableTextComponents: PortableTextComponents = {
  marks: {
    link: ({ value, children }) => {
      const href = value?.href || '#'
      const isExternal = href.startsWith('http') || href.startsWith('//')
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="font-bold text-[#0077cc] underline underline-offset-2 hover:text-sky-800 transition-colors"
        >
          {children}
        </a>
      )
    },
    strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    underline: ({ children }) => <span className="underline underline-offset-2">{children}</span>,
  },
  block: {
    normal: ({ children }) => (
      <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed mb-2.5 last:mb-0">
        {children}
      </p>
    ),
    h3: ({ children }) => (
      <h3 className="font-serif text-lg sm:text-xl text-slate-900 mt-3 mb-1.5 font-normal">
        {children}
      </h3>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside space-y-1 my-2 text-sm sm:text-base text-slate-600">
        {children}
      </ul>
    ),
  },
}

export interface AnnouncementItem {
  _id: string
  title: string
  category: string
  isPinned: boolean
  day: string
  month: string
  year: string
  publishDate: string
  rawDate?: string
  time: string
  location: string
  content?: string | PortableTextBlock[]
  plainText?: string
}

interface Props {
  announcements: AnnouncementItem[]
}

export default function AnnouncementsFeed({ announcements }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const dynamicCategories = [
    'All',
    ...Array.from(new Set(announcements.map((a) => a.category).filter(Boolean))),
  ]

  const filtered = announcements
    .filter((item) => {
      const contentStr = item.plainText || (typeof item.content === 'string' ? item.content : '')
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contentStr.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCat =
        selectedCategory === 'All' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase()
      return matchesSearch && matchesCat
    })
    .sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1
      }
      return (b.rawDate || '').localeCompare(a.rawDate || '')
    })

  return (
    <>
      {/* Search & Category Filter */}
      <div className="mb-6 sm:mb-8 flex flex-col md:flex-row items-center justify-between gap-3.5 bg-white border border-stone-200/80 p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements..."
            className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 mr-1 hidden sm:block" />
          {dynamicCategories.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Megaphone className="h-12 w-12 text-slate-300" />
          <p className="font-serif text-xl sm:text-2xl text-slate-800 tracking-tight">
            {searchQuery || selectedCategory !== 'All'
              ? 'No announcements match your filter'
              : 'No announcements published yet'}
          </p>
          <p className="text-sm text-slate-500 max-w-md">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try clearing your search or selecting a different category.'
              : 'Check back soon — the Exco team will post updates here.'}
          </p>
        </div>
      )}

      {/* Announcements Stream */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-4 sm:space-y-5">
          {filtered.map((item, idx) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.25) }}
              className={`relative overflow-hidden rounded-2xl bg-white border border-stone-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all ${
                item.isPinned ? 'ring-2 ring-sky-400/50' : ''
              }`}
            >
              {item.isPinned && (
                <div className="absolute top-0 right-0 rounded-bl-xl bg-[#0077cc] text-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Pin className="h-3 w-3 fill-white" />
                  <span>PINNED NOTICE</span>
                </div>
              )}

              <div className="flex items-start gap-4 sm:gap-5">
                {/* Compact Date Capsule */}
                <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-16 sm:h-20 rounded-xl bg-[#fbfbfa] border border-stone-200/80 p-1.5 text-center shrink-0 select-none">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#0077cc] block font-mono">
                    {item.month}
                  </span>
                  <span className="font-serif text-2xl sm:text-3xl text-slate-950 leading-none my-0.5">
                    {item.day}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 block">
                    {item.year}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0077cc] uppercase tracking-wider border border-sky-200/60">
                      {item.category}
                    </span>
                    {item.time && (
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.time}</span>
                      </div>
                    )}
                  </div>

                  <h2 className="font-serif text-xl sm:text-2xl text-slate-900 tracking-tight leading-snug">
                    {item.title}
                  </h2>

                  {item.content && (
                    <div className="pt-0.5">
                      {Array.isArray(item.content) ? (
                        <PortableText value={item.content} components={portableTextComponents} />
                      ) : (
                        <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed whitespace-pre-line">
                          {item.content}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#0077cc] shrink-0" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Calendar className="h-3 w-3" />
                      <span>Published {item.publishDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </>
  )
}