/**
 * WhoWeAreSection — Editorial Chapter Spread
 *
 * A magazine-style introduction to the fellowship:
 * - Chapter marker (01 / Who We Are) with an accent rule
 * - Oversized Belleza statement, the second clause carrying brand blue
 * - The three core pillars of ECCF (Romans 12:11):
 *     01. Diligence (Not slothful in business — Rom. 12:11a)
 *     02. Fervency (Fervent in spirit — Rom. 12:11b)
 *     03. Christ-Centred Service (Serving the Lord — Rom. 12:11c)
 *   Set as a numbered ledger — hairline rules, no cards;
 *   each row smoothly highlights and draws an accent rule on hover
 * - Layered photography: a tall portrait with an overlapping photo-print inset,
 *   an offset hairline accent frame, a glass caption chip and an integrated mono caption plate
 * - Clean responsive architecture ensuring zero overlap bugs on mobile & desktop
 *
 * Palette and type: Slate/stone neutrals, #0077cc / #0095ff accents,
 * Belleza headings, Work Sans body, Geist Mono annotations.
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

export interface PillarItem {
  num: string
  title: string
  subtitle?: string
  desc: string
}

export interface AboutPillarsData {
  pillar1Title?: string
  pillar1Subtitle?: string
  pillar1Desc?: string
  pillar2Title?: string
  pillar2Subtitle?: string
  pillar2Desc?: string
  pillar3Title?: string
  pillar3Subtitle?: string
  pillar3Desc?: string
}

interface Props {
  photo1?: string | null
  photo2?: string | null
  aboutPillars?: AboutPillarsData | null
}

const DEFAULT_PILLARS: PillarItem[] = [
  {
    num: '01',
    title: 'Diligence',
    subtitle: 'Not Slothful in Business',
    desc: 'The first clause settles our attitude to work. Refusing laziness in lectures and revision, honouring God with our minds, and stewarding our academic years with excellence.',
  },
  {
    num: '02',
    title: 'Fervency',
    subtitle: 'Fervent in Spirit',
    desc: 'Zeal without fire burns out. We keep our personal altar boiling — cultivated in secret prayer, fed by the Word, and walking in apostolic power and practical holiness.',
  },
  {
    num: '03',
    title: 'Christ-Centred Service',
    subtitle: 'Serving the Lord',
    desc: 'Everything answers to Him. Our studies, gifts, and time are placed in the service of the Lord — serving the fellowship, hostel communities, and campus with humility and love.',
  },
]

const EASE = [0.16, 1, 0.3, 1] as const

function resolvePillars(aboutPillars?: AboutPillarsData | null): PillarItem[] {
  if (!aboutPillars) return DEFAULT_PILLARS

  const p1Title = aboutPillars.pillar1Title?.trim()
  const p2Title = aboutPillars.pillar2Title?.trim()
  const p3Title = aboutPillars.pillar3Title?.trim()

  return [
    {
      num: '01',
      title: (p1Title === 'Dilligence' ? 'Diligence' : p1Title) || DEFAULT_PILLARS[0].title,
      subtitle: aboutPillars.pillar1Subtitle?.trim() || DEFAULT_PILLARS[0].subtitle,
      desc: aboutPillars.pillar1Desc?.trim() || DEFAULT_PILLARS[0].desc,
    },
    {
      num: '02',
      title: p2Title || DEFAULT_PILLARS[1].title,
      subtitle: aboutPillars.pillar2Subtitle?.trim() || DEFAULT_PILLARS[1].subtitle,
      desc: aboutPillars.pillar2Desc?.trim() || DEFAULT_PILLARS[1].desc,
    },
    {
      num: '03',
      title: p3Title || DEFAULT_PILLARS[2].title,
      subtitle: aboutPillars.pillar3Subtitle?.trim() || DEFAULT_PILLARS[2].subtitle,
      desc: aboutPillars.pillar3Desc?.trim() || DEFAULT_PILLARS[2].desc,
    },
  ]
}

export default function WhoWeAreSection({ photo1, photo2, aboutPillars }: Props) {
  const p1 = photo1 || '/gallery/gallery-1.jpg'
  const p2 = photo2 || '/gallery/gallery-2.jpg'
  const pillars = resolvePillars(aboutPillars)

  return (
    <section
      id="about"
      className="relative w-full scroll-mt-20 overflow-hidden border-b border-stone-200 bg-[#fcfbf9] py-12 sm:py-16 lg:py-24"
    >
      {/* Atmosphere — subtle ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-8 h-[520px] w-[520px] rounded-full bg-[#0095ff]/[0.05] blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stone-300/80 to-transparent"
      />

      <div className="relative w-full px-6 sm:px-10 md:px-14 lg:px-14 xl:px-20 2xl:px-28">
        <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:items-center lg:gap-x-12 xl:gap-x-20">

          {/* ================================================================ */}
          {/* LEFT — Chapter statement + mandate ledger                         */}
          {/* ================================================================ */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="flex items-center gap-3 sm:gap-4"
            >
              <span className="font-mono text-[10px] font-bold tracking-[0.22em] text-[#0077cc] sm:text-[11px]">
                01
              </span>
              <span aria-hidden="true" className="h-px w-8 bg-[#0077cc]/45 sm:w-10" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 sm:text-[11px]">
                Who We Are
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
              className="mt-4 text-balance font-serif text-[1.85rem] leading-[1.12] tracking-tight text-slate-950 sm:mt-5 sm:text-[2.6rem] lg:text-[3.15rem]"
            >
              Raised for Kingdom Impact{' '}
              <span className="text-[#0077cc]">&amp; Academic Distinction.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
              className="mt-4 max-w-[34rem] text-[14.5px] leading-[1.7] text-slate-600 sm:mt-5 sm:text-base lg:text-[16.5px]"
            >
              ECCF exists to eliminate the false divide between spiritual fervency and
              academic excellence, empowering university students to walk in the fullness
              of the Holy Spirit while graduating at the top of their faculties.
            </motion.p>

            {/* Mandate ledger */}
            <div className="mt-8 border-t border-stone-300/80 sm:mt-9">
              {pillars.map((pillar, idx) => (
                <motion.div
                  key={pillar.num}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: 0.05 * idx, ease: EASE }}
                  className="group relative border-b border-stone-300/80"
                >
                  <div className="flex items-baseline gap-3.5 py-4 sm:gap-5 sm:py-5">
                    <span className="shrink-0 font-mono text-[10px] font-bold tracking-[0.2em] text-[#0095ff] sm:text-[11px]">
                      {pillar.num}
                    </span>
                    <div className="min-w-0 flex-1 transition-transform duration-500 ease-out group-hover:translate-x-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="font-serif text-[18px] leading-snug text-slate-950 transition-colors duration-300 group-hover:text-[#0077cc] sm:text-[21px]">
                          {pillar.title}
                        </h3>
                        {pillar.subtitle && (
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#0077cc] ring-1 ring-[#0077cc]/15 sm:text-[9.5px]">
                            {pillar.subtitle}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 max-w-[32rem] text-[12.5px] leading-relaxed text-slate-600 sm:text-[13.5px]">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                  {/* Accent rule draws in on hover */}
                  <span
                    aria-hidden="true"
                    className="absolute bottom-[-1px] left-0 h-px w-0 bg-[#0077cc]/70 transition-[width] duration-500 ease-out group-hover:w-full"
                  />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
              className="mt-7 flex flex-wrap items-center gap-4 sm:mt-8"
            >
              <Link
                href="/about#pillars"
                className="group inline-flex items-center gap-3 text-slate-900 transition-colors hover:text-[#0077cc]"
              >
                <span className="relative font-mono text-[10px] font-bold uppercase tracking-[0.22em] sm:text-[11px]">
                  Explore Our Pillars &amp; Mandate
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1.5 left-0 h-px w-0 bg-[#0077cc] transition-[width] duration-500 ease-out group-hover:w-full"
                  />
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#0077cc]/25 text-[#0077cc] transition-all duration-300 group-hover:border-[#0077cc] group-hover:bg-[#0077cc] group-hover:text-white sm:h-9 sm:w-9">
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            </motion.div>
          </div>

          {/* ================================================================ */}
          {/* RIGHT — Layered photography                                      */}
          {/* ================================================================ */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto w-full max-w-[520px] lg:ml-auto">
              {/* Photo Stage (Isolated relative boundary) */}
              <div className="relative pb-8 sm:pb-10">
                {/* Offset hairline frame */}
                <motion.span
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.9, delay: 0.25 }}
                  className="pointer-events-none absolute -inset-2.5 rounded-[28px] border border-[#0077cc]/15 sm:-inset-3.5 sm:rounded-[32px]"
                />

                {/* Main portrait */}
                <motion.figure
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.85, ease: EASE }}
                  className="group relative"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-stone-200 shadow-[0_32px_64px_-36px_rgba(15,23,42,0.45)] ring-1 ring-stone-900/5 sm:rounded-[26px]">
                    <Image
                      src={p1}
                      alt="Word ministration at Edo State University Christian Campus Fellowship"
                      fill
                      sizes="(max-width: 1024px) 100vw, 520px"
                      className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    />

                    {/* Subtle gloss sweep */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.32)_0%,rgba(255,255,255,0.08)_26%,rgba(255,255,255,0)_54%)] opacity-60 mix-blend-soft-light"
                    />
                    {/* Base blend for the caption chip */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/35 to-transparent"
                    />

                    <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/35 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white ring-1 ring-white/25 backdrop-blur-md sm:left-5 sm:top-5 sm:text-[10px]">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                      The Word
                    </span>
                  </div>
                </motion.figure>

                {/* Inset "photo print" with integrated caption card */}
                <motion.figure
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
                  className="group absolute -bottom-3 -left-3 w-[48%] max-w-[220px] sm:-bottom-5 sm:-left-5 sm:max-w-[250px]"
                >
                  <div className="overflow-hidden rounded-[16px] border-[4px] border-white bg-white shadow-[0_20px_44px_-16px_rgba(15,23,42,0.4)] ring-1 ring-stone-900/10 sm:rounded-[18px] sm:border-[5px]">
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
                      <Image
                        src={p2}
                        alt="Students listening during a fellowship gathering"
                        fill
                        sizes="(max-width: 1024px) 50vw, 250px"
                        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                      />
                    </div>
                    <div className="bg-white px-2.5 py-1.5 text-center sm:px-3 sm:py-2">
                      <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-slate-700 sm:text-[9px]">
                        Fellowship Gathering
                      </span>
                    </div>
                  </div>
                </motion.figure>
              </div>

              {/* Caption plate — clean clearance below photo stage */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex items-center justify-between gap-4 border-t border-stone-300/70 pt-3.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-slate-500 sm:pt-4 sm:text-[9.5px]"
              >
                <span className="font-semibold text-[#0077cc]">The Word &amp; The Gathering</span>
                <span aria-hidden="true" className="hidden h-px flex-1 bg-stone-300/60 sm:block" />
                <span className="text-slate-400">ECCF · Edo State University</span>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
