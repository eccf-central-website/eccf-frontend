/**
 * SermonPlayerModal — Client Component
 *
 * Implements interactive playback for ECCF Sermon Vault (Sprint 4 Audio Engine).
 * Supports YouTube Video embed (with no-cookie domain), Spotify Web Playback iframe,
 * and direct streaming with seamless mode switching and external platform deep links.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Video, Headphones, Calendar, Clock, BookOpen, ExternalLink, Radio } from 'lucide-react'
import { SpotifyIcon, YouTubeMusicIcon, YouTubeIcon } from '@/components/ui/PlatformIcons'

export interface SermonPlayerItem {
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
  spotifyEmbedId?: string
  youtubeVideoId?: string
  mediaUrl?: string
}

export function getYoutubeVideoId(sermon: { youtubeVideoId?: string; youtubeUrl?: string } | null | undefined): string | null {
  if (!sermon) return null
  if (sermon.youtubeVideoId) return sermon.youtubeVideoId
  if (!sermon.youtubeUrl) return null
  const match = sermon.youtubeUrl.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

export function getSpotifyEmbedId(sermon: { spotifyEmbedId?: string; spotifyUrl?: string } | null | undefined): string | null {
  if (!sermon) return null
  if (sermon.spotifyEmbedId) return sermon.spotifyEmbedId
  if (!sermon.spotifyUrl) return null
  const match = sermon.spotifyUrl.match(/(?:episode|track|show)[/:]([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

interface Props {
  sermon: SermonPlayerItem | null
  initialMode?: 'video' | 'audio'
  onClose: () => void
}

export default function SermonPlayerModal({ sermon, initialMode = 'video', onClose }: Props) {
  const youtubeId = getYoutubeVideoId(sermon)
  const spotifyId = getSpotifyEmbedId(sermon)

  const hasVideo = Boolean(youtubeId)
  const hasAudio = Boolean(spotifyId || sermon?.mediaUrl)

  // Determine active mode based on availability and preference
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video')

  useEffect(() => {
    if (initialMode === 'audio' && hasAudio) {
      setActiveTab('audio')
    } else if (hasVideo) {
      setActiveTab('video')
    } else if (hasAudio) {
      setActiveTab('audio')
    }
  }, [sermon, initialMode, hasVideo, hasAudio])

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!sermon) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-modal-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-white overflow-hidden z-10 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                ECCF Media Player
              </span>
            </div>

            {/* Mode Switcher if both video and audio are available */}
            {hasVideo && hasAudio && (
              <div className="flex items-center rounded-full bg-slate-800/90 p-1 border border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setActiveTab('video')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    activeTab === 'video'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('audio')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    activeTab === 'audio'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Headphones className="h-3.5 w-3.5" />
                  <span>Audio</span>
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Close media player"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Player Display Container */}
          <div className="p-4 sm:p-6 bg-slate-950/60">
            {activeTab === 'video' && youtubeId ? (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800/60">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
                  title={sermon.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            ) : activeTab === 'audio' && spotifyId ? (
              <div className="w-full rounded-2xl overflow-hidden bg-[#121212] p-2 border border-slate-800 shadow-xl">
                <iframe
                  src={`https://open.spotify.com/embed/episode/${spotifyId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="232"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-xl w-full border-0"
                />
              </div>
            ) : sermon.mediaUrl ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col items-center justify-center text-center">
                <Radio className="h-12 w-12 text-[#0077cc] animate-pulse mb-3" />
                <p className="text-sm font-bold text-slate-300 mb-4">Direct Audio Stream</p>
                <audio controls className="w-full" src={sermon.mediaUrl}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center rounded-2xl bg-slate-900/60 border border-slate-800 text-center p-6">
                <p className="text-sm font-semibold text-slate-400">
                  Direct media stream is not available for this record.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Use the platform buttons below to listen on external platforms.
                </p>
              </div>
            )}
          </div>

          {/* Sermon Details & Platform Links */}
          <div className="px-5 sm:px-6 py-5 bg-slate-900 space-y-4">
            <div>
              {sermon.series && (
                <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#0077cc] bg-[#0077cc]/10 px-2.5 py-1 rounded-full mb-2">
                  {sermon.series}
                </span>
              )}
              <h2 id="player-modal-title" className="text-lg sm:text-xl font-black text-white leading-snug">
                {sermon.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400 font-medium">
                <span className="text-slate-200 font-bold">{sermon.preacher}</span>
                {sermon.datePreached && (
                  <>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-[#0077cc]" />
                      {sermon.datePreached}
                    </span>
                  </>
                )}
                {sermon.scriptureReference && (
                  <>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-emerald-400" />
                      {sermon.scriptureReference}
                    </span>
                  </>
                )}
                {sermon.duration && (
                  <>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-400" />
                      {sermon.duration}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* External Platform Links */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-semibold">
                Available on your favorite apps:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {sermon.spotifyUrl && (
                  <a
                    href={sermon.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all"
                  >
                    <SpotifyIcon className="h-3.5 w-3.5" />
                    <span>Spotify</span>
                    <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
                  </a>
                )}

                {sermon.youtubeMusicUrl && (
                  <a
                    href={sermon.youtubeMusicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-rose-600/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-xs font-bold transition-all"
                  >
                    <YouTubeMusicIcon className="h-3.5 w-3.5" />
                    <span>YouTube Music</span>
                    <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
                  </a>
                )}

                {sermon.youtubeUrl && (
                  <a
                    href={sermon.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-bold transition-all"
                  >
                    <YouTubeIcon className="h-3.5 w-3.5" />
                    <span>YouTube</span>
                    <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
