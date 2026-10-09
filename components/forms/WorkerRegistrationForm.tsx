'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Upload,
  UserCheck,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react'
import { registerWorker, lookupWorkerByPhone } from '@/app/actions/worker-registration'
import { FELLOWSHIP_TEAMS } from '@/lib/dashboard/attendance-constants'
import type { WorkerRole } from '@/types'

const HALLS_OF_RESIDENCE = [
  'Hall 1',
  'Hall 2',
  'Hall 3',
  'Hall 4',
  'Postgraduate Hall',
  'Off-Campus',
]

export function WorkerRegistrationForm() {
  // Step & Flow State
  const [step, setStep] = useState(1)
  const [isReturning, setIsReturning] = useState(false)
  const [checkingPhone, setCheckingPhone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form Fields
  const [phoneNumber, setPhoneNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [team, setTeam] = useState('')
  const [hall, setHall] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [base64Image, setBase64Image] = useState<string | null>(null)

  // Exco Fields
  const [isExco, setIsExco] = useState(false)
  const [requestedRole, setRequestedRole] = useState<WorkerRole>('team_lead')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Privacy & Status
  const [ndprConsent, setNdprConsent] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<{
    ok: boolean
    message?: string
    isExco?: boolean
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Total steps based on flow
  // Returning flow: Step 1 (Phone) -> Step 2 (Location) -> Step 3 (Photo) -> Step 4 (Confirm)
  // New worker flow: Step 1 (Phone) -> Step 2 (Name) -> Step 3 (Email) -> Step 4 (Team) -> Step 5 (Location) -> Step 6 (Birthday) -> Step 7 (Photo) -> Step 8 (Exco) -> Step 9 (Review)
  const totalSteps = isReturning ? 4 : 9

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Please select a photo smaller than 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result as string
      setImagePreview(res)
      const rawBase64 = res.split(',')[1] || res
      setBase64Image(rawBase64)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  // Gateway: Phone Check (Step 1)
  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const clean = phoneNumber.trim().replace(/\s+/g, '')
    if (clean.length < 8) {
      setError('Please enter a valid phone number.')
      return
    }

    setCheckingPhone(true)
    try {
      const res = await lookupWorkerByPhone(clean)
      if (res.found && res.worker) {
        setIsReturning(true)
        setFullName(res.worker.fullName || '')
        setEmail(res.worker.email || '')
        setTeam(res.worker.team || '')
        setHall(res.worker.hall || '')
        setRoomNumber(res.worker.roomNumber || '')
        setBirthDate(res.worker.birthDate || '')
        setExistingPhotoUrl(res.worker.profileImageUrl || null)
        if (res.worker.role) {
          setIsExco(true)
          setRequestedRole(res.worker.role)
        }
        setStep(2)
      } else {
        setIsReturning(false)
        setStep(2)
      }
    } catch {
      setError('Network verification error. Please try again.')
    } finally {
      setCheckingPhone(false)
    }
  }

  // Final Submission
  async function handleFinalSubmit() {
    setError(null)
    setSubmitting(true)

    try {
      const res = await registerWorker({
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
        password: isExco && password ? password : undefined,
        ndprConsent,
      })

      if (res.ok) {
        setSuccessResult(res)
      } else {
        setError(res.error || 'Failed to submit registration. Please check your fields.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Slide Animation Variants
  const slideVariants = {
    enter: { opacity: 0, x: 25 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -25 },
  }

  // Render Success Screen
  if (successResult?.ok) {
    return (
      <div className="w-full max-w-xl mx-auto text-center space-y-6 py-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 border-2 border-emerald-300 shadow-sm">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-3xl sm:text-4xl text-slate-950 font-bold tracking-tight">
            {isReturning ? 'Location Updated! 🎉' : 'Welcome to the Workforce! 🎉'}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
            {successResult.message}
          </p>
        </div>

        {successResult.isExco && (
          <div className="p-5 rounded-2xl bg-sky-50/90 border-2 border-sky-200 text-left space-y-2 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-sky-950 text-sm">
              <ShieldCheck className="h-5 w-5 text-sky-600" />
              <span>Exco Dashboard Access</span>
            </div>
            <p className="text-xs sm:text-sm text-sky-800 leading-relaxed">
              Your Exco request is under review. Once an administrator approves your account, you
              can log in at the{' '}
              <Link href="/login" className="underline font-bold text-sky-950">
                Exco Dashboard Login
              </Link>
              .
            </p>
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex h-14 items-center justify-center rounded-xl bg-slate-900 px-8 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-md"
          >
            Return to Homepage
          </Link>
          <button
            type="button"
            onClick={() => {
              setSuccessResult(null)
              setStep(1)
              setPhoneNumber('')
              setIsReturning(false)
            }}
            className="flex h-14 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Register Another Member
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Visual Progress Bar Header */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold tracking-wider uppercase text-slate-600 font-mono">
          <span className="text-[#0077cc]">{isReturning ? 'Returning Worker Refresh' : 'New Worker Intake'}</span>
          <span>
            Step {step} of {totalSteps}
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-[#0077cc] to-[#0095ff] rounded-full"
            initial={false}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Main Interactive Container */}
      <div className="space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 text-sm font-semibold flex items-start gap-3 shadow-xs">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* STEP 1: Phone Number Gateway                                              */}
          {/* ========================================================================= */}
          {step === 1 && (
            <motion.div
              key="step-1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                  Identity Verification
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-slate-950 font-bold tracking-tight">
                  What is your phone number?
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  We use this as your unique fellowship ID to recognize existing workers and prevent
                  duplicates.
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div>
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 0816 873 0661"
                    className="flex h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-6 text-xl sm:text-2xl font-semibold tracking-wide text-slate-900 placeholder:text-slate-400 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={checkingPhone || phoneNumber.trim().length < 8}
                  className="flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]"
                >
                  {checkingPhone ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Checking Fellowship Records…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Continue <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* RETURNING WORKER FLOW (Steps 2, 3, 4)                                     */}
          {/* ========================================================================= */}
          {isReturning && step === 2 && (
            <motion.div
              key="step-r2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              {/* Friendly Returning Greeting Badge */}
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3.5">
                <UserCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-base text-emerald-950">
                    Welcome back, {fullName}! 👋
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                    Operational Team: <strong>{team}</strong> · Previous record:{' '}
                    <strong>
                      {hall || 'Unassigned'}, Room {roomNumber || '—'}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                  Session Update
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  Where are you staying this session?
                </h2>
                <p className="text-sm text-slate-600">
                  Update your hostel and room allocation for the current academic session.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Hall of Residence
                  </label>
                  <select
                    required
                    value={hall}
                    onChange={(e) => setHall(e.target.value)}
                    className="flex h-16 w-full rounded-2xl border-2 border-stone-200 bg-[#fafaf9] px-5 text-lg font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                  >
                    <option value="">Select Hall of Residence</option>
                    {HALLS_OF_RESIDENCE.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Room Number
                  </label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. Room 204 or Block A-12"
                    className="flex h-16 w-full rounded-2xl border-2 border-stone-200 bg-[#fafaf9] px-6 text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-stone-200 text-slate-600 hover:bg-stone-50 transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={!hall || !roomNumber}
                  onClick={() => setStep(3)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-[#0077cc] px-8 text-base sm:text-lg font-bold text-white transition-all hover:bg-sky-600 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Next Step <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {isReturning && step === 3 && (
            <motion.div
              key="step-r3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                  Birthday Picture
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  Update your birthday picture?
                </h2>
                <p className="text-sm text-slate-600">
                  Keep your existing photo on file or upload a fresh celebratory picture for this
                  year.
                </p>
              </div>

              <div className="p-6 rounded-2xl border-2 border-dashed border-stone-200 bg-[#fafaf9] flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="New preview"
                    className="h-24 w-24 rounded-2xl object-cover border border-stone-200 shadow-sm shrink-0"
                  />
                ) : existingPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={existingPhotoUrl}
                    alt="Current photo"
                    className="h-24 w-24 rounded-2xl object-cover border border-stone-200 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-400 shrink-0">
                    <Upload className="h-10 w-10" />
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {imagePreview
                      ? 'New photo selected!'
                      : existingPhotoUrl
                        ? 'Current photo on file in the fellowship drive.'
                        : 'No photo currently on file.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-200 text-slate-800 text-xs sm:text-sm font-bold hover:bg-stone-300 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    {imagePreview ? 'Change Photo' : 'Upload New Photo'}
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-stone-200 text-slate-600 hover:bg-stone-50 transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-[#0077cc] px-8 text-base sm:text-lg font-bold text-white transition-all hover:bg-sky-600 shadow-lg shadow-sky-600/25"
                >
                  Review &amp; Confirm <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {isReturning && step === 4 && (
            <motion.div
              key="step-r4"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                  Confirm Updates
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  Ready to save for this session?
                </h2>
                <p className="text-sm text-slate-600">
                  Please review your updated location details before saving.
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-[#fafaf9] p-6 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-stone-200/60 text-sm">
                  <span className="text-slate-500 font-medium">Worker:</span>
                  <span className="font-bold text-slate-900">{fullName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-stone-200/60 text-sm">
                  <span className="text-slate-500 font-medium">Operational Team:</span>
                  <span className="font-bold text-slate-900">{team}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-stone-200/60 text-sm">
                  <span className="text-slate-500 font-medium">New Residence:</span>
                  <span className="font-bold text-[#0077cc] text-base">
                    {hall}, Room {roomNumber}
                  </span>
                </div>
                {imagePreview && (
                  <div className="flex justify-between items-center py-2 text-sm">
                    <span className="text-slate-500 font-medium">Birthday Picture:</span>
                    <span className="font-bold text-emerald-600">New photo selected</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-stone-200 text-slate-600 hover:bg-stone-50 transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalSubmit}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-emerald-600 px-8 text-base sm:text-lg font-bold text-white transition-all hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  {submitting ? 'Saving Location…' : 'Confirm & Update Location 🎉'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* NEW WORKER FLOW (Steps 2 through 9)                                       */}
          {/* ========================================================================= */}
          {!isReturning && step === 2 && (
            <motion.div
              key="step-n2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                  Step 2 of {totalSteps}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  What is your full legal name?
                </h2>
                <p className="text-sm text-slate-600">
                  Please enter your first, middle, and last name for official records.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Oluwaseun Doe"
                  className="flex h-16 w-full rounded-2xl border-2 border-stone-200 bg-[#fafaf9] px-6 text-xl font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-stone-200 text-slate-600 hover:bg-stone-50 transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={fullName.trim().length < 2}
                  onClick={() => setStep(3)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-[#0077cc] px-8 text-base sm:text-lg font-bold text-white transition-all hover:bg-sky-600 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Next Step <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {!isReturning && step === 3 && (
            <motion.div
              key="step-n3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                  Step 3 of {totalSteps}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  What is your email address?
                </h2>
                <p className="text-sm text-slate-600">
                  Used for fellowship correspondence and your Exco portal sign-in credentials.
                </p>
              </div>

              <div>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="flex h-16 w-full rounded-2xl border-2 border-stone-200 bg-[#fafaf9] px-6 text-xl font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-stone-200 text-slate-600 hover:bg-stone-50 transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                  onClick={() => setStep(4)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-[#0077cc] px-8 text-base sm:text-lg font-bold text-white transition-all hover:bg-sky-600 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Next Step <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {!isReturning && step === 4 && (
            <motion.div
              key="step-n4"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                  Step 4 of {totalSteps}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  Which team do you serve in?
                </h2>
                <p className="text-sm text-slate-600">
                  Select your primary fellowship operational unit.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {FELLOWSHIP_TEAMS.map((t) => {
                  const isSelected = team === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTeam(t)}
                      className={`p-4 rounded-2xl border-2 text-left font-semibold text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#0077cc] bg-sky-50/70 text-[#0077cc] shadow-sm'
                          : 'border-stone-200 bg-[#fafaf9] text-slate-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>{t}</span>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-[#0077cc] shrink-0" />}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-stone-200 text-slate-600 hover:bg-stone-50 transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={!team}
                  onClick={() => setStep(5)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-[#0077cc] px-8 text-base sm:text-lg font-bold text-white transition-all hover:bg-sky-600 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Next Step <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {!isReturning && step === 5 && (
            <motion.div
              key="step-n5"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                  Step 5 of {totalSteps}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  Where do you reside on campus?
                </h2>
                <p className="text-sm text-slate-600">
                  Select your hostel or residence hall, and enter your room number.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Hall of Residence
                  </label>
                  <select
                    required
                    value={hall}
                    onChange={(e) => setHall(e.target.value)}
                    className="flex h-16 w-full rounded-2xl border-2 border-stone-200 bg-[#fafaf9] px-5 text-lg font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Room Number
                  </label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. Room 204 or Block A-12"
                    className="flex h-16 w-full rounded-2xl border-2 border-stone-200 bg-[#fafaf9] px-6 text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-stone-200 text-slate-600 hover:bg-stone-50 transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={!hall || !roomNumber}
                  onClick={() => setStep(6)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-[#0077cc] px-8 text-base sm:text-lg font-bold text-white transition-all hover:bg-sky-600 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Next Step <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {!isReturning && step === 6 && (
            <motion.div
              key="step-n6"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                  Step 6 of {totalSteps}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  When is your birthday?
                </h2>
                <p className="text-sm text-slate-600">
                  Used by the fellowship welfare team so we can celebrate you on your special day!
                </p>
              </div>

              <div>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="flex h-16 w-full rounded-2xl border-2 border-stone-200 bg-[#fafaf9] px-6 text-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-stone-200 text-slate-600 hover:bg-stone-50 transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={!birthDate}
                  onClick={() => setStep(7)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-[#0077cc] px-8 text-base sm:text-lg font-bold text-white transition-all hover:bg-sky-600 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Next Step <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {!isReturning && step === 7 && (
            <motion.div
              key="step-n7"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                  Step 7 of {totalSteps}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  Select your birthday picture
                </h2>
                <p className="text-sm text-slate-600">
                  A clear celebratory photo we can celebrate you with on your birthday.
                </p>
              </div>

              <div className="p-8 rounded-2xl border-2 border-dashed border-stone-200 bg-[#fafaf9] text-center space-y-4">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto h-32 w-32 rounded-3xl object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-stone-100 text-slate-400">
                    <Upload className="h-10 w-10" />
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-200 text-slate-800 text-sm font-bold hover:bg-stone-300 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    {imagePreview ? 'Change Photo' : 'Choose Photo (Max 5MB)'}
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-stone-200 text-slate-600 hover:bg-stone-50 transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep(8)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-[#0077cc] px-8 text-base sm:text-lg font-bold text-white transition-all hover:bg-sky-600 shadow-lg shadow-sky-600/25"
                >
                  Next Step <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {!isReturning && step === 8 && (
            <motion.div
              key="step-n8"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                  Step 8 of {totalSteps}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  Are you an Exco member?
                </h2>
                <p className="text-sm text-slate-600">
                  Select your role in the fellowship administration.
                </p>
              </div>

              {/* Two Choice Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsExco(false)}
                  className={`p-6 rounded-2xl border-2 text-left space-y-2 transition-all ${
                    !isExco
                      ? 'border-[#0077cc] bg-sky-50/70 shadow-sm'
                      : 'border-stone-200 bg-[#fafaf9] hover:bg-stone-100'
                  }`}
                >
                  <User className={`h-8 w-8 ${!isExco ? 'text-[#0077cc]' : 'text-slate-500'}`} />
                  <h4 className="font-bold text-base text-slate-950">Volunteer Worker</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    General workforce member serving in an operational team.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExco(true)}
                  className={`p-6 rounded-2xl border-2 text-left space-y-2 transition-all ${
                    isExco
                      ? 'border-[#0077cc] bg-sky-50/70 shadow-sm'
                      : 'border-stone-200 bg-[#fafaf9] hover:bg-stone-100'
                  }`}
                >
                  <ShieldCheck
                    className={`h-8 w-8 ${isExco ? 'text-[#0077cc]' : 'text-slate-500'}`}
                  />
                  <h4 className="font-bold text-base text-slate-950">Exco Member</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Executive Council member requiring Exco Dashboard access.
                  </p>
                </button>
              </div>

              {/* Exco Credentials Sub-Card */}
              {isExco && (
                <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-4">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      <strong>Admin Approval Gate:</strong> Exco accounts require administrator
                      approval before dashboard access is activated.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Exco Designation
                    </label>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value as WorkerRole)}
                      className="flex h-14 w-full rounded-xl border border-stone-300 bg-white px-4 text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0077cc]"
                    >
                      <option value="hall_rep">Hall Representative (Hostels)</option>
                      <option value="finance">Finance Team (Ledgers &amp; Accounts)</option>
                      <option value="admin">Executive Council / Administrator</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="flex h-12 w-full rounded-xl border border-stone-300 bg-white px-4 pr-10 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0077cc]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Repeat Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="flex h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0077cc]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(7)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-stone-200 text-slate-600 hover:bg-stone-50 transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={isExco && (password.length < 8 || password !== confirmPassword)}
                  onClick={() => setStep(9)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-[#0077cc] px-8 text-base sm:text-lg font-bold text-white transition-all hover:bg-sky-600 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Review &amp; Complete <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {!isReturning && step === 9 && (
            <motion.div
              key="step-n9"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                  Step 9 of {totalSteps}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  Confirm your details
                </h2>
                <p className="text-sm text-slate-600">
                  Review your registration summary and complete your workforce onboarding.
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-[#fafaf9] p-6 space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b border-stone-200/60">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-900">{fullName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-200/60">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-bold text-slate-900">{phoneNumber}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-200/60">
                  <span className="text-slate-500">Team:</span>
                  <span className="font-bold text-slate-900">{team}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-200/60">
                  <span className="text-slate-500">Hostel / Room:</span>
                  <span className="font-bold text-slate-900">
                    {hall}, {roomNumber}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-200/60">
                  <span className="text-slate-500">Exco Status:</span>
                  <span className="font-bold text-[#0077cc]">
                    {isExco ? `Yes (${requestedRole})` : 'General Worker'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2">
                <input
                  id="ndpr-new"
                  type="checkbox"
                  required
                  checked={ndprConsent}
                  onChange={(e) => setNdprConsent(e.target.checked)}
                  className="h-5 w-5 rounded text-[#0077cc] focus:ring-[#0077cc] mt-0.5 cursor-pointer"
                />
                <label
                  htmlFor="ndpr-new"
                  className="text-xs text-slate-600 leading-relaxed cursor-pointer"
                >
                  I consent to ECCF collecting and processing my fellowship workforce information in
                  accordance with the Nigerian Data Protection Regulation (NDPR).
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(8)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-stone-200 text-slate-600 hover:bg-stone-50 transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={submitting || !ndprConsent}
                  onClick={handleFinalSubmit}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-[#0077cc] px-8 text-base sm:text-lg font-bold text-white transition-all hover:bg-sky-600 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  {submitting ? 'Submitting Registration…' : 'Complete Registration 🎉'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
