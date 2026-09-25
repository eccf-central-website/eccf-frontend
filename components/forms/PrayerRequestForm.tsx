'use client'

import { useState } from 'react'
import { submitPrayerRequest } from '@/app/actions/intake-actions'

export function PrayerRequestForm() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; error?: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setStatus(null)
    
    try {
      const result = await submitPrayerRequest(formData)
      setStatus(result)
      if (result.success) {
        const form = document.getElementById('prayer-form') as HTMLFormElement
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
      <h2 className="text-2xl font-bold mb-6 text-center">Prayer Request</h2>
      
      {status?.success && (
        <div className="bg-sky-50 text-sky-700 p-4 rounded-md mb-6 text-sm font-medium">
          Your prayer request has been submitted. The prayer team will join you in prayers.
        </div>
      )}

      {status?.error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 text-sm font-medium">
          {status.error}
        </div>
      )}

      <form id="prayer-form" action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1 text-slate-700">Name (Optional)</label>
          <input
            id="name"
            name="name"
            type="text"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Leave blank to remain anonymous"
          />
        </div>

        <div>
          <label htmlFor="request" className="block text-sm font-medium mb-1 text-slate-700">Your Prayer Request</label>
          <textarea
            id="request"
            name="request"
            required
            rows={5}
            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="How can we pray for you?"
          />
        </div>

        <button type="submit" className="flex h-10 w-full items-center justify-center rounded-md bg-[#0095ff] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0080e0] shadow-sm shadow-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:pointer-events-none disabled:opacity-50 mt-4" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}
