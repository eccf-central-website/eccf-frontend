'use client'

import { useState } from 'react'
import { submitFirstTimer } from '@/app/actions/intake-actions'

export function FirstTimerForm() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; error?: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setStatus(null)
    
    try {
      const result = await submitFirstTimer(formData)
      setStatus(result)
      if (result.success) {
        // Option to reset form here if using a ref, but simple enough
        const form = document.getElementById('first-timer-form') as HTMLFormElement
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
      <h2 className="text-2xl font-bold mb-6 text-center">First Timer Connection</h2>
      
      {status?.success && (
        <div className="bg-sky-50 text-sky-700 p-4 rounded-md mb-6 text-sm font-medium">
          Thank you for visiting ECCF! We have received your details and will be in touch shortly.
        </div>
      )}

      {status?.error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 text-sm font-medium">
          {status.error}
        </div>
      )}

      <form id="first-timer-form" action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-1 text-slate-700">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="John Doe"
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
            placeholder="08012345678"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="hall" className="block text-sm font-medium mb-1 text-slate-700">Hall</label>
            <input
              id="hall"
              name="hall"
              type="text"
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g. Hall 1"
            />
          </div>
          <div>
            <label htmlFor="roomNumber" className="block text-sm font-medium mb-1 text-slate-700">Room No.</label>
            <input
              id="roomNumber"
              name="roomNumber"
              type="text"
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g. 101"
            />
          </div>
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium mb-1 text-slate-700">Department</label>
          <input
            id="department"
            name="department"
            type="text"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="e.g. Computer Science"
          />
        </div>

        <div>
          <label htmlFor="level" className="block text-sm font-medium mb-1 text-slate-700">Level</label>
          <input
            id="level"
            name="level"
            type="text"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="e.g. 100L"
          />
        </div>

        <button type="submit" className="flex h-10 w-full items-center justify-center rounded-md bg-[#0095ff] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0080e0] shadow-sm shadow-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:pointer-events-none disabled:opacity-50 mt-4" disabled={loading}>
          {loading ? 'Submitting...' : 'Connect With Us'}
        </button>
      </form>
    </div>
  )
}
