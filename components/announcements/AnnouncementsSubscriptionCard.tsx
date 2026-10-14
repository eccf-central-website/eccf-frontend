'use client'

import * as React from 'react'
import { useState } from 'react'
import { Bell, CheckCircle2, Loader2, Mail, Send, ShieldCheck } from 'lucide-react'
import { subscribeToAnnouncements } from '@/app/actions/subscriber-actions'

export default function AnnouncementsSubscriptionCard() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{
    success?: boolean
    message?: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim() || loading) return

    setLoading(true)
    setStatus(null)

    const formData = new FormData()
    formData.append('email', email.trim())
    if (name.trim()) {
      formData.append('name', name.trim())
    }

    try {
      const res = await subscribeToAnnouncements(formData)
      setStatus(res)
      if (res.success) {
        setEmail('')
        setName('')
      }
    } catch {
      setStatus({
        success: false,
        message: 'Something went wrong. Please check your connection and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-14 sm:mt-18">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-7 sm:p-10 lg:p-12 shadow-xl shadow-slate-950/15 border border-slate-800">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest font-mono">
            <Bell className="h-3.5 w-3.5 text-sky-400" />
            <span>EMAIL BULLETINS &amp; ALERTS</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
            Never Miss a Fellowship Update
          </h2>

          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl mx-auto">
            Subscribe to receive Sunday service announcements, academic prayer notices, and special programme alerts delivered directly to your inbox.
          </p>

          {/* Status Banners */}
          {status && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2.5 transition-all ${
                status.success
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border border-red-500/30 text-red-300'
              }`}
            >
              {status.success && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
              <span>{status.message}</span>
            </div>
          )}

          {/* Subscription Form */}
          <form onSubmit={handleSubmit} className="pt-2 sm:pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5 max-w-lg mx-auto">
              <div className="relative w-full flex-1">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full h-12 rounded-full border border-slate-700 bg-slate-900/90 pl-10 pr-4 text-sm text-white placeholder:text-slate-400 focus:bg-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto h-12 px-7 rounded-full bg-[#0095ff] hover:bg-sky-500 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-60 disabled:pointer-events-none shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Subscribe</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              <span>We respect your privacy. No spam, ever. Unsubscribe at any time.</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
