/**
 * LiveAudioPlayer — Interactive Floating Live Audio Player Component
 *
 * Provides smooth Framer Motion spring entry/exit, Play/Pause toggle,
 * volume indicators, and clean Lucide SVG controls.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Radio, X } from 'lucide-react'

interface LiveAudioPlayerProps {
  isOpen: boolean
  title: string
  subtitle: string
  onClose: () => void
  isPlaying: boolean
  onTogglePlay: () => void
}

export default function LiveAudioPlayer({
  isOpen,
  title,
  subtitle,
  onClose,
  isPlaying,
  onTogglePlay,
}: LiveAudioPlayerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-2xl shadow-slate-900/15 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00a8ff] text-white shadow-md shadow-sky-500/20">
                <Radio className="h-6 w-6 animate-pulse text-white" />
              </div>
              <div className="overflow-hidden">
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#00a8ff] border border-sky-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00a8ff] animate-ping" />
                  LIVE AUDIO
                </span>
                <h4 className="truncate text-sm font-extrabold text-slate-900 mt-0.5">
                  {title}
                </h4>
                <p className="truncate text-xs text-slate-500 font-medium">
                  {subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onTogglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a8ff] text-white shadow-md shadow-sky-500/20"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 fill-white" />
                ) : (
                  <Play className="h-4 w-4 fill-white ml-0.5" />
                )}
              </motion.button>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
