'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Upload,
  UserCheck,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  ShieldAlert,
  RotateCcw,
  Loader2,
  Lock,
  KeyRound,
  Mail,
} from 'lucide-react'
import {
  checkWorkerPhoneAndInitiateVerification,
  confirmWorkerSelfServiceLink,
  registerWorker,
  requestWorkerSelfServiceLink,
  verifyWorkerOtp,
} from '@/app/actions/worker-registration'
import { FELLOWSHIP_TEAMS } from '@/lib/dashboard/attendance-constants'
import { compressImage } from '@/lib/image-compression'
import type { WorkerRole } from '@/types'
import TurnstileWidget from '@/components/forms/TurnstileWidget'

const HALLS_OF_RESIDENCE = [
  'Hall 1',
  'Hall 2',
  'Hall 3',
  'Hall 4',
  'Hall 5',
  'Hall 6',
  'Hall 7',
  'Hall 8',
]

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

function getDaysInMonth(monthStr: string): number {
  const month = parseInt(monthStr, 10)
  if ([4, 6, 9, 11].includes(month)) return 30
  if (month === 2) return 29 // Support leap-year Feb 29
  return 31
}

const VALID_WORKFORCE_CODES = [
  'ECCFWORKERS',
  'ECCFWORKERS2026',
  'ECCF2026',
  'WORKFORCE',
  'ECCF-WORKFORCE',
  (process.env.NEXT_PUBLIC_WORKER_ACCESS_CODE || '').toUpperCase().trim(),
].filter(Boolean)

export function WorkerRegistrationForm() {
  const searchParams = useSearchParams()
  const codeParam = searchParams.get('code') || searchParams.get('passcode') || searchParams.get('key') || ''
  const selfServiceToken = searchParams.get('selfServiceToken') || ''

  // Access Gate Security
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [enteredCode, setEnteredCode] = useState('')
  const [gateError, setGateError] = useState<string | null>(null)

  useEffect(() => {
    // 1. Auto-unlock if code provided via URL (e.g. from WhatsApp group link)
    if (codeParam && VALID_WORKFORCE_CODES.includes(codeParam.toUpperCase())) {
      setIsUnlocked(true)
      if (typeof window !== 'undefined') {
        localStorage.setItem('eccf_worker_passcode', codeParam.toUpperCase())
      }
      return
    }

    // 2. Check stored passcode in localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('eccf_worker_passcode')
      if (stored && VALID_WORKFORCE_CODES.includes(stored.toUpperCase())) {
        setIsUnlocked(true)
      }
    }
  }, [codeParam])


  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    const clean = enteredCode.trim().toUpperCase()
    if (VALID_WORKFORCE_CODES.includes(clean)) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('eccf_worker_passcode', clean)
      }
      setIsUnlocked(true)
      setGateError(null)
    } else {
      setGateError('Incorrect workforce passcode. Please confirm the key shared on the WhatsApp group.')
    }
  }

  // Step & Flow State
  const [step, setStep] = useState(1)
  const [isReturning, setIsReturning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requestingUpdateLink, setRequestingUpdateLink] = useState(false)
  const [updateLinkMessage, setUpdateLinkMessage] = useState<string | null>(null)
  const [updateIdentifier, setUpdateIdentifier] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)

  // Existing Worker Detection & OTP Verification State
  const [checkingPhone, setCheckingPhone] = useState(false)
  const [verificationPending, setVerificationPending] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Form Fields
  const [phoneNumber, setPhoneNumber] = useState('')
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const fullName = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' ')
  const [email, setEmail] = useState('')
  const [teams, setTeams] = useState<string[]>([])

  const toggleTeam = (t: string) => {
    setTeams((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    )
  }

  const [hall, setHall] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const effectiveBirthDate =
    birthMonth && birthDay
      ? `${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
      : ''
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

  useEffect(() => {
    setTurnstileToken('')
  }, [step])

  useEffect(() => {
    if (!selfServiceToken) return
    let active = true

    void confirmWorkerSelfServiceLink(selfServiceToken).then((result) => {
      if (!active) return
      if (result.ok && result.purpose === 'profile' && result.worker) {
        const worker = result.worker
        setIsUnlocked(true)
        setIsReturning(true)
        setPhoneNumber(worker.phoneNumber || '')
        setFirstName(worker.firstName || worker.fullName.split(/\s+/)[0] || '')
        setMiddleName(worker.middleName || '')
        setLastName(worker.lastName || '')
        setEmail(worker.email || '')
        setTeams(worker.teams.length > 0 ? worker.teams : [worker.team])
        setHall(worker.hall || '')
        setRoomNumber(worker.roomNumber || '')
        setBirthMonth(worker.birthMonth ? String(worker.birthMonth).padStart(2, '0') : '')
        setBirthDay(worker.birthDay ? String(worker.birthDay).padStart(2, '0') : '')
        setExistingPhotoUrl(worker.profileImageUrl || null)
        setIsExco(worker.isExco || false)
        setStep(2)
        setError(null)
      } else {
        setError(result.error || 'This secure link is invalid or has expired. Request a new one.')
      }

      const url = new URL(window.location.href)
      url.searchParams.delete('selfServiceToken')
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    }).catch(() => {
      if (active) setError('This secure link is invalid or has expired. Request a new one.')
    })

    return () => {
      active = false
    }
  }, [selfServiceToken])


  // Total steps based on flow
  // Returning flow: Step 1 (Phone) -> Step 2 (Location) -> Step 3 (Photo) -> Step 4 (Confirm)
  // New worker flow: Step 1 (Phone) -> Step 2 (Name) -> Step 3 (Email) -> Step 4 (Team) -> Step 5 (Location) -> Step 6 (Birthday) -> Step 7 (Photo) -> Step 8 (Exco) -> Step 9 (Review)
  const totalSteps = isReturning ? 4 : 9

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    try {
      const compressed = await compressImage(
        file,
        { maxWidth: 1200, maxHeight: 1200, quality: 0.82 },
        { fullName, team: teams[0] || 'General' }
      )
      setImagePreview(compressed.dataUrl)
      setBase64Image(compressed.base64)
      setError(null)
    } catch {
      // Fallback to FileReader if Canvas compression fails
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
  }

  // Phone submit: checks if worker already exists; sends OTP/magic link if existing
  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setVerificationNotice(null)

    const clean = phoneNumber.trim().replace(/\s+/g, '')
    if (clean.length < 8) {
      setError('Please enter a valid phone number (at least 8 digits).')
      return
    }

    setCheckingPhone(true)
    try {
      const result = await checkWorkerPhoneAndInitiateVerification({
        phoneNumber: clean,
        turnstileToken: turnstileToken || undefined,
      })

      if (!result.ok) {
        setError(result.error || 'Unable to check phone number. Please try again.')
        return
      }

      // If worker does NOT exist -> Proceed as new registration
      if (!result.exists) {
        setIsReturning(false)
        setIsExco(false)
        setTeams([])
        setStep(2)
        return
      }

      // Existing worker detected! Do NOT display details right away.
      // Transition to security verification state
      setVerificationPending(true)
      setMaskedEmail(result.maskedEmail || 'your registered email')
      setVerificationNotice(
        result.message ||
          `A 6-digit verification code and secure unlock link have been dispatched to ${result.maskedEmail || 'your email'}.`
      )
      setResendCooldown(60)
    } catch {
      setError('An unexpected error occurred while checking your phone number. Please try again.')
    } finally {
      setCheckingPhone(false)
      setTurnstileToken('')
      setTurnstileResetSignal((v) => v + 1)
    }
  }

  // Verifies the 6-digit OTP code entered on the page
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const clean = otpCode.trim().replace(/\s+/g, '')
    if (clean.length !== 6 || !/^\d{6}$/.test(clean)) {
      setError('Please enter the 6-digit verification code sent to your email.')
      return
    }

    setVerifyingOtp(true)
    try {
      const result = await verifyWorkerOtp({
        phoneNumber,
        otp: clean,
      })

      if (!result.ok || !result.worker) {
        setError(result.error || 'Invalid or expired verification code. Please check your email or request a new code.')
        return
      }

      const worker = result.worker
      setIsUnlocked(true)
      setIsReturning(true)
      setPhoneNumber(worker.phoneNumber || phoneNumber)
      setFirstName(worker.firstName || worker.fullName.split(/\s+/)[0] || '')
      setMiddleName(worker.middleName || '')
      setLastName(worker.lastName || '')
      setEmail(worker.email || '')
      setTeams(worker.teams.length > 0 ? worker.teams : [worker.team])
      setHall(worker.hall || '')
      setRoomNumber(worker.roomNumber || '')
      setBirthMonth(worker.birthMonth ? String(worker.birthMonth).padStart(2, '0') : '')
      setBirthDay(worker.birthDay ? String(worker.birthDay).padStart(2, '0') : '')
      setExistingPhotoUrl(worker.profileImageUrl || null)
      setIsExco(worker.isExco || false)

      setVerificationPending(false)
      setOtpCode('')
      setStep(2) // Jump straight to Returning Worker Step 2 (Location / Room update)
      setError(null)
    } catch {
      setError('An error occurred during verification. Please try again.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  // Resend verification code / link with cooldown
  async function handleResendCode() {
    if (resendCooldown > 0) return
    setError(null)
    setVerificationNotice(null)
    setCheckingPhone(true)
    try {
      const result = await checkWorkerPhoneAndInitiateVerification({
        phoneNumber,
        turnstileToken: turnstileToken || undefined,
      })
      if (result.ok) {
        setVerificationNotice(`A fresh 6-digit verification code and link were sent to ${result.maskedEmail || maskedEmail}.`)
        setResendCooldown(60)
      } else {
        setError(result.error || 'Failed to resend code. Please try again.')
      }
    } catch {
      setError('Could not resend code. Please try again.')
    } finally {
      setCheckingPhone(false)
      setTurnstileToken('')
      setTurnstileResetSignal((v) => v + 1)
    }
  }

  // Back from OTP verification to edit the phone number
  function handleChangePhone() {
    setVerificationPending(false)
    setOtpCode('')
    setError(null)
    setVerificationNotice(null)
  }

  async function handleRequestUpdateLink() {
    setError(null)
    setUpdateLinkMessage(null)
    setRequestingUpdateLink(true)
    try {
      const result = await requestWorkerSelfServiceLink({
        identifier: updateIdentifier,
        purpose: 'profile',
        turnstileToken,
      })
      setUpdateLinkMessage(result.message)
      if (result.maskedEmail) {
        setMaskedEmail(result.maskedEmail)
        if (result.phoneNumber) {
          setPhoneNumber(result.phoneNumber)
        }
        setVerificationPending(true)
        setResendCooldown(60)
      }
    } catch {
      setUpdateLinkMessage('If those details match a worker account with an email on file, a secure link and code have been sent.')
    } finally {
      setRequestingUpdateLink(false)
      setTurnstileToken('')
      setTurnstileResetSignal((value) => value + 1)
    }
  }
  // Final Submission
  async function handleFinalSubmit() {
    setError(null)
    if (!turnstileToken) {
      setError('Complete the security check before submitting the form.')
      return
    }
    setSubmitting(true)

    try {
      const registrationResult = await registerWorker({
        fullName,
        firstName,
        middleName,
        lastName,
        email,
        phoneNumber,
        team: teams[0] || '',
        teams,
        hall,
        roomNumber,
        birthDate: effectiveBirthDate,
        birthMonth,
        birthDay,
        profileImageUrl: base64Image ? undefined : existingPhotoUrl || undefined,
        requestPhotoUpload: Boolean(base64Image),
        turnstileToken,
        isExco,
        requestedRole: isExco ? requestedRole : undefined,
        password: isExco && password ? password : undefined,
        ndprConsent,
      })

      if (registrationResult.ok) {
        let finalResult = registrationResult
        if (base64Image && registrationResult.uploadGrant) {
          try {
            const uploadRes = await fetch('/api/upload-drive', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                base64: base64Image,
                fullName,
                team: teams[0] || 'General',
                uploadGrant: registrationResult.uploadGrant,
              }),
            })
            if (!uploadRes.ok) {
              finalResult = { ...registrationResult, message: `${registrationResult.message} Your profile was saved, but the photo could not be uploaded. You can submit it again from this form.` }
            }
          } catch {
            finalResult = { ...registrationResult, message: `${registrationResult.message} Your profile was saved, but the photo could not be uploaded. You can submit it again from this form.` }
          }
        }
        setSuccessResult(finalResult)
      } else {
        setError(registrationResult.error || 'Failed to submit registration. Please check your fields.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
      setTurnstileToken('')
      setTurnstileResetSignal((value) => value + 1)
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
      <div className="w-full max-w-xl mx-auto text-center space-y-6 py-6">
        <div className="space-y-2.5">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#0077cc] font-mono block">
            REGISTRATION CONFIRMED
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-slate-950 font-bold tracking-tight">
            {isReturning ? 'Profile Updated!' : 'Welcome to the Workforce!'}
          </h1>
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

        {!isReturning && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
              <UserCheck className="h-4 w-4 text-amber-600" />
              <span>Team Leader Verification Queued</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              Your department head has been notified to verify your workforce membership. You will appear on the active roster once confirmed.
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

  // Access Gate: Require workforce passcode if not unlocked
  if (!isUnlocked) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl bg-white border border-stone-200/90 p-7 sm:p-9 shadow-sm text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-[#0077cc] border border-sky-100 shadow-2xs">
          <Lock className="h-8 w-8 text-[#0095ff]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc] font-mono block">
            FELLOWSHIP WORKFORCE &amp; EXCO
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            Worker Registration
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            This registration portal is reserved exclusively for inducted volunteer workers and leaders of ECCF.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono mb-1.5">
              Enter Workforce Passcode
            </label>
            <div className="relative">
              <input
                type="text"
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value)
                  setGateError(null)
                }}
                placeholder="ECCFWORKERS"
                className="w-full h-12 rounded-xl border border-stone-300 pl-4 pr-10 text-sm font-mono tracking-wider uppercase focus:border-[#0077cc] focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
                autoFocus
              />
              <KeyRound className="h-4 w-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {gateError && (
              <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{gateError}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
          >
            Unlock Registration Form
          </button>
        </form>

        <div className="pt-2 border-t border-stone-100 text-xs text-slate-500 leading-relaxed">
          <p>
            Are you an ECCF worker? The access passkey is available in the pinned message of the official <strong>ECCF Workforce WhatsApp Group</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Workforce Security Badge */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-900 shadow-2xs">
        <span className="flex items-center gap-2 font-bold font-mono">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>VERIFIED WORKFORCE LINK &bull; AUTHORIZED SESSION</span>
        </span>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('eccf_worker_passcode')
            }
            setIsUnlocked(false)
          }}
          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-950 underline transition-colors"
        >
          Lock
        </button>
      </div>

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
        {((isReturning && step === 4) || (!isReturning && step === 9)) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="mb-2 text-xs font-semibold text-slate-700">Complete the security check to continue.</p>
            <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileResetSignal} />
          </div>
        )}
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
          {/* ========================================================================= */}
          {/* STEP 1: Phone Number Gateway or Verification State                        */}
          {/* ========================================================================= */}
          {step === 1 && (
            verificationPending ? (
              <motion.div
                key="step-1-otp-verify"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0077cc] text-xs font-mono font-bold uppercase tracking-wider mb-1">
                    <ShieldCheck className="h-4 w-4" />
                    <span>SECURITY VERIFICATION</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-slate-950 font-bold tracking-tight">
                    Enter Verification Code
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    A workforce profile matching <strong className="text-slate-950 font-mono">{phoneNumber}</strong> was found.
                    For your privacy and security, personal details are locked until verified.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/80 border border-sky-200/90 flex items-start gap-3.5">
                  <Mail className="h-5 w-5 text-[#0077cc] shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-700 leading-relaxed">
                    <p>
                      We have sent a <strong>6-digit security code</strong> and a <strong>direct unlock link</strong> to your email on file:
                    </p>
                    <p className="font-mono font-bold text-slate-950 text-base mt-1">{maskedEmail}</p>
                  </div>
                </div>

                {verificationNotice && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{verificationNotice}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label htmlFor="otp-input" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 font-mono">
                      6-Digit Security Code
                    </label>
                    <input
                      id="otp-input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="flex h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-6 text-center text-3xl font-mono font-bold tracking-[14px] text-slate-900 placeholder:text-slate-300 shadow-sm focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={otpCode.length !== 6 || verifyingOtp}
                    className="flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-6 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]"
                  >
                    {verifyingOtp ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" /> Verifying Code...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Verify Code &amp; Unlock Profile <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </button>
                </form>

                <div className="text-center py-1 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                    &mdash; Alternative Option &mdash;
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    You can also tap the <strong className="text-[#0077cc]">“Unlock My Worker Profile”</strong> button in your email to open the form directly.
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || checkingPhone}
                    className="font-semibold text-[#0077cc] hover:underline disabled:text-slate-400 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `Resend verification code (${resendCooldown}s)` : 'Resend verification code'}
                  </button>

                  <button
                    type="button"
                    onClick={handleChangePhone}
                    className="text-slate-500 hover:text-slate-900 underline"
                  >
                    Use a different phone number
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step-1-phone"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                    Worker Registration
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-slate-950 font-bold tracking-tight">
                    Start with your phone number
                  </h2>
                </div>

                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                  <div>
                    <input
                      type="tel"
                      required
                      autoFocus
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0801 234 5678"
                      className="flex h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-6 text-xl sm:text-2xl font-semibold tracking-wide text-slate-900 placeholder:text-slate-400 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={phoneNumber.trim().length < 8 || checkingPhone}
                    className="flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-4 sm:px-8 text-sm sm:text-base md:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]"
                  >
                    {checkingPhone ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" /> Checking Records...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Continue <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </button>
                </form>

                <div className="border-t border-slate-200 pt-5 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Already have a worker profile?</h3>
                    <p className="text-xs text-slate-600 mt-1">Enter the email or phone number on your record. We’ll send a secure link and code to your saved email address.</p>
                  </div>
                  <input
                    type="text"
                    autoComplete="username"
                    value={updateIdentifier}
                    onChange={(event) => setUpdateIdentifier(event.target.value)}
                    placeholder="Registered email or phone number"
                    aria-label="Email or phone number on your worker profile"
                    className="flex h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]/30 focus-visible:border-[#0077cc]"
                  />
                  {Boolean(updateIdentifier.trim()) && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold text-slate-700">Complete the security check to receive your link:</p>
                      <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileResetSignal} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleRequestUpdateLink}
                    disabled={requestingUpdateLink || !updateIdentifier.trim() || !turnstileToken}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:border-[#0077cc] hover:text-[#0077cc] disabled:opacity-50"
                  >
                    {requestingUpdateLink ? 'Sending secure code…' : 'Email me a profile update code & link'}
                  </button>
                  {updateLinkMessage && (
                    <p role="status" aria-live="polite" className="text-xs text-slate-700 rounded-lg bg-slate-100 p-3">
                      {updateLinkMessage}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    If you no longer have access to the email on file, contact an ECCF administrator to verify and update your contact details. You can still use this same form after opening the secure link; no dashboard account is required.
                  </p>
                </div>
              </motion.div>
            )
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
                    Operational Team{teams.length > 1 ? 's' : ''}:{' '}
                    <strong>{teams.join(', ') || 'Unassigned'}</strong> · Previous record:{' '}
                    <strong>
                      {hall || 'Unassigned'}, Room {roomNumber || '—'}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Update your profile details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input aria-label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="h-12 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]" />
                  <input aria-label="Middle name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Middle name (optional)" className="h-12 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]" />
                  <input aria-label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="h-12 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-slate-600">
                    Email on file
                    <input type="email" value={email} readOnly className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600" />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Phone on file
                    <input type="tel" value={phoneNumber} readOnly className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600" />
                  </label>
                </div>
                <p className="text-xs text-slate-500">To change your email or phone number, contact an ECCF administrator so the new contact can be verified.</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-slate-600">
                    Birthday month
                    <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]">
                      <option value="">Select month</option>
                      {MONTHS.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Birthday day
                    <input type="number" min="1" max={birthMonth ? getDaysInMonth(birthMonth) : 31} value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]" />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                  Session Update
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  What details have changed?
                </h2>
                <p className="text-sm text-slate-600">
                  Review your profile, current residence, operational teams, and birthday details.
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
                    className="flex h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 text-lg font-semibold text-slate-900 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
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
                    placeholder="AG 01"
                    className="flex h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-6 text-lg font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                  />
                </div>

                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Operational Team(s) <span className="text-red-500">*</span>
                    </label>
                    {teams.length > 0 && (
                      <span className="text-xs font-semibold text-[#0077cc] bg-sky-100 px-2.5 py-0.5 rounded-full">
                        {teams.length} team{teams.length > 1 ? 's' : ''} selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Select all teams you belong to for this session. A worker can serve in multiple teams.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {FELLOWSHIP_TEAMS.map((t) => {
                      const isSelected = teams.includes(t)
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTeam(t)}
                          className={`p-3 rounded-xl border-2 text-left font-semibold text-xs sm:text-sm transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-[#0077cc] bg-sky-50 text-[#0077cc] ring-2 ring-[#0077cc]/20 shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded border text-white transition-all ${
                                isSelected ? 'bg-[#0077cc] border-[#0077cc]' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </span>
                            <span>{t}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={!hall || !roomNumber || teams.length === 0}
                  onClick={() => setStep(3)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
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

              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0077cc] bg-white shadow-xs flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left transition-all">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="New preview"
                    className="h-24 w-24 rounded-2xl object-cover border-2 border-slate-200 shadow-sm shrink-0"
                  />
                ) : existingPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={existingPhotoUrl}
                    alt="Current photo"
                    className="h-24 w-24 rounded-2xl object-cover border-2 border-slate-200 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <Upload className="h-10 w-10 text-slate-500" />
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
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-xs text-xs sm:text-sm font-bold transition-colors"
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
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25"
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

              <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 space-y-3 shadow-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                  <span className="text-slate-500 font-medium">Worker:</span>
                  <span className="font-bold text-slate-900">{fullName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                  <span className="text-slate-500 font-medium">Operational Team{teams.length > 1 ? 's' : ''}:</span>
                  <span className="font-bold text-slate-900">{teams.join(', ')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
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
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={submitting || !turnstileToken}
                  onClick={handleFinalSubmit}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 sm:px-8 text-sm sm:text-base md:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-emerald-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="inline-flex items-center justify-center gap-2.5">
                      <Loader2 className="h-5 w-5 animate-spin shrink-0 aspect-square text-white" />
                      <span>Saving Location…</span>
                    </span>
                  ) : (
                    'Save Profile Updates'
                  )}
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

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Michael"
                    className="flex h-14 sm:h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 sm:px-6 text-lg sm:text-xl font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Middle Name <span className="text-slate-400 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Christopher"
                    className="flex h-14 sm:h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 sm:px-6 text-lg sm:text-xl font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Akan"
                    className="flex h-14 sm:h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 sm:px-6 text-lg sm:text-xl font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={firstName.trim().length < 2 || lastName.trim().length < 2}
                  onClick={() => setStep(3)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
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
                  placeholder="michael.akan@example.com"
                  className="flex h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-6 text-xl font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                  onClick={() => setStep(4)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                    Step 4 of {totalSteps}
                  </span>
                  {teams.length > 0 && (
                    <span className="text-xs font-semibold text-[#0077cc] bg-sky-100 px-2.5 py-0.5 rounded-full">
                      {teams.length} team{teams.length > 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  Which teams do you serve in?
                </h2>
                <p className="text-sm text-slate-600">
                  Select all operational teams you belong to. A worker can serve in more than one team.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {FELLOWSHIP_TEAMS.map((t) => {
                  const isSelected = teams.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTeam(t)}
                      className={`p-4 rounded-2xl border-2 text-left font-semibold text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#0077cc] bg-sky-50 text-[#0077cc] shadow-sm ring-2 ring-[#0077cc]/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border text-white transition-all ${
                            isSelected ? 'bg-[#0077cc] border-[#0077cc]' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </span>
                        <span>{t}</span>
                      </span>
                      {isSelected && (
                        <span className="text-xs font-medium text-sky-600 bg-sky-100/60 px-2 py-0.5 rounded-md">
                          Selected
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={teams.length === 0}
                  onClick={() => setStep(5)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
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
                    className="flex h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 text-lg font-semibold text-slate-900 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
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
                    placeholder="AG 01"
                    className="flex h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-6 text-lg font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={!hall || !roomNumber}
                  onClick={() => setStep(6)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
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
                  So we could celebrate with you on your special day!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Month <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={birthMonth}
                    onChange={(e) => {
                      const newMonth = e.target.value
                      setBirthMonth(newMonth)
                      if (birthDay) {
                        const maxD = getDaysInMonth(newMonth)
                        if (parseInt(birthDay, 10) > maxD) {
                          setBirthDay(String(maxD).padStart(2, '0'))
                        }
                      }
                    }}
                    className="flex h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 text-lg font-semibold text-slate-900 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all cursor-pointer"
                  >
                    <option value="">Select Month</option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Day <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="flex h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-5 text-lg font-semibold text-slate-900 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all cursor-pointer"
                  >
                    <option value="">Select Day</option>
                    {Array.from({ length: birthMonth ? getDaysInMonth(birthMonth) : 31 }, (_, i) => {
                      const dayVal = String(i + 1).padStart(2, '0')
                      return (
                        <option key={dayVal} value={dayVal}>
                          {i + 1}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={!birthMonth || !birthDay}
                  onClick={() => setStep(7)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
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

              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0077cc] bg-white text-center space-y-4 shadow-xs transition-all">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto h-32 w-32 rounded-3xl object-cover border-2 border-slate-200 shadow-md"
                  />
                ) : (
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 border border-slate-200 text-slate-400">
                    <Upload className="h-10 w-10 text-slate-500" />
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-xs text-sm font-bold transition-colors"
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
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep(8)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25"
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
                      ? 'border-[#0077cc] bg-sky-50 shadow-sm ring-2 ring-[#0077cc]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-xs'
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
                      ? 'border-[#0077cc] bg-sky-50 shadow-sm ring-2 ring-[#0077cc]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-xs'
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
                <div className="p-6 rounded-2xl bg-sky-50/90 border-2 border-sky-200 space-y-4 shadow-xs">
                  <div className="bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
                    <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      <strong>Admin Approval Gate:</strong> Exco accounts require administrator
                      approval before dashboard access is activated.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                      Exco Designation
                    </label>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value as WorkerRole)}
                      className="flex h-14 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-base font-semibold text-slate-900 shadow-xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0077cc]"
                    >
                      <option value="team_lead">Team Leader / Assistant Coordinator</option>
                      <option value="hall_rep">Hall Representative (Hostels)</option>
                      <option value="finance">Finance Team (Ledgers &amp; Accounts)</option>
                      <option value="admin">CSGB — Christian Students&apos; Governing Board (Admin)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="flex h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 pr-10 text-sm font-semibold text-slate-900 shadow-xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0077cc]"
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                        Repeat Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="flex h-12 w-full rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 shadow-xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0077cc]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(7)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={isExco && (password.length < 8 || password !== confirmPassword)}
                  onClick={() => setStep(9)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
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

              <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 space-y-3 shadow-sm text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Name:</span>
                  <span className="font-bold text-slate-900">{fullName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Phone:</span>
                  <span className="font-bold text-slate-900">{phoneNumber}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Operational Team{teams.length > 1 ? 's' : ''}:</span>
                  <span className="font-bold text-slate-900">{teams.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Hostel / Room:</span>
                  <span className="font-bold text-slate-900">
                    {hall}, {roomNumber}
                  </span>
                </div>
                {birthMonth && birthDay && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Birthday:</span>
                    <span className="font-bold text-slate-900">
                      {MONTHS.find((m) => m.value === birthMonth)?.label} {parseInt(birthDay, 10)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Exco Status:</span>
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
                  className="h-5 w-5 rounded border-slate-300 text-[#0077cc] focus:ring-[#0077cc] mt-0.5 cursor-pointer"
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
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  disabled={submitting || !ndprConsent || !turnstileToken}
                  onClick={handleFinalSubmit}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-4 sm:px-8 text-sm sm:text-base md:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="inline-flex items-center justify-center gap-2.5">
                      <Loader2 className="h-5 w-5 animate-spin shrink-0 aspect-square text-white" />
                      <span>Submitting Registration…</span>
                    </span>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Exco Portal Shortcut */}
      <div className="pt-4 text-center">
        <p className="text-sm text-slate-600">
          Already registered as an Exco member?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#0077cc] underline underline-offset-4 hover:text-[#005fa3] transition-colors"
          >
            Sign in to Exco Dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}
