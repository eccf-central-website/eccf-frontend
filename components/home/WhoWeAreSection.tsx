/**
 * WhoWeAreSection — Editorial Chapter Spread
 *
 * A magazine-style introduction to the fellowship:
 * - Chapter marker (01 / Who We Are) with an accent rule
 * - Oversized statement, the second clause carrying brand blue
 * - The three core pillars of ECCF (Romans 12:11):
 *     01. Diligence (Not slothful in business — Rom. 12:11a)
 *     02. Fervency (Fervent in spirit — Rom. 12:11b)
 *     03. Christ-Centred Service (Serving the Lord — Rom. 12:11c)
 *   Presented as crisp, legible one-liners in a numbered ledger
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
import { ArrowRight } from 'lucide-react'

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

const ONE_LINE_PILLARS: PillarItem[] = [
  {
    num: '01',
    title: 'Diligence',
    subtitle: 'Not Slothful in Business',
    desc: 'Honouring God with academic excellence, study discipline, and refusing sloth in our work.',
  },
  {
    num: '02',
    title: 'Fervency',
    subtitle: 'Fervent in Spirit',
    desc: 'A boiling personal altar of prayer, deep fellowship in the Word, and practical holiness.',
  },
  {
    num: '03',
    title: 'Christ-Centred Service',
    subtitle: 'Serving the Lord',
    desc: 'Serving the fellowship, campus, and hostel communities with humble, Christ-like love.',
  },
]

const EASE = [0.16, 1, 0.3, 1] as const

function resolvePillars(aboutPillars?: AboutPillarsData | null): PillarItem[] {
  if (!aboutPillars) return ONE_LINE_PILLARS

  const p1Title = aboutPillars.pillar1Title?.trim()
  const p2Title = aboutPillars.pillar2Title?.trim()
  const p3Title = aboutPillars.pillar3Title?.trim()

  return [
    {
      num: '01',
      title: (p1Title === 'Dilligence' ? 'Diligence' : p1Title) || ONE_LINE_PILLARS[0].title,
      subtitle: aboutPillars.pillar1Subtitle?.trim() || ONE_LINE_PILLARS[0].subtitle,
      desc: ONE_LINE_PILLARS[0].desc,
    },
    {
      num: '02',
      title: p2Title || ONE_LINE_PILLARS[1].title,
      subtitle: aboutPillars.pillar2Subtitle?.trim() || ONE_LINE_PILLARS[1].subtitle,
      desc: ONE_LINE_PILLARS[1].desc,
    },
    {
      num: '03',
      title: p3Title || ONE_LINE_PILLARS[2].title,
      subtitle: aboutPillars.pillar3Subtitle?.trim() || ONE_LINE_PILLARS[2].subtitle,
      desc: ONE_LINE_PILLARS[2].desc,
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
            >
              <span className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#0077cc]">
                Who We Are
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
              className="mt-4 text-balance font-serif text-[1.95rem] leading-[1.12] tracking-tight text-slate-950 sm:mt-5 sm:text-[2.6rem] lg:text-[3.15rem]"
            >
              Raised for Kingdom Impact{' '}
              <span className="text-[#0077cc]">&amp; Academic Distinction.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
              className="mt-4 max-w-[34rem] text-[15px] leading-[1.7] text-slate-600 sm:mt-5 sm:text-base lg:text-[16.5px]"
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
                  <div className="flex items-baseline gap-4 py-4 sm:gap-6 sm:py-5">
                    <span className="shrink-0 font-mono text-xs font-bold tracking-[0.2em] text-[#0095ff] sm:text-sm">
                      {pillar.num}
                    </span>
                    <div className="min-w-0 flex-1 transition-transform duration-500 ease-out group-hover:translate-x-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h3 className="font-serif text-[19px] font-bold leading-snug text-slate-950 transition-colors duration-300 group-hover:text-[#0077cc] sm:text-[22px]">
                          {pillar.title}
                        </h3>
                        {pillar.subtitle && (
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0077cc] ring-1 ring-[#0077cc]/20 sm:text-[10.5px]">
                            {pillar.subtitle}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 max-w-[34rem] text-[14.5px] leading-relaxed text-slate-600 sm:text-[15.5px]">
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
                className="group inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.22em] text-[#0077cc] transition-colors hover:text-sky-800 sm:text-[13px]"
              >
                <span className="relative">
                  Explore Our Pillars &amp; Mandate
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-px w-0 bg-[#0077cc] transition-[width] duration-300 ease-out group-hover:w-full"
                  />
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          </div>

          {/* ================================================================ */}
          {/* RIGHT — Layered photography                                      */}
          {/* ================================================================ */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto w-full max-w-[520px] lg:ml-auto">
              {/* Photo Stage (Isolated relative boundary) */}
              <div className="relative pb-4 sm:pb-6">
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
                  </div>
                </motion.figure>

                {/* Inset "photo print" */}
                <motion.figure
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
                  className="group absolute -bottom-2 -left-2 w-[46%] max-w-[210px] sm:-bottom-4 sm:-left-4 sm:max-w-[240px]"
                >
                  <div className="overflow-hidden rounded-[14px] border-[4px] border-white bg-white shadow-[0_20px_44px_-16px_rgba(15,23,42,0.4)] ring-1 ring-stone-900/10 sm:rounded-[18px] sm:border-[5px]">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-stone-200 sm:rounded-[13px]">
                      <Image
                        src={p2}
                        alt="Students listening during a fellowship gathering"
                        fill
                        sizes="(max-width: 1024px) 50vw, 240px"
                        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                      />
                    </div>
                  </div>
                </motion.figure>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
