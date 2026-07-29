/**
 * GivingHubSection — Interactive Global Giving Component
 *
 * Provides real-time category selection, dynamic amount presets,
 * SVG icons from lucide-react, and smooth Framer Motion micro-interactions.
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Lock, ArrowRight } from 'lucide-react'

const categories = ['Tithe', 'Offering', 'Project', 'Welfare']
const presetAmounts = [1000, 2500, 5000, 10000]

export default function GivingHubSection() {
  const [selectedCategory, setSelectedCategory] = useState('Tithe')
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
    <section className="py-20 border-t border-slate-200/60 bg-[#f8fafc]">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 grid grid-cols-1 md:grid-cols-2"
        >
          {/* Left Card: Sky Blue Highlight */}
          <div className="bg-[#00a8ff] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-sky-100">
                GLOBAL GIVING HUB
              </span>
              <h2 className="text-3xl font-extrabold mt-3 leading-tight">
                Support the Vision. <br />
                Fund the Future.
              </h2>
              <p className="mt-4 text-sky-50 text-sm leading-relaxed">
                Your seed powers campus outreaches, welfare funds, media production, and discipleship programmes. Every naira counts.
              </p>
            </div>

            <ul className="mt-8 space-y-2.5 text-xs font-semibold text-sky-100">
              {['Tithes & Offerings', 'Project Contributions', 'Welfare Fund', 'Media Ministry'].map((item) => (
                <motion.li
                  key={item}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-2"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                  {item}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Right Card: Interactive Form */}
          <form onSubmit={handleGive} className="p-8 sm:p-12 bg-white flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Make a Contribution</h3>

              {/* Interactive Category Tabs */}
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat
                  return (
                    <motion.button
                      key={cat}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCategory(cat)}
                      className={`relative rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#00a8ff] text-white shadow-md shadow-sky-500/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </motion.button>
                  )
                })}
              </div>

              {/* Interactive Form Fields */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Emmanuel Okonkwo"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-[#00a8ff] focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#00a8ff] focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-all"
                  />
                </div>

                {/* Preset Amount Selector Pills */}
                <div className="flex flex-wrap gap-2">
                  {presetAmounts.map((amt) => {
                    const isSelected = Number(amount) === amt
                    return (
                      <motion.button
                        key={amt}
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setAmount(amt)}
                        className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-[#00a8ff] bg-sky-50 text-[#00a8ff]'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        ₦{amt.toLocaleString()}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Interactive Submit CTA Button */}
            <div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#f97316] hover:bg-orange-600 text-white font-bold py-3.5 text-sm shadow-md shadow-orange-500/25 transition-all disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Processing...' : `Give ₦${Number(amount || 0).toLocaleString()} via Flutterwave`}</span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <Lock className="h-3 w-3 text-slate-400" />
                <span>Secured by Flutterwave &bull; SSL Encrypted</span>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  )
}
