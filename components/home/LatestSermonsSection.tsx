/**
 * LatestSermonsSection — Client Component
 *
 * Implements Section 2.7 of SDD & ADR-002 guidelines.
 * Displays the latest inspired teachings fetched dynamically from Sanity Studio sermonVault.
 * Provides direct deep links for video/audio streaming on YouTube, Spotify, and YouTube Music.
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Radio, Disc3, Play } from 'lucide-react'
import { SpotifyIcon, YouTubeMusicIcon, YouTubeIcon } from '@/components/ui/PlatformIcons'
import { SermonItem } from '@/components/sermons/SermonsFeed'
import { getYoutubeVideoId, getSpotifyEmbedUrl } from '@/lib/sermonUtils'

interface Props {
  sermons?: SermonItem[] | null
}

export default function LatestSermonsSection({ sermons }: Props) {
  const safeSermons = sermons || []

  return (
    <section className="py-16 sm:py-24 bg-white border-t border-stone-100">
      <div className="w-full px-6 sm:px-8 lg:px-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-14 gap-4">
          <div>
            <span className="text-xs sm:text-sm font-bold tracking-widest text-[#0077cc] uppercase block mb-3 font-mono">
              SERMON VAULT &amp; PODCASTS
            </span>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] text-slate-950 tracking-tight leading-tight">
              Latest Inspired Messages
            </h2>
          </div>
          <Link
            href="/sermons"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0077cc] hover:text-sky-800 transition-colors group"
          >
            <span>Explore All Sermons</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Empty State when no sermons uploaded yet */}
        {safeSermons.length === 0 && (
          <div className="rounded-[28px] bg-[#fafaf9] border border-stone-200/80 p-8 sm:p-14 text-center flex flex-col items-center justify-center space-y-4">
            <Disc3 className="h-12 w-12 text-slate-300 animate-pulse" />
            <p className="font-serif font-bold text-xl sm:text-2xl text-slate-900">Audio &amp; Video Podcasts Coming Soon</p>
            <p className="text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed">
              Recordings from our Sunday, Word, and Academic Challenge services are being processed. Check the full vault for updates.
            </p>
            <Link
              href="/sermons"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-950 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 hover:bg-slate-800 transition-all shadow-md"
            >
              <span>Go to Sermon Vault</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Dynamic Sermon Cards */}
        {safeSermons.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {safeSermons.map((sermon, idx) => {
              const youtubeId = getYoutubeVideoId(sermon)
              const spotifyEmbedUrl = getSpotifyEmbedUrl(sermon)
              const hasPlayableMedia = Boolean(youtubeId || spotifyEmbedUrl || sermon.mediaUrl || sermon.youtubeUrl || sermon.spotifyUrl)

              return (
                <motion.div
                  key={sermon._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="group flex flex-col justify-between overflow-hidden rounded-[24px] bg-[#fafaf9] border border-stone-200/70 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all"
                >
                  <div>
                    {/* Media / Thumbnail Header */}
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

                    <div className="p-6 sm:p-7">
                      <a
                        href={sermon.youtubeUrl || sermon.spotifyUrl || sermon.mediaUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block font-serif font-bold text-lg sm:text-xl text-slate-950 group-hover:text-[#0077cc] transition-colors leading-snug ${
                          hasPlayableMedia ? 'cursor-pointer' : ''
                        }`}
                      >
                        {sermon.title}
                      </a>
                      <p className="text-sm font-semibold text-slate-600 mt-2">
                        {sermon.preacher} {sermon.datePreached && `• ${sermon.datePreached}`}
                      </p>
                    </div>
                  </div>

                  {/* Clean Platform Buttons & Quick Play */}
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

      </div>
    </section>
  )
}