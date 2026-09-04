/**
 * LatestSermonsSection — Client Component
 *
 * Implements Section 2.7 of SDD & CLAUDE.md guidelines.
 * Displays the latest inspired teachings fetched dynamically from Sanity Studio sermonVault.
 * Clean, icon-only platform links for Spotify, YouTube Music, and YouTube Video.
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Radio, Disc3 } from 'lucide-react'
import { SpotifyIcon, YouTubeMusicIcon, YouTubeIcon } from '@/components/ui/PlatformIcons'
import { SermonItem } from '@/components/sermons/SermonsFeed'

interface Props {
  sermons?: SermonItem[]
}

export default function LatestSermonsSection({ sermons = [] }: Props) {
  return (
    <section className="py-14 sm:py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-14 gap-4">
          <div>
            <span className="text-xs font-black tracking-widest text-[#0077cc] uppercase block mb-2 font-mono">
              SERMON VAULT & PODCASTS
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
              Latest Inspired Messages
            </h2>
          </div>
          <Link
            href="/sermons"
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#0077cc] hover:text-sky-800 transition-colors group"
          >
            <span>Explore All Sermons</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Empty State when no sermons uploaded yet */}
        {sermons.length === 0 && (
          <div className="rounded-3xl bg-[#fafaf9] p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Disc3 className="h-10 w-10 text-slate-300 animate-pulse" />
            <p className="text-base font-bold text-slate-700">Audio & Video Podcasts Coming Soon</p>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Recordings from our Sunday, Word, and Academic Challenge services are being processed. Check the full vault for updates.
            </p>
            <Link
              href="/sermons"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-950 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 hover:bg-slate-800 transition-all"
            >
              <span>Go to Sermon Vault</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Dynamic Sermon Cards */}
        {sermons.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {sermons.map((sermon, idx) => (
              <motion.div
                key={sermon._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-[#fafaf9] shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all"
              >
                <div>
                  <div className="relative h-40 sm:h-48 w-full bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-slate-200/50 flex items-center justify-center p-4">
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

                  <div className="p-5 sm:p-6">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#0077cc] transition-colors leading-snug">
                      {sermon.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {sermon.preacher} {sermon.datePreached && `• ${sermon.datePreached}`}
                    </p>
                  </div>
                </div>

                {/* Clean Platform Buttons */}
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 flex items-center justify-between border-t border-slate-100/60">
                  <span className="text-[11px] font-bold text-slate-400">Stream on:</span>
                  <div className="flex items-center gap-2">
                    {sermon.spotifyUrl && (
                      <a
                        href={sermon.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Listen on Spotify"
                        aria-label="Listen on Spotify"
                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                      >
                        <SpotifyIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </a>
                    )}

                    {sermon.youtubeMusicUrl && (
                      <a
                        href={sermon.youtubeMusicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Listen on YouTube Music"
                        aria-label="Listen on YouTube Music"
                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                      >
                        <YouTubeMusicIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </a>
                    )}

                    {sermon.youtubeUrl && (
                      <a
                        href={sermon.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Watch on YouTube"
                        aria-label="Watch on YouTube"
                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      >
                        <YouTubeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </section>
  )
}