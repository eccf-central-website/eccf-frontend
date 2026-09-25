/**
 * GivingHubSection — Global Giving & Kingdom Partnership Banner
 *
 * Implements Section 2.6 of SDD and CLAUDE.md guidelines.
 * Categories: Offering, Tithe, Building Project, Smile Project, Welfare.
 */

'use client'

import { motion } from 'framer-motion'
import { Check, ShieldCheck } from 'lucide-react'

export default function GivingHubSection() {
  return (
    <section
      id="giving"
      className="relative w-full min-h-[calc(100vh-4.5rem)] flex items-center justify-center overflow-hidden bg-slate-950 text-white py-12 sm:py-20 border-y border-slate-800 scroll-mt-16 sm:scroll-mt-20"
    >
      {/* Ambient Radial Lighting */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 h-[500px] w-[500px] rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Mission Statement with Slide Entrance */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
            className="md:col-span-5 space-y-5 sm:space-y-6 text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/20 backdrop-blur-md px-4 py-1.5 text-xs font-black text-sky-300 border border-sky-400/30">
              <span>KINGDOM PARTNERSHIP</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-white tracking-tight">
              Partner With Us. <br />
              <span className="text-[#0095ff]">Empower Believers.</span>
            </h2>

            <p className="text-slate-300 text-xs sm:text-base leading-relaxed font-normal">
              Your seed directly powers campus evangelism outreaches, student welfare assistance, sermon media production, and fellowship building projects across Edo State University.
            </p>

            <div className="space-y-2.5 sm:space-y-3 pt-1 text-left max-w-md mx-auto md:mx-0">
              {[
                'Tithes & Weekly Offerings',
                'Fellowship Building Projects',
                'Smile Project & Community Outreaches',
                'Student Welfare & Relief Assistance',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-200">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0095ff] text-white shadow-sm shadow-sky-500/30">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 sm:pt-4 flex items-center justify-center md:justify-start gap-2 text-[11px] sm:text-xs font-medium text-slate-400 border-t border-slate-800/80">
              <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
              <span>Direct Bank Transfers Accepted</span>
            </div>
          </motion.div>

          {/* Right Column: Interactive Conversion Card with Staggered Entrance */}
          <div className="md:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55 }}
              className="rounded-3xl border border-slate-800 bg-slate-900/95 backdrop-blur-2xl p-4 sm:p-8 shadow-2xl shadow-slate-950 space-y-4 sm:space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base sm:text-xl font-black text-white">Direct Bank Transfer</h3>
                <span className="text-xs font-bold text-sky-400">Offline Mode</span>
              </div>

              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-sky-300 font-medium">
                  We are currently processing all giving via direct bank transfers. Please ensure you indicate the purpose of your transfer in the transaction narration (e.g., &quot;Tithe&quot;, &quot;Offering&quot;, &quot;Project Levy&quot;).
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex justify-between items-center group">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Bank Name</p>
                    <p className="font-semibold text-lg text-white">Access Bank</p>
                  </div>
                </div>
                
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex justify-between items-center group">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Account Name</p>
                    <p className="font-semibold text-lg text-white">ECCF Iyamho</p>
                  </div>
                </div>

                <div className="bg-[#0095ff]/10 p-4 rounded-xl border border-[#0095ff]/30 flex justify-between items-center group">
                  <div>
                    <p className="text-xs text-sky-400 uppercase tracking-wider mb-1 font-bold">Account Number</p>
                    <p className="font-black text-2xl tracking-widest text-[#0095ff]">0123456789</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center pt-4">
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium italic">
                  Thank you for your generosity. May God bless you abundantly.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
