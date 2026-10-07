/**
 * GivingHubSection — Global Giving & Kingdom Partnership
 *
 * Bespoke Editorial Layout:
 * - Completely eliminates box-in-box card clutter ("AI rectangles")
 * - Direct, open typographic presentation grounded on a rich midnight canvas
 * - Massive, elegant account number display with smooth one-tap copy interaction
 * - Zero nested containers, zero Russian-doll rounded rectangles
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, CheckCheck } from 'lucide-react'

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
      className="relative w-full min-h-[calc(100vh-4.5rem)] flex items-center justify-center overflow-hidden bg-slate-950 text-white py-16 sm:py-24 border-y border-slate-900 scroll-mt-16 sm:scroll-mt-20"
    >
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 md:px-12 lg:px-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* ============================================================ */}
          {/* LEFT COLUMN: Editorial Vision & Giving Purpose              */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-6 space-y-6 text-center lg:text-left"
          >
            <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#0095ff] font-mono block">
              GIVING &amp; STEWARDSHIP
            </span>

            <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] leading-[1.14] text-white tracking-tight break-words">
              Partner With Us. <br />
              <span className="text-[#0095ff]">Empower Believers.</span>
            </h2>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal max-w-xl mx-auto lg:mx-0">
              Your giving directly powers campus evangelism outreaches, student welfare assistance, weekly discipleship teachings, and fellowship building projects across Edo State University.
            </p>

            {/* Clean Editorial Bullet Stream (No circle badges, no cards) */}
            <div className="pt-2 space-y-3 text-sm sm:text-base text-slate-300 max-w-md mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0095ff] shrink-0" />
                <span>Tithes &amp; Weekly Offerings</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0095ff] shrink-0" />
                <span>Fellowship Building &amp; Infrastructure Projects</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0095ff] shrink-0" />
                <span>Smile Project &amp; Campus Evangelism</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0095ff] shrink-0" />
                <span>Student Welfare &amp; Relief Assistance</span>
              </div>
            </div>
          </motion.div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: Pure Typographic Bank Details (ZERO BOXES)     */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="lg:col-span-6 w-full lg:pl-8 text-center lg:text-left"
          >
            <div className="space-y-8">
              
              <div>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-slate-400 font-mono block mb-2">
                  OFFICIAL FELLOWSHIP ACCOUNT
                </span>
                <h3 className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
                  Direct Bank Transfer
                </h3>
              </div>

              {/* Bank & Account Name — Open Editorial Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    Bank
                  </span>
                  <p className="font-serif font-bold text-xl sm:text-2xl text-white mt-1">
                    Access Bank
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    Account Name
                  </span>
                  <p className="font-serif font-bold text-xl sm:text-2xl text-white mt-1">
                    ECCF Iyamho
                  </p>
                </div>
              </div>

              {/* Account Number — Large, Bold, Direct, Zero Nested Rectangles */}
              <div className="pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Account Number
                </span>
                
                <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-3 sm:gap-5 justify-center lg:justify-start">
                  <span
                    onClick={handleCopy}
                    className="font-mono text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-sky-400 tracking-wider cursor-pointer hover:text-sky-300 transition-colors select-all leading-none"
                    title="Click to copy account number"
                  >
                    {accountNumber}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
                    aria-label="Copy Account Number"
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-[#0095ff]" />
                        <span className="underline decoration-slate-600 hover:decoration-white underline-offset-4">
                          Copy Number
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Purpose Guidance */}
              <div className="pt-4 border-t border-slate-800/80 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                <p>
                  Please specify your giving purpose in the transfer narration (e.g.{' '}
                  <span className="text-slate-200 font-semibold">Tithe</span>,{' '}
                  <span className="text-slate-200 font-semibold">Offering</span>,{' '}
                  <span className="text-slate-200 font-semibold">Building</span>, or{' '}
                  <span className="text-slate-200 font-semibold">Welfare</span>).
                </p>
                <p className="mt-2 text-slate-500 italic text-xs">
                  Thank you for your generous support of God&apos;s work on campus.
                </p>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
