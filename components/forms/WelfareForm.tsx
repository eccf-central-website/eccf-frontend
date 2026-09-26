'use client'

import { useState } from 'react'
import { submitWelfareRequest } from '@/app/actions/intake-actions'

export function WelfareForm() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; error?: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setStatus(null)
    
    try {
      const result = await submitWelfareRequest(formData)
      setStatus(result)
      if (result.success) {
        const form = document.getElementById('welfare-form') as HTMLFormElement
        if (form) form.reset()
      }
    } catch {
      setStatus({ success: false, error: 'An unexpected error occurred.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white text-slate-900 shadow-sm rounded-[24px] border border-stone-200/80 p-6 sm:p-8 w-full">
      {status?.success && (
        <div className="bg-sky-50 border border-sky-200/60 text-sky-800 p-4 rounded-2xl mb-6 text-sm font-medium">
          Your request has been submitted. The welfare team will reach out to you shortly.
        </div>
      )}

      {status?.error && (
        <div className="bg-red-50 border border-red-200/60 text-red-700 p-4 rounded-2xl mb-6 text-sm font-medium">
          {status.error}
        </div>
      )}

      <form id="welfare-form" action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="flex h-11 sm:h-12 w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] transition-all disabled:opacity-50"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            required
            className="flex h-11 sm:h-12 w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] transition-all disabled:opacity-50"
            placeholder="08012345678"
          />
        </div>

        <div>
          <label htmlFor="requestDetails" className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700">
            Request Details
          </label>
          <textarea
            id="requestDetails"
            name="requestDetails"
            required
            rows={4}
            className="flex w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] transition-all disabled:opacity-50"
            placeholder="Please describe your need in confidence..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-full bg-[#0095ff] px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-sky-500 shadow-md shadow-sky-500/20 disabled:pointer-events-none disabled:opacity-50 mt-6 active:scale-[0.99]"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}
