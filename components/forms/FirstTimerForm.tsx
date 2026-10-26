'use client'

import { useState } from 'react'
import { submitFirstTimer } from '@/app/actions/intake-actions'
import TurnstileWidget from '@/components/forms/TurnstileWidget'

const DEFAULT_HALLS = [
  'Hall 1',
  'Hall 2',
  'Hall 3',
  'Hall 4',
  'Hall 5',
  'Hall 6',
  'Hall 7',
  'Hall 8',
]

interface FirstTimerFormProps {
  hallOptions?: string[]
}

export function FirstTimerForm({ hallOptions }: FirstTimerFormProps = {}) {
  const halls = hallOptions && hallOptions.length > 0 ? hallOptions : DEFAULT_HALLS
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; error?: string } | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)
  // The bot check stays out of the layout until the visitor fills the required
  // fields, so it never appears before they are ready to submit.
  const [turnstileArmed, setTurnstileArmed] = useState(false)

  function handleFormInput(e: React.FormEvent<HTMLFormElement>) {
    if (turnstileArmed) return
    const data = new FormData(e.currentTarget)
    const first = String(data.get('firstName') ?? '').trim()
    const last = String(data.get('lastName') ?? '').trim()
    const phone = String(data.get('phoneNumber') ?? '').trim()
    if (first && last && phone.length >= 7) setTurnstileArmed(true)
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setStatus(null)
    formData.set('turnstileToken', turnstileToken)
    
    try {
      const result = await submitFirstTimer(formData)
      setStatus(result)
      if (result.success) {
        const form = document.getElementById('first-timer-form') as HTMLFormElement
        if (form) form.reset()
        setTurnstileToken('')
        setTurnstileResetSignal((signal) => signal + 1)
        setTurnstileArmed(false)
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
          Thank you for visiting ECCF! We have received your details and will be in touch shortly.
        </div>
      )}

      {status?.error && (
        <div className="bg-red-50 border border-red-200/60 text-red-700 p-4 rounded-2xl mb-6 text-sm font-medium">
          {status.error}
        </div>
      )}

      <form id="first-timer-form" action={handleSubmit} onInput={handleFormInput} className="space-y-4">
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="firstName" className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              className="flex h-11 sm:h-12 w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] transition-all disabled:opacity-50"
              placeholder="e.g. John"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              className="flex h-11 sm:h-12 w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] transition-all disabled:opacity-50"
              placeholder="e.g. Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="flex h-11 sm:h-12 w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] transition-all disabled:opacity-50"
            placeholder="john.doe@example.com"
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700">
            Phone Number <span className="text-red-500">*</span>
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

        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="hall" className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700">
              Hostel / Hall
            </label>
            <select
              id="hall"
              name="hall"
              defaultValue=""
              className="flex h-11 sm:h-12 w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2 text-sm sm:text-base text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] transition-all disabled:opacity-50"
            >
              <option value="">Select Hall / Hostel</option>
              {halls.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="roomNumber" className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700">
              Room No.
            </label>
            <input
              id="roomNumber"
              name="roomNumber"
              type="text"
              className="flex h-11 sm:h-12 w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] transition-all disabled:opacity-50"
              placeholder="AG 01"
            />
          </div>
        </div>

        <div>
          <label htmlFor="department" className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700">
            Department
          </label>
          <input
            id="department"
            name="department"
            type="text"
            className="flex h-11 sm:h-12 w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] transition-all disabled:opacity-50"
            placeholder="e.g. Computer Science"
          />
        </div>

        <div>
          <label htmlFor="invitedBy" className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700">
            Who Invited You?
          </label>
          <input
            id="invitedBy"
            name="invitedBy"
            type="text"
            className="flex h-11 sm:h-12 w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] transition-all disabled:opacity-50"
            placeholder="Friend or fellowship member name"
          />
        </div>

        {turnstileArmed && (
          <div className="pt-2 flex justify-center">
            <TurnstileWidget
              onToken={(token) => setTurnstileToken(token)}
              resetSignal={turnstileResetSignal}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (turnstileArmed && !turnstileToken)}
          className="w-full mt-2 flex items-center justify-center h-12 sm:h-14 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm sm:text-base shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting Details...' : 'Connect With Us'}
        </button>
      </form>
    </div>
  )
}
