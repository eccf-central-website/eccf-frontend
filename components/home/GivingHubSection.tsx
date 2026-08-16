/**
 * GivingHubSection — Global Giving & Kingdom Partnership Banner
 *
 * Implements Section 2.6 of SDD and CLAUDE.md guidelines.
 * Categories: Offering, Tithe, Building Project, Smile Project, Welfare.
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Lock, ArrowRight, ShieldCheck, Heart } from 'lucide-react'

const categories = ['Offering', 'Tithe', 'Building Project', 'Smile Project', 'Welfare']
const presetAmounts = [1000, 2500, 5000, 10000, 20000]

export default function GivingHubSection() {
  const [selectedCategory, setSelectedCategory] = useState('Offering')
  const [fullName, setFullName] = useState('')
  const [amount, setAmount] = useState<string | number>(5000)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGive = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      alert(`Redirecting to Flutterwave checkout for ${selectedCategory}: ₦${Number(amount).toLocaleString()}`)
      setIsSubmitting(false)
    }, 800)
  }

  return (
    <section id="giving" className="relative w-full overflow-hidden bg-slate-950 text-white py-24 border-y border-slate-800">
      {/* Ambient Radial Lighting */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 h-[500px] w-[500px] rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Mission Statement (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/20 backdrop-blur-md px-4 py-1.5 text-xs font-black text-sky-300 border border-sky-400/30">
              <Heart className="h-3.5 w-3.5 text-sky-400 fill-sky-400" />
              <span>KINGDOM PARTNERSHIP</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-white tracking-tight">
              Partner With Us. <br />
              <span className="text-[#0095ff]">Empower Believers.</span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
              Your seed directly powers campus evangelism outreaches, student welfare assistance, sermon media production, and fellowship building projects across Edo State University.
            </p>

            <div className="space-y-3 pt-2">
              {[
                'Tithes & Weekly Offerings',
                'Fellowship Building Projects',
                'Smile Project & Community Outreaches',
                'Student Welfare & Relief Assistance',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0095ff] text-white shadow-sm shadow-sky-500/30">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-2 text-xs font-medium text-slate-400 border-t border-slate-800/80">
              <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
              <span>Direct Bank & Card Payments via Flutterwave Payment Gateway</span>
            </div>
          </div>

          {/* Right Column: Interactive Conversion Card (7 cols) */}
          <div className="lg:col-span-7">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              onSubmit={handleGive}
              className="rounded-3xl border border-slate-800 bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl shadow-slate-950 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-xl font-black text-white">Online Contribution Hub</h3>
                <span className="text-xs font-bold text-sky-400">Step 1 of 2</span>
              </div>

              {/* Category Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Select Giving Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-xl py-2.5 px-2 text-xs font-bold transition-all text-center whitespace-nowrap overflow-hidden text-ellipsis ${
                          isActive
                            ? 'bg-[#0095ff] text-white shadow-md shadow-sky-500/25 font-black'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                        title={cat}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Emmanuel Okonkwo"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[#0095ff] focus:ring-1 focus:ring-[#0095ff] focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">
                    Amount (₦ NGN)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-bold text-slate-400 text-sm select-none pointer-events-none">
                      ₦
                    </span>
                    <input
                      type="number"
                      required
                      min={100}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="5000"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-3 text-sm font-bold text-white placeholder-slate-500 focus:border-[#0095ff] focus:ring-1 focus:ring-[#0095ff] focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>

              {/* Preset Selector Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">
                  Quick Amount Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {presetAmounts.map((amt) => {
                    const isSelected = Number(amount) === amt
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt)}
                        className={`rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-all ${
                          isSelected
                            ? 'border-[#0095ff] bg-sky-500/20 text-sky-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0095ff] hover:bg-[#0080e0] text-white font-black py-4 text-sm shadow-lg shadow-sky-500/30 transition-all disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Processing...' : `Proceed to Give ₦${Number(amount || 0).toLocaleString()}`}</span>
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <Lock className="h-3 w-3 text-slate-500" />
                  <span>Secured by Flutterwave Payment Gateway &bull; 256-Bit SSL</span>
                </div>
              </div>
            </motion.form>
          </div>
        </div>
      </div>
    </section>
  )
}
