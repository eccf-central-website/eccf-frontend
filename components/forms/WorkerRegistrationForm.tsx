'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Upload, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'
import { registerWorker } from '@/app/actions/worker-registration'
import type { WorkerRole } from '@/types'

const FELLOWSHIP_TEAMS = [
  'Choir (Voice of Grace)',
  'Media & Technical',
  'Ushering & Protocol',
  'Welfare',
  'Academic',
  'Prayer & Intercession',
  'Organizing & Logistics',
  'Bible Study',
  'Evangelism & Follow-up',
  'Drama',
  'Publicity & Design',
]

const HALLS_OF_RESIDENCE = [
  'Hall 1',
  'Hall 2',
  'Hall 3',
  'Hall 4',
  'Postgraduate Hall',
  'Off-Campus',
]

export function WorkerRegistrationForm() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{
    ok?: boolean
    error?: string
    message?: string
    isExco?: boolean
  } | null>(null)

  // Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [team, setTeam] = useState('')
  const [hall, setHall] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [ndprConsent, setNdprConsent] = useState(false)

  // Birthday Picture State
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [base64Image, setBase64Image] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Exco Designation State
  const [isExco, setIsExco] = useState(false)
  const [requestedRole, setRequestedRole] = useState<WorkerRole>('hall_rep')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please select a photo smaller than 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result as string
      setImagePreview(res)
      // Extract pure base64 data for Google Apps Script bridge
      const rawBase64 = res.split(',')[1] || res
      setBase64Image(rawBase64)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)

    if (isExco) {
      if (password.length < 8) {
        setStatus({ ok: false, error: 'Password must be at least 8 characters long.' })
        return
      }
      if (password !== confirmPassword) {
        setStatus({ ok: false, error: 'Passwords do not match.' })
        return
      }
    }

    if (!ndprConsent) {
      setStatus({ ok: false, error: 'You must check the consent box to proceed.' })
      return
    }

    setLoading(true)

    try {
      const result = await registerWorker({
        fullName,
        email,
        phoneNumber,
        team,
        hall,
        roomNumber,
        birthDate,
        birthdayPictureBase64: base64Image || undefined,
        isExco,
        requestedRole: isExco ? requestedRole : undefined,
        password: isExco ? password : undefined,
        ndprConsent,
      })

      setStatus(result)

      if (result.ok) {
        // Reset sensitive and transient fields
        setPassword('')
        setConfirmPassword('')
      }
    } catch {
      setStatus({
        ok: false,
        error: 'An unexpected error occurred while submitting your registration.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto text-slate-900">
      {/* Success Notification */}
      {status?.ok && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-5 rounded-2xl mb-8 flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-bold text-base text-emerald-950">Registration Received!</h4>
            <p className="text-sm text-emerald-800 leading-relaxed">{status.message}</p>
            {status.isExco && (
              <p className="text-xs text-emerald-700 bg-emerald-100/70 p-2.5 rounded-xl mt-2 font-medium">
                Once an administrator approves your designation, you can log in at the{' '}
                <Link href="/login" className="underline font-bold text-emerald-900">
                  Exco Dashboard Login
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Notification */}
      {status?.error && (
        <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-2xl mb-8 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{status.error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Profile */}
        <div className="space-y-4">
          <div className="border-b border-stone-200/80 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#0077cc]">
              Worker Profile
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Please enter your accurate details for fellowship records.
            </p>
          </div>

          <div>
            <label
              htmlFor="fullName"
              className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700"
            >
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] shadow-xs transition-all"
              placeholder="e.g. John Oluwaseun Doe"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] shadow-xs transition-all"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phoneNumber"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] shadow-xs transition-all"
                placeholder="08012345678"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Primary identifier used for your CRM record & verification.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="team"
                className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700"
              >
                Operational Team <span className="text-red-500">*</span>
              </label>
              <select
                id="team"
                required
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] shadow-xs transition-all"
              >
                <option value="">Select your team</option>
                {FELLOWSHIP_TEAMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="birthDate"
                className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700"
              >
                Birth Date <span className="text-red-500">*</span>
              </label>
              <input
                id="birthDate"
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] shadow-xs transition-all"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Powers the fellowship birthday calendar tracker.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="hall"
                className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700"
              >
                Hall of Residence <span className="text-red-500">*</span>
              </label>
              <select
                id="hall"
                required
                value={hall}
                onChange={(e) => setHall(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] shadow-xs transition-all"
              >
                <option value="">Select Hall</option>
                {HALLS_OF_RESIDENCE.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="roomNumber"
                className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700"
              >
                Room Number <span className="text-red-500">*</span>
              </label>
              <input
                id="roomNumber"
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] shadow-xs transition-all"
                placeholder="e.g. Room 204 or Block A-12"
              />
            </div>
          </div>

          {/* Birthday Picture Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700">
              Birthday Picture
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-stone-200 bg-white shadow-xs">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Birthday preview"
                  className="h-20 w-20 rounded-xl object-cover border border-stone-200 shrink-0 shadow-sm"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-slate-400">
                  <Upload className="h-8 w-8" />
                </div>
              )}
              <div className="flex-1 text-center sm:text-left space-y-1">
                <p className="text-xs sm:text-sm font-medium text-slate-700">
                  Select a celebratory picture we can celebrate you with on your birthday.
                </p>
                <p className="text-[11px] text-slate-500">
                  JPG or PNG, up to 5MB. Will be safely archived in the fellowship drive.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-200 text-slate-700 hover:bg-stone-300 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {imagePreview ? 'Change Photo' : 'Choose Photo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Exco Designation Toggle */}
        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label
                htmlFor="isExcoToggle"
                className="text-sm font-bold text-slate-900 cursor-pointer flex items-center gap-2"
              >
                <span>Are you an Exco member?</span>
              </label>
              <p className="text-xs text-slate-600 mt-0.5">
                Check this if you serve on the fellowship Executive Council.
              </p>
            </div>
            <input
              id="isExcoToggle"
              type="checkbox"
              checked={isExco}
              onChange={(e) => setIsExco(e.target.checked)}
              className="h-5 w-5 rounded-md text-[#0077cc] focus:ring-[#0077cc] border-stone-300 transition-all cursor-pointer"
            />
          </div>

          {/* Conditional Exco Fields */}
          {isExco && (
            <div className="pt-3 border-t border-sky-100 space-y-4">
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  <strong>Admin Approval Gate:</strong> Exco dashboard access requires approval
                  from fellowship administrators before activation.
                </p>
              </div>

              <div>
                <label
                  htmlFor="requestedRole"
                  className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700"
                >
                  Exco Designation / Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="requestedRole"
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value as WorkerRole)}
                  className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] transition-all"
                >
                  <option value="hall_rep">Hall Representative (Hostel Oversight)</option>
                  <option value="finance">Finance Team (Ledgers & Accounts)</option>
                  <option value="admin">Executive Council / Administrator</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700"
                  >
                    Dashboard Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required={isExco}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 pr-10 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] transition-all"
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-1.5 text-slate-700"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required={isExco}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0077cc]/30 focus:border-[#0077cc] transition-all"
                    placeholder="Repeat password"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: NDPR Compliance */}
        <div className="flex items-start gap-3 pt-2">
          <input
            id="ndprConsent"
            type="checkbox"
            required
            checked={ndprConsent}
            onChange={(e) => setNdprConsent(e.target.checked)}
            className="h-4 w-4 rounded text-[#0077cc] focus:ring-[#0077cc] border-stone-300 mt-1 cursor-pointer"
          />
          <label htmlFor="ndprConsent" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
            I consent to Edo State University Christian Campus Fellowship (ECCF) collecting and
            processing my registration details in accordance with the Nigerian Data Protection
            Regulation (NDPR) for fellowship administration.
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 sm:h-14 w-full items-center justify-center rounded-full bg-[#0095ff] px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-sky-500 shadow-md shadow-sky-500/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]"
        >
          {loading ? 'Processing Registration...' : 'Register as a Worker'}
        </button>
      </form>
    </div>
  )
}
