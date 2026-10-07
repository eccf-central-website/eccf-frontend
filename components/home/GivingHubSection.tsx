/**
 * GivingHubSection — Global Giving & Kingdom Partnership Banner
 *
 * Implements Section 2.6 of SDD and CLAUDE.md guidelines.
 * Categories: Offering, Tithe, Building Project, Smile Project, Welfare.
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ShieldCheck, Copy, CheckCheck } from 'lucide-react'

export default function GivingHubSection() {
  const [copied, setCopied] = useState(false)
  const accountNumber = '0123456789'

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(accountNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <section
      id="giving"
      className="relative w-full min-h-[calc(100vh-4.5rem)] flex items-center justify-center overflow-hidden bg-slate-950 text-white py-16 sm:py-24 border-y border-slate-800 scroll-mt-16 sm:scroll-mt-20"
    >
      {/* Ambient Radial Lighting */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 h-[500px] w-[500px] rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 lg:gap-16 items-center">
          
          {/* Left Column: Mission Statement with Slide Entrance */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
            className="md:col-span-6 space-y-6 sm:space-y-8 text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/20 backdrop-blur-md px-4 py-1.5 text-xs sm:text-sm font-bold text-sky-300 border border-sky-400/30">
              <span>KINGDOM PARTNERSHIP</span>
            </div>

            <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] leading-tight text-white tracking-tight break-words">
              Partner With Us. <br />
              <span className="text-[#0095ff]">Empower Believers.</span>
            </h2>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal max-w-xl mx-auto md:mx-0">
              Your seed directly powers campus evangelism outreaches, student welfare assistance, sermon media production, and fellowship building projects across Edo State University.
            </p>

            <div className="space-y-3 sm:space-y-3.5 pt-2 text-left max-w-md mx-auto md:mx-0">
              {[
                'Tithes & Weekly Offerings',
                'Fellowship Building Projects',
                'Smile Project & Community Outreaches',
                'Student Welfare & Relief Assistance',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3.5 text-sm sm:text-base font-semibold text-slate-100">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0095ff] text-white shadow-sm shadow-sky-500/30">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center justify-center md:justify-start gap-2.5 text-xs sm:text-sm font-medium text-slate-400 border-t border-slate-800/80">
              <ShieldCheck className="h-5 w-5 text-sky-400 shrink-0" />
              <span>Direct Bank Transfers Accepted</span>
            </div>
          </motion.div>

          {/* Right Column: Clean, Premium Bank Details Card (No Box Clutter) */}
          <div className="md:col-span-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55 }}
              className="rounded-[28px] border border-slate-800/80 bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 shadow-2xl shadow-slate-950/60 flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-sky-400 font-mono block">
                    Official Fellowship Account
                  </span>
                  <h3 className="font-serif font-bold text-xl sm:text-2xl text-white mt-1">
                    Direct Bank Transfer
                  </h3>
                </div>
                <div className="hidden xs:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Clean Details List — Single Unified Card with Dividers (Zero Nested Boxes) */}
              <div className="py-5 space-y-3.5">
                <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                  <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Bank
                  </span>
                  <span className="font-serif font-bold text-lg sm:text-xl text-white">
                    Access Bank
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                  <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Account Name
                  </span>
                  <span className="font-serif font-bold text-lg sm:text-xl text-white">
                    ECCF Iyamho
                  </span>
                </div>

                {/* Hero Account Number & Copy Action */}
                <div className="pt-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Account Number
                  </span>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="font-mono font-bold text-2xl sm:text-3xl text-sky-400 tracking-wider sm:tracking-widest select-all break-all">
                      {accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#0095ff] hover:bg-[#0080e0] text-white font-bold px-6 py-2.5 text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0"
                      title="Copy Account Number"
                    >
                      {copied ? (
                        <>
                          <CheckCheck className="h-4 w-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy Number</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Helpful Purpose Guidance */}
              <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
                <p>
                  Please specify your giving category in the transfer narration (e.g.{' '}
                  <span className="text-slate-200 font-medium">Tithe</span>,{' '}
                  <span className="text-slate-200 font-medium">Offering</span>,{' '}
                  <span className="text-slate-200 font-medium">Building</span>, or{' '}
                  <span className="text-slate-200 font-medium">Welfare</span>).
                </p>
                <p className="mt-2 text-slate-500 italic text-[11px] text-center">
                  Thank you for your generous support of God&apos;s work on campus.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
