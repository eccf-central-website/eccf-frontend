'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, CheckCheck, HeartHandshake } from 'lucide-react'
import type { SiteSettingsData } from './HeroSection'

interface Props {
  settings?: Pick<SiteSettingsData, 'givingBankName' | 'givingAccountName' | 'givingAccountNumber' | 'givingInstructions' | 'fellowshipEmail'> | null
}

export default function GivingHubSection({ settings }: Props) {
  const [copied, setCopied] = useState(false)
  const bankName = settings?.givingBankName?.trim() || ''
  const accountName = settings?.givingAccountName?.trim() || ''
  const accountNumber = settings?.givingAccountNumber?.replace(/\D/g, '') || ''
  const hasAccountDetails = Boolean(bankName && accountName && /^\d{10}$/.test(accountNumber))

  const handleCopy = async () => {
    if (!hasAccountDetails || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(accountNumber)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      id="giving"
      className="relative w-full flex items-center justify-center overflow-hidden bg-slate-950 text-white py-12 sm:py-20 md:min-h-[calc(100vh-4.5rem)] md:py-24 border-y border-slate-800 scroll-mt-16 sm:scroll-mt-20"
    >
      <div className="absolute top-0 right-0 -mr-32 -mt-32 h-[500px] w-[500px] rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full px-5 sm:px-10 md:px-14 lg:px-14 xl:px-20 2xl:px-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-6 space-y-3.5 sm:space-y-6 lg:space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/20 backdrop-blur-md px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-sm font-bold text-sky-300 border border-sky-400/30">
              <HeartHandshake className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" />
              <span>KINGDOM PARTNERSHIP</span>
            </div>

            <h2 className="font-serif font-bold text-[26px] sm:text-4xl lg:text-5xl xl:text-[3.25rem] leading-[1.12] sm:leading-tight text-white tracking-tight break-words">
              Partner With Us. <br />
              <span className="text-[#0095ff]">Empower Believers.</span>
            </h2>

            <p className="text-[14px] sm:text-lg leading-relaxed font-normal max-w-xl mx-auto lg:mx-0">
              Your giving supports campus outreach, student welfare, sermon media, and fellowship projects across Edo State University.
            </p>

            <div className="grid gap-2 sm:gap-3.5 pt-0.5 sm:pt-2 text-left max-w-md mx-auto lg:mx-0">
              {[
                'Tithes & weekly offerings',
                'Fellowship building projects',
                'Smile Project & community outreach',
                'Student welfare & relief assistance',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 sm:gap-3.5 text-[13.5px] sm:text-base font-semibold text-slate-100">
                  <span className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-[#0095ff] text-white shadow-sm shadow-sky-500/30">
                    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 stroke-[3]" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="hidden sm:flex pt-4 items-center justify-center lg:justify-start gap-2.5 text-xs sm:text-sm font-medium text-slate-400 border-t border-slate-800/80">
              <span>Bank transfer details are managed by the fellowship.</span>
            </div>
          </motion.div>

          <div className="lg:col-span-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55 }}
              className="rounded-2xl sm:rounded-[28px] border border-slate-800/80 bg-slate-900/90 backdrop-blur-2xl p-4 sm:p-8 lg:p-10 shadow-2xl shadow-slate-950/60"
            >
              <div className="pb-3 sm:pb-5 border-b border-slate-800/80">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-sky-400 font-mono block">
                  Fellowship Giving
                </span>
                <h3 className="font-serif font-bold text-lg sm:text-2xl text-white mt-0.5 sm:mt-1">
                  Direct Bank Transfer
                </h3>
              </div>

              {hasAccountDetails ? (
                <>
                  <dl className="py-2 sm:py-5 space-y-1 sm:space-y-3.5">
                    <div className="flex items-center justify-between gap-2 sm:gap-3 py-1.5 sm:py-2 border-b border-slate-800/60">
                      <dt className="shrink-0 whitespace-nowrap text-[10px] sm:text-sm font-semibold uppercase tracking-wide sm:tracking-wider text-slate-400">Bank</dt>
                      <dd className="min-w-0 break-words font-serif font-bold text-[13px] sm:text-lg text-white text-right">{bankName}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:gap-3 py-1.5 sm:py-2 border-b border-slate-800/60">
                      <dt className="shrink-0 whitespace-nowrap text-[10px] sm:text-sm font-semibold uppercase tracking-wide sm:tracking-wider text-slate-400">Account Name</dt>
                      <dd className="min-w-0 break-words font-serif font-bold text-[13px] sm:text-lg text-white text-right">{accountName}</dd>
                    </div>
                    <div className="pt-1.5 sm:pt-2">
                      <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5 sm:mb-2 text-left">
                        Account Number
                      </dt>
                      <dd className="rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/10 p-2.5 sm:p-5 lg:p-4 xl:p-5 flex items-center justify-between gap-2.5 sm:gap-4">
                        <span className="min-w-0 font-mono font-bold text-xl sm:text-2xl xl:text-3xl text-sky-400 tracking-[0.06em] sm:tracking-wider xl:tracking-widest select-all">
                          {accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="shrink-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-[#0095ff] hover:bg-[#0080e0] text-white font-bold px-3 py-2 sm:px-6 lg:px-4 xl:px-6 text-[10px] sm:text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 min-h-10 sm:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                          aria-label={copied ? 'Account number copied' : 'Copy account number'}
                        >
                          {copied ? <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" />}
                          <span className="whitespace-nowrap">{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </dd>
                    </div>
                  </dl>
                  <div className="pt-2.5 sm:pt-3 border-t border-slate-800/80 text-[11.5px] sm:text-xs text-slate-400 leading-relaxed">
                    <p>{settings?.givingInstructions?.trim() || 'Please include your giving category in the transfer narration, such as Tithe, Offering, Building, or Welfare.'}</p>
                    <p className="mt-1.5 sm:mt-2 text-slate-500 italic text-[10.5px] sm:text-[11px] text-center">Thank you for supporting the fellowship.</p>
                  </div>
                </>
              ) : (
                <div className="py-4 sm:py-6 space-y-3 sm:space-y-4">
                  <p className="text-[13px] sm:text-sm leading-relaxed text-slate-300">
                    Bank details are being updated. Please contact the fellowship to confirm the current account before making a transfer.
                  </p>
                  {settings?.fellowshipEmail && (
                    <a
                      href={`mailto:${encodeURIComponent(settings.fellowshipEmail)}?subject=${encodeURIComponent('ECCF giving details')}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-sky-400/40 px-5 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                    >
                      Contact the fellowship
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
