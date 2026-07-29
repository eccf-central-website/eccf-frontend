/**
 * LiveAudioPlayer — Interactive Floating Audio & Live Stream Player
 *
 * Appears dynamically when tuning into ECCF Radio or playing a sermon message.
 * Includes SVG icons from lucide-react, animated EQ bars, play/pause controls, and volume controls.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Play, Pause, X } from 'lucide-react'

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
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl p-4 shadow-2xl shadow-sky-950/20"
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left: Animated Soundwave EQ & Track Info */}
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00a8ff] text-white font-bold shadow-md shadow-sky-500/25">
                <Radio className="h-5 w-5 text-white" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{title}</h4>
                  {isPlaying && (
                    <div className="flex items-end gap-0.5 h-3">
                      {[0.4, 0.8, 0.5, 0.9].map((height, i) => (
                        <motion.span
                          key={i}
                          animate={{ height: ['20%', '100%', '30%'] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6 + i * 0.1,
                            ease: 'easeInOut',
                          }}
                          className="w-0.5 bg-[#00a8ff] rounded-full inline-block"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{subtitle}</p>
              </div>
            </div>

            {/* Right: Controls & Close */}
            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onTogglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a8ff] text-white shadow-md hover:bg-[#0092e0] transition-colors"
              >
                {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
              </motion.button>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
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
