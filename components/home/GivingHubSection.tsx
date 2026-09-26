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

      <div className="relative z-10 w-full px-6 sm:px-8 lg:px-12">
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

            <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] leading-tight text-white tracking-tight">
              Partner With Us. <br />
              <span className="text-[#0095ff]">Empower Believers.</span>
            </h2>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal max-w-xl">
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

          {/* Right Column: Interactive Conversion Card */}
          <div className="md:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55 }}
              className="rounded-[28px] border border-slate-800 bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-10 lg:p-12 shadow-2xl shadow-slate-950 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-white">Direct Bank Transfer</h3>
                <span className="text-xs sm:text-sm font-bold text-sky-400 bg-sky-950/60 border border-sky-800/50 rounded-full px-3 py-1">Online &amp; App Transfer</span>
              </div>

              <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5">
                <p className="text-sm sm:text-base text-sky-200 leading-relaxed font-normal">
                  We are currently processing all giving via direct bank transfers. Please ensure you indicate the purpose of your transfer in the transaction narration (e.g., &quot;Tithe&quot;, &quot;Offering&quot;, &quot;Building Project&quot;).
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Bank Name</p>
                    <p className="font-serif font-bold text-xl text-white">Access Bank</p>
                  </div>
                </div>
                
                <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800/80 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Account Name</p>
                    <p className="font-serif font-bold text-xl text-white">ECCF Iyamho</p>
                  </div>
                </div>

                <div className="bg-[#0095ff]/10 p-5 rounded-2xl border border-[#0095ff]/30 flex justify-between items-center group">
                  <div>
                    <p className="text-xs text-sky-400 uppercase tracking-wider mb-1 font-bold">Account Number</p>
                    <p className="font-mono font-bold text-2xl sm:text-3xl tracking-widest text-[#0095ff]">{accountNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-full bg-[#0095ff] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-sky-400 transition-all shadow-md active:scale-95"
                    title="Copy Account Number"
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="h-4 w-4" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="text-center pt-2">
                <p className="text-xs sm:text-sm text-slate-400 font-medium italic">
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
