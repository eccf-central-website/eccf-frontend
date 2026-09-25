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
    <div className="bg-white text-slate-900 shadow-sm rounded-lg border border-slate-200 p-6 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Welfare Request</h2>
      
      {status?.success && (
        <div className="bg-sky-50 text-sky-700 p-4 rounded-md mb-6 text-sm font-medium">
          Your request has been submitted. The welfare team will reach out to you soon.
        </div>
      )}

      {status?.error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 text-sm font-medium">
          {status.error}
        </div>
      )}

      <form id="welfare-form" action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1 text-slate-700">Full Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1 text-slate-700">Phone Number</label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            required
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="requestDetails" className="block text-sm font-medium mb-1 text-slate-700">Request Details</label>
          <textarea
            id="requestDetails"
            name="requestDetails"
            required
            rows={4}
            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Please briefly describe your need..."
          />
        </div>

        <button type="submit" className="flex h-10 w-full items-center justify-center rounded-md bg-[#0095ff] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0080e0] shadow-sm shadow-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:pointer-events-none disabled:opacity-50 mt-4" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}
