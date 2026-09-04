/**
 * Announcements Page — /announcements
 *
 * 100% live from Sanity Studio. No hardcoded fallback data anywhere.
 * Shows a loading state while fetching, empty state if nothing is published,
 * and live results with search + category filtering.
 */

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  MapPin,
  Search,
  Filter,
  Pin,
  Clock,
  Megaphone,
  Loader2,
} from "lucide-react"
import { sanityClient } from "@/lib/sanity"
import { ANNOUNCEMENTS_QUERY } from "@/lib/queries"

interface PortableTextSpan {
  text?: string
}

interface PortableTextBlock {
  _type?: string
  children?: PortableTextSpan[]
}

interface SanityAnnouncement {
  _id: string
  title: string
  category?: string
  isPinned?: boolean
  publishDate?: string
  time?: string
  location?: string
  content?: string | PortableTextBlock[]
}

interface ParsedAnnouncement {
  _id: string
  title: string
  category: string
  isPinned: boolean
  day: string
  month: string
  year: string
  publishDate: string
  time: string
  location: string
  content: string
}

function extractTextFromContent(content?: string | PortableTextBlock[]): string {
  if (!content) return ""
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (block && Array.isArray(block.children)) {
          return block.children.map((child) => child.text || "").join("")
        }
        return ""
      })
      .filter(Boolean)
      .join("\n\n")
  }
  return ""
}

function parsePublishDate(dateStr?: string) {
  if (!dateStr) return { day: "--", month: "---", year: "----", full: "Date not set" }
  const parts = dateStr.split("-").map(Number)
  const y = parts[0], m = parts[1], d = parts[2]
  if (!y || !m || !d) return { day: "--", month: "---", year: "----", full: dateStr }
  const months3 = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
  const monthsFull = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  return {
    day: String(d).padStart(2, "0"),
    month: months3[m - 1],
    year: String(y),
    full: `${monthsFull[m - 1]} ${d}, ${y}`,
  }
}

function parseAnnouncements(data: SanityAnnouncement[]): ParsedAnnouncement[] {
  return data.map((item) => {
    const dateObj = parsePublishDate(item.publishDate)
    return {
      _id: item._id,
      title: item.title || "Fellowship Announcement",
      category: (item.category || "GENERAL").toUpperCase(),
      isPinned: Boolean(item.isPinned),
      day: dateObj.day,
      month: dateObj.month,
      year: dateObj.year,
      publishDate: dateObj.full,
      time: item.time || "",
      location: item.location || "NLT 5, Faculty of Law, ESUI",
      content: extractTextFromContent(item.content),
    }
  })
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<ParsedAnnouncement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  useEffect(() => {
    setIsLoading(true)
    setFetchError(false)

    sanityClient
      .fetch<SanityAnnouncement[]>(ANNOUNCEMENTS_QUERY)
      .then((data) => {
        setAnnouncements(data && data.length > 0 ? parseAnnouncements(data) : [])
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch Sanity announcements:", err)
        setFetchError(true)
        setIsLoading(false)
      })
  }, [])

  const dynamicCategories = [
    "All",
    ...Array.from(new Set(announcements.map((a) => a.category).filter(Boolean))),
  ]

  const filteredAnnouncements = announcements.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat =
      selectedCategory === "All" ||
      item.category.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCat
  })

  return (
    <div className="min-h-screen bg-[#fafaf9] pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-24 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

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

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#0077cc]" />
            <p className="text-sm font-semibold">Loading latest announcements...</p>
          </div>
        )}

        {!isLoading && fetchError && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <Megaphone className="h-12 w-12 text-slate-300" />
            <p className="text-base font-bold text-slate-700">Could not load announcements</p>
            <p className="text-sm text-slate-500">Check your connection or try refreshing the page.</p>
          </div>
        )}

        {!isLoading && !fetchError && (
          <>
            <div className="mb-10 sm:mb-12 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl shadow-sm">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search announcements..."
                  className="w-full rounded-2xl border-0 bg-[#fafaf9] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#0077cc]/30 focus:outline-none transition-all"
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
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all uppercase ${
                        isActive
                          ? "bg-slate-950 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            {filteredAnnouncements.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <Megaphone className="h-14 w-14 text-slate-200" />
                <p className="text-lg font-black text-slate-400 tracking-tight">
                  {searchQuery || selectedCategory !== "All"
                    ? "No announcements match your filter"
                    : "No announcements published yet"}
                </p>
                <p className="text-sm text-slate-400 max-w-sm">
                  {searchQuery || selectedCategory !== "All"
                    ? "Try clearing your search or selecting a different category."
                    : "Check back soon — the Exco team will post updates here as they are published in Sanity Studio."}
                </p>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              <div className="space-y-6">
                {filteredAnnouncements.map((item, idx) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.3) }}
                    className={`relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-all ${
                      item.isPinned ? "ring-2 ring-sky-400/40" : ""
                    }`}
                  >
                    {item.isPinned && (
                      <div className="absolute top-0 right-0 rounded-bl-2xl bg-[#0077cc] text-white px-4 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Pin className="h-3 w-3 fill-white" />
                        <span>PINNED NOTICE</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      <div className="md:col-span-2 flex md:flex-col items-center justify-center rounded-2xl bg-[#fafaf9] p-3.5 text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0077cc] block">
                          {item.month}
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-slate-950 leading-none my-0.5 font-mono">
                          {item.day}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 block">
                          {item.year}
                        </span>
                      </div>

                      <div className="md:col-span-10 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-0.5 text-[11px] font-black text-[#0077cc] uppercase tracking-wider">
                            {item.category}
                          </span>
                          {item.time && (
                            <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span>{item.time}</span>
                            </div>
                          )}
                        </div>

                        <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
                          {item.title}
                        </h2>

                        {item.content && (
                          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed whitespace-pre-line">
                            {item.content}
                          </p>
                        )}

                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#0077cc] shrink-0" />
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
            </AnimatePresence>
          </>
        )}

      </div>
    </div>
  )
}
