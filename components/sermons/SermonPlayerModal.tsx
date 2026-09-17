/**
 * SermonPlayerModal — Client Component
 *
 * Ultra-simple, focused lightbox popup matching the user's reference design.
 * Features:
 * - Signature ECCF brand colour overlay (rich royal blue wash with soft backdrop blur).
 * - Focused 16:9 video frame with zero visual clutter.
 * - Bold, crisp 'X' close button placed at the top-left corner of the video.
 * - Click-outside and Escape key dismissal.
 * - Seamless support for Spotify audio embed when audio mode is selected.
 */

'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Headphones, Video } from 'lucide-react'

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

  // Dismiss on ESC key
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-popup-title"
      >
        {/* Brand Colour Overlay Backdrop — ECCF Royal Blue with soft blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0077cc]/85 backdrop-blur-sm cursor-pointer"
        />

        {/* Floating Lightbox Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl z-10 mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button — styled & positioned at the top-left like reference image */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close player"
            className="absolute -top-10 left-1 sm:-top-12 sm:left-0 text-white/90 hover:text-white hover:scale-110 transition-all p-1 cursor-pointer focus:outline-none flex items-center gap-1.5"
          >
            <X className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2.5]" />
          </button>

          {/* Optional Mode Switcher if both video and audio exist */}
          {hasVideo && hasAudio && (
            <div className="absolute -top-10 right-1 sm:-top-12 sm:right-0 flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/20">
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  activeTab === 'video'
                    ? 'bg-white text-[#0077cc] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Video className="h-3 w-3" />
                <span>Video</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  activeTab === 'audio'
                    ? 'bg-white text-[#0077cc] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Headphones className="h-3 w-3" />
                <span>Audio</span>
              </button>
            </div>
          )}

          {/* Player Display */}
          {activeTab === 'video' && youtubeId ? (
            <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
                title={sermon.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : activeTab === 'audio' && spotifyId ? (
            <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden bg-[#121212] p-2 border border-white/20 shadow-2xl">
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
            <div className="w-full max-w-xl mx-auto rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 p-6 text-center text-white shadow-2xl">
              <p className="text-sm font-bold mb-3">{sermon.title}</p>
              <audio controls className="w-full" src={sermon.mediaUrl}>
                Your browser does not support audio playback.
              </audio>
            </div>
          ) : null}

          {/* Clean, subtle caption below video */}
          <div className="mt-3 text-center">
            <h2 id="video-popup-title" className="text-sm sm:text-base font-bold text-white drop-shadow-md">
              {sermon.title}
              {sermon.preacher && (
                <span className="font-normal text-white/80"> — {sermon.preacher}</span>
              )}
            </h2>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
