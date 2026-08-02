/**
 * Online Giving Page — /give
 *
 * Dedicated global giving portal supporting Tithes, Offerings, Project Levies,
 * and Welfare Fund contributions with Flutterwave SSL security.
 */

'use client'

import GivingHubSection from '@/components/home/GivingHubSection'
import { Heart } from 'lucide-react'

export default function GivePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top Banner */}
      <div className="bg-white py-12 sm:py-16 border-b border-slate-200/60">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00a8ff] flex items-center justify-center gap-1.5 mb-1">
            <Heart className="h-3.5 w-3.5 text-[#00a8ff] fill-[#00a8ff]" />
            <span>ECCF ONLINE GIVING PORTAL</span>
          </span>
          <h1 className="text-3xl font-black text-slate-900 sm:text-5xl mt-2">
            Giving & Kingdom Partnership
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            &ldquo;Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.&rdquo; &bull; 2 Corinthians 9:7
          </p>
        </div>
      </div>

      {/* Conversion Banner Component */}
      <GivingHubSection />
    </div>
  )
}
