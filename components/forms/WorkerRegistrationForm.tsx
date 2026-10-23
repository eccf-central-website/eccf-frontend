'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  UserCheck,
  ShieldCheck,
  User,
  RotateCcw,
  Loader2,
  Mail,
  Home,
  Users,
  ExternalLink,
  LogOut,
  BadgeCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { useClerk } from '@clerk/nextjs'
import {
  checkWorkerPhoneAndInitiateVerification,
  confirmWorkerSelfServiceLink,
  registerWorker,
  requestRegistrationEmailOtp,
  requestWorkerSelfServiceLink,
  verifyRegistrationEmailOtp,
  verifyWorkerOtp,
  uploadWorkerPhotoDirectAction,
  type SignedInWorkerSnapshot,
  type WorkerRegistrationResult,
} from '@/app/actions/worker-registration'
import { FELLOWSHIP_TEAMS } from '@/lib/dashboard/attendance-constants'
import { compressImage } from '@/lib/image-compression'
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
  if (month === 2) return 29
  return 31
}

function maskEmailDisplay(value?: string | null): string | null {
  if (!value || !value.includes('@')) return null
  const [local, domain] = value.split('@')
  if (!local || !domain) return null
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

function getInitials(name?: string | null): string {
  if (!name) return 'EC'
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export interface WorkerRegistrationFormProps {
  initialEmail?: string
  initialFirstName?: string
  initialLastName?: string
  clerkUserId?: string
  isClerkSignedIn?: boolean
  emailVerified?: boolean
  signedInWorker?: SignedInWorkerSnapshot
  signedInNeedsVerification?: boolean
}

export function WorkerRegistrationForm({
  initialEmail = '',
  initialFirstName = '',
  initialLastName = '',
  clerkUserId,
  isClerkSignedIn = false,
  emailVerified = false,
  signedInWorker,
  signedInNeedsVerification = false,
}: WorkerRegistrationFormProps) {
  const searchParams = useSearchParams()
  const selfServiceToken = searchParams?.get('selfServiceToken') || ''
  const { signOut } = useClerk()

  // Step & Flow State
  const [step, setStep] = useState(signedInWorker ? 2 : 1)
  const [isReturning, setIsReturning] = useState(Boolean(signedInWorker))
  const [isReturnerFlow, setIsReturnerFlow] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requestingUpdateLink, setRequestingUpdateLink] = useState(false)
  const [updateLinkMessage, setUpdateLinkMessage] = useState<string | null>(null)
  const [updateIdentifier, setUpdateIdentifier] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)
  const [signingOut, setSigningOut] = useState(false)

  // Existing Worker Detection & OTP Verification State
  const [checkingPhone, setCheckingPhone] = useState(false)
const [checkingEmail, setCheckingEmail] = useState(false)
  const [verificationPending, setVerificationPending] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState<string | null>(signedInWorker?.email ? maskEmailDisplay(signedInWorker.email) : null)
  const [profileFirstName, setProfileFirstName] = useState<string | null>(signedInWorker?.firstName || null)
  const [otpCode, setOtpCode] = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null)

  // First-time registration email ownership check
  const [registrationOtpSent, setRegistrationOtpSent] = useState(false)
  const [registrationOtp, setRegistrationOtp] = useState('')
  const [registrationEmailVerified, setRegistrationEmailVerified] = useState(false)
  const [registrationOtpNotice, setRegistrationOtpNotice] = useState<string | null>(null)
  const [registrationOtpError, setRegistrationOtpError] = useState<string | null>(null)
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false)
  const [emailOtpCooldown, setEmailOtpCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  useEffect(() => {
    if (emailOtpCooldown <= 0) return
    const timer = setInterval(() => {
      setEmailOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [emailOtpCooldown])

  // Form Fields
  const [phoneNumber, setPhoneNumber] = useState(signedInWorker?.phoneNumber || '')
  const [firstName, setFirstName] = useState(signedInWorker?.firstName || initialFirstName)
  const [middleName, setMiddleName] = useState(signedInWorker?.middleName || '')
  const [lastName, setLastName] = useState(signedInWorker?.lastName || initialLastName)
  const fullName = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' ')
  const [email, setEmail] = useState(signedInWorker?.email || initialEmail)
  const [teams, setTeams] = useState<string[]>(signedInWorker?.teams || [])

  const toggleTeam = (t: string) => {
    setTeams((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    )
  }

  const [hall, setHall] = useState(signedInWorker?.hall || '')
  const [roomNumber, setRoomNumber] = useState(signedInWorker?.roomNumber || '')
  const [birthMonth, setBirthMonth] = useState(
    signedInWorker?.birthMonth ? String(signedInWorker.birthMonth).padStart(2, '0') : ''
  )
  const [birthDay, setBirthDay] = useState(
    signedInWorker?.birthDay ? String(signedInWorker.birthDay).padStart(2, '0') : ''
  )
  const effectiveBirthDate =
    birthMonth && birthDay
      ? `${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
      : ''
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(signedInWorker?.profileImageUrl || null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [base64Image, setBase64Image] = useState<string | null>(null)

  // Executive Designation State (No passwords)

  // Privacy & Status
  const [ndprConsent, setNdprConsent] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<WorkerRegistrationResult | null>(null)
  const [isUploadingSuccessPhoto, setIsUploadingSuccessPhoto] = useState(false)
  const [successPhotoError, setSuccessPhotoError] = useState<string | null>(null)
  const successFileInputRef = useRef<HTMLInputElement>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTurnstileToken('')
  }, [step])

  // Auto-fill exec hall when hall changes

  // Auto-fill exec team when teams change

  useEffect(() => {
    if (!selfServiceToken) return
    let active = true

    void confirmWorkerSelfServiceLink(selfServiceToken).then((result) => {
      if (!active) return
      if (result.ok && result.purpose === 'profile' && result.worker) {
        const worker = result.worker
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
        setProfileFirstName(worker.firstName || worker.fullName.split(/\s+/)[0] || null)
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

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      // Return to the public form so the next person can register on this device.
      await signOut({ redirectUrl: '/register' })
    } catch {
      window.location.href = '/login'
    } finally {
      setSigningOut(false)
    }
  }

  const resetToNewRegistration = () => {
    setSuccessResult(null)
    setIsReturning(false)
    setIsReturnerFlow(false)
    setStep(1)
    setPhoneNumber('')
    setFirstName(initialFirstName)
    setMiddleName('')
    setLastName(initialLastName)
    setEmail(initialEmail)
    setTeams([])
    setHall('')
    setRoomNumber('')
    setBirthMonth('')
    setBirthDay('')
    setBase64Image(null)
    setImagePreview(null)
    setExistingPhotoUrl(null)
    setVerificationPending(false)
    setVerificationNotice(null)
    setProfileFirstName(null)
    setMaskedEmail(null)
    setOtpCode('')
    setResendCooldown(0)
    resetRegistrationEmailVerification()
    setError(null)
  }

  function resetRegistrationEmailVerification() {
    setRegistrationOtpSent(false)
    setRegistrationOtp('')
    setRegistrationEmailVerified(false)
    setRegistrationOtpNotice(null)
    setRegistrationOtpError(null)
    setEmailOtpCooldown(0)
  }

  // Total steps based on flow
  // Returning flow: Step 1 (Phone) -> Step 2 (Location) -> Step 3 (Photo) -> Step 4 (Confirm)
  // New worker flow: Step 1 (Phone) -> Step 2 (Name) -> Step 3 (Email) -> Step 4 (Team) -> Step 5 (Location) -> Step 6 (Birthday) -> Step 7 (Photo) -> Step 8 (Review)
  const totalSteps = isReturning ? 4 : 8

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

      if (!result.exists) {
        setIsReturning(false)
        resetRegistrationEmailVerification()
        setStep(2)
        return
      }

      // Existing worker detected -> OTP flow
      setVerificationPending(true)
      setMaskedEmail(result.maskedEmail || 'your registered email')
      setProfileFirstName(result.firstName || null)
      setVerificationNotice(
        result.message ||
          `A 6-digit verification code and secure unlock link have been sent to ${result.maskedEmail || 'your email'}.`
      )
      setResendCooldown(result.retryAfterSeconds ?? 60)
    } catch {
      setError('An unexpected error occurred while checking your phone number. Please try again.')
    } finally {
      setCheckingPhone(false)
      setTurnstileToken('')
      setTurnstileResetSignal((v) => v + 1)
    }
  }

  async function handleEmailNext() {
    setError(null)
    const clean = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Please enter a valid email address.')
      return
    }

    setCheckingEmail(true)
    try {
      const result = await requestWorkerSelfServiceLink({
        identifier: clean,
        purpose: 'profile',
        turnstileToken: turnstileToken || undefined,
      })

      if (result.maskedEmail) {
        setIsReturning(true)
        setPhoneNumber(result.phoneNumber || phoneNumber)
        setMaskedEmail(result.maskedEmail)
        setVerificationPending(true)
        setVerificationNotice(
          result.message ||
            `A 6-digit verification code and secure unlock link have been dispatched to ${result.maskedEmail}.`
        )
        setResendCooldown(60)
        setStep(1)
        return
      }

      setStep(4)
    } catch {
      setError('An unexpected error occurred while checking your email. Please try again.')
    } finally {
      setCheckingEmail(false)
      setTurnstileToken('')
      setTurnstileResetSignal((v) => v + 1)
    }
  }

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
      setProfileFirstName(worker.firstName || worker.fullName.split(/\s+/)[0] || null)
      setMaskedEmail(worker.email ? maskEmailDisplay(worker.email) : maskedEmail)

      setVerificationPending(false)
      setOtpCode('')
      setStep(2)
      setError(null)
    } catch {
      setError('An error occurred during verification. Please try again.')
    } finally {
      setVerifyingOtp(false)
    }
  }

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
      if (result.ok && result.exists) {
        setVerificationNotice(
          result.message || `A fresh 6-digit verification code was sent to ${result.maskedEmail || maskedEmail}. Check your inbox and spam folder.`
        )
        setMaskedEmail(result.maskedEmail || maskedEmail)
        setProfileFirstName(result.firstName || profileFirstName)
        setResendCooldown(result.retryAfterSeconds ?? 60)
      } else if (result.ok && !result.exists) {
        setError('No workforce profile matches that phone number anymore. Please use a different phone number.')
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

  function handleChangePhone() {
    setVerificationPending(false)
    setOtpCode('')
    setError(null)
    setVerificationNotice(null)
    setResendCooldown(0)
    setProfileFirstName(null)
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
        setProfileFirstName(result.firstName || null)
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

  // Construct Executive Application Input

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
        clerkUserId,
        ndprConsent,
        isExco: false,
      })

      if (registrationResult.requiresVerification) {
        try {
          const linkResult = await requestWorkerSelfServiceLink({
            identifier: email,
            purpose: 'profile',
            turnstileToken: turnstileToken || undefined,
          })
          if (linkResult.maskedEmail) {
            setIsReturning(true)
            setPhoneNumber(linkResult.phoneNumber || phoneNumber)
            setMaskedEmail(linkResult.maskedEmail)
            setProfileFirstName(linkResult.firstName || null)
            setVerificationPending(true)
            setVerificationNotice(
              linkResult.message ||
                'If a matching worker profile exists, a verification code and secure unlock link have been sent. Check your inbox and spam folder.'
            )
            setResendCooldown(60)
            setStep(1)
            return
          }
        } catch {
          // fall through to error below
        }
        setError(registrationResult.error || 'A worker record was found matching those contact details. Verify your email to update your profile.')
        return
      }

      if (registrationResult.ok) {
        let finalResult: WorkerRegistrationResult = {
          ...registrationResult,
          fullName: registrationResult.fullName || fullName,
          email: registrationResult.email || email,
          phoneNumber: registrationResult.phoneNumber || phoneNumber,
          hall: registrationResult.hall || hall,
          roomNumber: registrationResult.roomNumber || roomNumber,
          teams: registrationResult.teams || teams,
          profileImageUrl: existingPhotoUrl || undefined,
          photoUploaded: Boolean(existingPhotoUrl),
        }

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
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json()
              finalResult = {
                ...finalResult,
                profileImageUrl: uploadData.fileUrl || base64Image,
                photoUploaded: true,
              }
            } else {
              finalResult = {
                ...finalResult,
                photoUploaded: false,
              }
            }
          } catch {
            finalResult = {
              ...finalResult,
              photoUploaded: false,
            }
          }
        }
        toast.success(finalResult.message || 'Registration submitted successfully!')
        setSuccessResult(finalResult)
      } else {
        setError(registrationResult.error || 'Failed to submit registration. Please check your fields.')
        toast.error(registrationResult.error || 'Failed to submit registration. Please check your fields.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
      setTurnstileToken('')
      setTurnstileResetSignal((value) => value + 1)
    }
  }

  const handleSuccessPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !successResult?.workerId) return

    setIsUploadingSuccessPhoto(true)
    setSuccessPhotoError(null)

    try {
      const compressed = await compressImage(file)
      const res = await uploadWorkerPhotoDirectAction({
        workerId: successResult.workerId,
        base64Image: compressed.dataUrl,
      })

      if (res.ok && res.fileUrl) {
        setSuccessResult((prev) =>
          prev
            ? {
                ...prev,
                profileImageUrl: res.fileUrl,
                photoUploaded: true,
              }
            : null
        )
        toast.success('Portrait photo successfully uploaded!')
      } else {
        setSuccessPhotoError(res.error || 'Failed to upload photo. Please try again.')
      }
    } catch {
      setSuccessPhotoError('An error occurred while compressing or uploading your photo.')
    } finally {
      setIsUploadingSuccessPhoto(false)
    }
  }

  const slideVariants = {
    enter: { opacity: 0, x: 25 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -25 },
  }

  // Render Success Screen
  if (successResult?.ok) {
    const firstName = successResult.fullName?.trim().split(/\s+/)[0] || 'Worker'
    const hasPhoto = Boolean(successResult.profileImageUrl)
    const teamsList = successResult.teams && successResult.teams.length > 0 ? successResult.teams : teams
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6 py-4 animate-in fade-in duration-500">
        {/* Celebration Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 rounded-full bg-emerald-50 ring-8 ring-emerald-500/10 text-emerald-600 mb-1 shadow-xs">
            <CheckCircle2 className="h-10 w-10 shrink-0 stroke-[2.2]" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold tracking-wide font-mono uppercase">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
              {isReturning ? 'Profile Updated' : 'Registration Confirmed'}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-slate-950 font-bold tracking-tight">
              {isReturning ? `Welcome Back, ${firstName}!` : `Welcome to the Workforce, ${firstName}!`}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
              {isReturning
                ? 'Your workforce profile has been updated. Below is the current status of your teams and approvals.'
                : 'Your profile has been logged in the ECCF directory. Below is the breakdown of your application and verification status.'}
            </p>
            {successResult.message && (
              <div className="mx-auto max-w-lg mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-xs">
                {successResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Profile & Application Summary Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm space-y-6 text-left">
          {/* Identity & Avatar Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 shrink-0 shadow-xs flex items-center justify-center">
                {hasPhoto && successResult.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={successResult.profileImageUrl}
                    alt={successResult.fullName || 'Worker portrait'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 shrink-0 text-slate-400" />
                )}
                {hasPhoto && (
                  <span className="absolute bottom-1 right-1 h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-500 ring-2 ring-white" title="Photo Attached" />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">{successResult.fullName || fullName}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/80 text-[11px] font-semibold">
                    {isReturning ? 'Updated Member' : 'New Intake'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-mono flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>{successResult.email || email}</span>
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>{successResult.hall || hall} {successResult.roomNumber ? `• Room ${successResult.roomNumber}` : ''}</span>
                </p>
              </div>
            </div>

            {/* Photo upload status badge */}
            <div className="self-stretch sm:self-center">
              {hasPhoto ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Portrait Attached</span>
                </div>
              ) : (
                <div>
                  <input
                    ref={successFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSuccessPhotoUpload}
                  />
                  <button
                    type="button"
                    disabled={isUploadingSuccessPhoto}
                    onClick={() => successFileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all shadow-2xs"
                  >
                    {isUploadingSuccessPhoto ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                    )}
                    <span>{isUploadingSuccessPhoto ? 'Uploading...' : 'Attach Portrait Photo'}</span>
                  </button>
                  {successPhotoError && (
                    <p className="text-[11px] text-red-600 mt-1">{successPhotoError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Operational Team Memberships Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                <Users className="h-4 w-4 shrink-0 text-slate-400" />
                Operational Teams ({teamsList.length})
              </span>
              <span className="text-[11px] text-slate-400">Review by Team Leads</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {teamsList.map((tm, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-2"
                >
                  <div className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                    {tm}
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                    <Clock className="h-3 w-3 shrink-0 text-amber-600" />
                    Pending Verification
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Your Team Lead(s) will review and confirm your unit membership in their Exco attendance and workforce roster.
            </p>
          </div>

        </div>

        {/* Live Application Status Callout */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-indigo-500/10 border-2 border-sky-200/90 text-left space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#0077cc] text-white shrink-0">
                <ShieldCheck className="h-5 w-5 shrink-0" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950 text-sm sm:text-base">Track Verification &amp; Badges Live</h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Inspect real-time approval badges from your Team Lead and the Fellowship President.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/register/status"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#0077cc] hover:bg-[#005fa3] text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <span>Open My Application Status Portal</span>
              <ExternalLink className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex h-13 items-center justify-center rounded-2xl bg-slate-950 px-8 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-md"
          >
            Return to Homepage
          </Link>
          {isClerkSignedIn ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex h-13 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all disabled:opacity-60"
            >
              <LogOut className="h-4 w-4 shrink-0 mr-2" />
              {signingOut ? 'Signing out…' : 'Sign out to register another member'}
            </button>
          ) : (
            <button
              type="button"
              onClick={resetToNewRegistration}
              className="flex h-13 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
            >
              <RotateCcw className="h-4 w-4 shrink-0 mr-2" /> Register Another Member
            </button>
          )}
        </div>
      </div>
    )
  }

  const signedInDisplayName =
    signedInWorker?.fullName ||
    [initialFirstName, initialLastName].filter(Boolean).join(' ') ||
    initialEmail
  const signedInEmail = initialEmail || signedInWorker?.email || ''
  const signedInFirstName =
    signedInWorker?.firstName || initialFirstName || signedInDisplayName.split(/\s+/)[0]

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Signed-in account panel */}
      {isClerkSignedIn && (
        <div className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0077cc] via-sky-400 to-emerald-500" />
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl overflow-hidden border-2 border-white ring-2 ring-slate-200 bg-sky-50 flex items-center justify-center shadow-sm">
                  {signedInWorker?.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={signedInWorker.profileImageUrl}
                      alt={signedInDisplayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-mono text-sm sm:text-base font-bold text-[#0077cc]">
                      {getInitials(signedInDisplayName)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 font-mono">
                      Signed in with Clerk
                    </span>
                    {signedInWorker ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wide">
                        <BadgeCheck className="h-3 w-3 shrink-0" />
                        Profile linked
                      </span>
                    ) : signedInNeedsVerification ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wide">
                        <ShieldCheck className="h-3 w-3 shrink-0" />
                        One more check
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold uppercase tracking-wide">
                        New registration
                      </span>
                    )}
                  </div>

                  {signedInWorker ? (
                    <>
                      <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
                        Welcome back, {signedInFirstName}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Your workforce record is already on file. You are here to refresh it — no new
                        registration will be created.
                      </p>
                    </>
                  ) : signedInNeedsVerification ? (
                    <>
                      <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
                        We found a profile for this email
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        It is linked to a different sign-in method. Use “Already registered as a
                        worker?” below to confirm with a one-time email code.
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
                        You&apos;re signed in, {signedInFirstName}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        No workforce profile is linked to this account yet. Complete the short form once
                        and it will stay linked to this sign-in.
                      </p>
                    </>
                  )}

                  <p className="text-[11px] sm:text-xs text-slate-500 font-mono break-all">
                    {signedInEmail}
                    {emailVerified ? ' · verified email' : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-col items-stretch sm:items-end gap-2 shrink-0">
                {signedInWorker && (
                  <Link
                    href="/register/status"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    My status
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            </div>

            {signedInWorker && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 px-3.5 py-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#0077cc] mt-0.5" />
                <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                  Clerk has already confirmed this sign-in, so no second code is required to open your
                  own profile. Contact-detail changes still need an administrator.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Progress Bar Header */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold tracking-wider uppercase text-slate-600 font-mono">
          <span className="text-[#0077cc]">
            {signedInWorker ? 'Profile Refresh' : isReturning ? 'Returning Worker Refresh' : 'New Worker Intake'}
          </span>
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
        {((isReturning && step === 4) || (!isReturning && step === 8)) && (
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
          {/* STEP 1: Phone Number Gateway or OTP Verification                          */}
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
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>SECURITY VERIFICATION</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-slate-950 font-bold tracking-tight">
                    {profileFirstName ? `Welcome back, ${profileFirstName}` : 'Enter Verification Code'}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    We found your workforce profile on file. For your privacy, personal details stay
                    locked until you confirm this request with the code below.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/80 border border-sky-200/90 flex items-start gap-3.5">
                  <Mail className="h-5 w-5 text-[#0077cc] shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-700 leading-relaxed">
                    <p>
                      We sent a <strong>6-digit security code</strong> and a <strong>direct unlock link</strong> to the
                      email on file:
                    </p>
                    <p className="font-mono font-bold text-slate-950 text-base mt-1">{maskedEmail}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Not seeing it? Check your spam or promotions folder before requesting another code.
                    </p>
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
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> Verifying Code...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Verify &amp; Open My Profile <ArrowRight className="h-5 w-5 shrink-0" />
                      </span>
                    )}
                  </button>
                </form>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-semibold text-slate-700">
                    Complete the security check to resend your code:
                  </p>
                  <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileResetSignal} />
                </div>

                <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || checkingPhone || !turnstileToken}
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
              <>
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
                    {isClerkSignedIn ? 'Link Your Workforce Profile' : 'Worker Registration'}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-slate-950 font-bold tracking-tight">
                    {isClerkSignedIn ? 'Confirm your phone number' : 'Start with your phone number'}
                  </h2>
                  {isClerkSignedIn && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      We&apos;ll check whether a workforce record already exists before creating a new one
                      for <strong className="font-mono text-slate-800">{initialEmail}</strong>.
                    </p>
                  )}
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

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-xs font-semibold text-slate-700">
                      Complete the security check to look up your number:
                    </p>
                    <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileResetSignal} />
                  </div>

                  <button
                    type="submit"
                    disabled={phoneNumber.trim().length < 8 || checkingPhone || !turnstileToken}
                    className="flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-4 sm:px-8 text-sm sm:text-base md:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]"
                  >
                    {checkingPhone ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> Checking Records...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Continue <ArrowRight className="h-5 w-5 shrink-0" />
                      </span>
                    )}
                  </button>
                </form>

                {!signedInWorker && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsReturnerFlow(true)
                      setError(null)
                      setUpdateIdentifier('')
                      setUpdateLinkMessage(null)
                    }}
                    className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:border-[#0077cc] hover:text-[#0077cc] hover:bg-slate-50 transition-all"
                  >
                    <ArrowRight className="h-4 w-4 shrink-0" />
                    <span>Already registered as a worker?</span>
                  </button>
                )}
                </motion.div>

                {isReturnerFlow && (
                  <motion.div
                    key="step-1-returner"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.28 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc]">
                        Worker Profile Recovery
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-slate-950 font-bold tracking-tight">
                        Update Your Worker Profile
                      </h2>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Enter your registered email or phone number to receive a secure profile unlock link.
                      </p>
                    </div>

                    <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                      <div className="space-y-3">
                        <label htmlFor="returner-identifier" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Registered Email or Phone Number
                        </label>
                        <input
                          id="returner-identifier"
                          type="text"
                          autoComplete="username"
                          autoFocus
                          value={updateIdentifier}
                          onChange={(event) => setUpdateIdentifier(event.target.value)}
                          placeholder="name@example.com or 0801 234 5678"
                          aria-label="Email or phone number on your worker profile"
                          className="flex h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-6 text-xl font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                        />
                      </div>

                      {Boolean(updateIdentifier.trim()) && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="mb-3 text-xs font-semibold text-slate-700">
                            Complete the security check to receive your link:
                          </p>
                          <TurnstileWidget onToken={setTurnstileToken} resetSignal={turnstileResetSignal} />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleRequestUpdateLink}
                        disabled={requestingUpdateLink || !updateIdentifier.trim() || !turnstileToken}
                        className="flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]"
                      >
                        {requestingUpdateLink ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> Sending secure code…
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            Email me a profile update code & link <ArrowRight className="h-5 w-5 shrink-0" />
                          </span>
                        )}
                      </button>

                      {updateLinkMessage && (
                        <p role="status" aria-live="polite" className="text-xs text-slate-700 rounded-lg bg-slate-100 p-3">
                          {updateLinkMessage}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 pt-6">
                      <button
                        type="button"
                        onClick={() => setIsReturnerFlow(false)}
                        className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                        aria-label="Register as a new worker instead"
                      >
                        <ArrowLeft className="h-6 w-6 shrink-0" />
                      </button>
                      <p className="text-sm text-slate-600">
                        New to the workforce?{' '}
                        <span
                          onClick={() => setIsReturnerFlow(false)}
                          className="font-semibold text-[#0077cc] underline underline-offset-4 hover:text-[#005fa3] cursor-pointer transition-colors"
                        >
                          Register as a new worker instead
                        </span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </>
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
                    <input
                      type="tel"
                      value={phoneNumber || 'Not available — ask an admin'}
                      readOnly
                      className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
                    />
                  </label>
                </div>
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
                              {isSelected && <Check className="h-3 w-3 shrink-0 stroke-[3]" />}
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
                {signedInWorker ? (
                  <Link
                    href="/register/status"
                    aria-label="Cancel and view my status"
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                  >
                    <ArrowLeft className="h-6 w-6 shrink-0" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    aria-label="Back to phone verification"
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                  >
                    <ArrowLeft className="h-6 w-6 shrink-0" />
                  </button>
                )}
                <button
                  type="button"
                  disabled={!hall || !roomNumber || teams.length === 0}
                  onClick={() => setStep(3)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Next Step <ArrowRight className="h-5 w-5 shrink-0 ml-2" />
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
                  Keep your existing photo on file or upload a fresh celebratory picture.
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
                    <Upload className="h-10 w-10 shrink-0 text-slate-500" />
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {imagePreview
                      ? 'New photo selected!'
                      : existingPhotoUrl
                        ? 'Current photo on file.'
                        : 'No photo currently on file.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-xs text-xs sm:text-sm font-bold transition-colors"
                  >
                    <Upload className="h-4 w-4 shrink-0" />
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
                  <ArrowLeft className="h-6 w-6 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25"
                >
                  Review &amp; Confirm <ArrowRight className="h-5 w-5 shrink-0 ml-2" />
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
                  Ready to save profile updates?
                </h2>
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
                  <span className="text-slate-500 font-medium">Residence:</span>
                  <span className="font-bold text-[#0077cc] text-base">
                    {hall}, Room {roomNumber}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6 shrink-0" />
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
          {/* NEW WORKER FLOW (Steps 2 through 8)                                       */}
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
                  <ArrowLeft className="h-6 w-6 shrink-0" />
                </button>
                <button
                  type="button"
                  disabled={firstName.trim().length < 2 || lastName.trim().length < 2}
                  onClick={() => setStep(3)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Next Step <ArrowRight className="h-5 w-5 shrink-0 ml-2" />
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
                  Used for official correspondence and Clerk authentication.
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
                  <ArrowLeft className="h-6 w-6 shrink-0" />
                </button>
                <button
                  type="button"
                  disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || checkingEmail}
                  onClick={handleEmailNext}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  {checkingEmail ? 'Checking...' : 'Next Step'} <ArrowRight className="h-5 w-5 shrink-0 ml-2" />
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
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0 stroke-[3]" />}
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
                  <ArrowLeft className="h-6 w-6 shrink-0" />
                </button>
                <button
                  type="button"
                  disabled={teams.length === 0}
                  onClick={() => setStep(5)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Next Step <ArrowRight className="h-5 w-5 shrink-0 ml-2" />
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
                  <ArrowLeft className="h-6 w-6 shrink-0" />
                </button>
                <button
                  type="button"
                  disabled={!hall || !roomNumber}
                  onClick={() => setStep(6)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Next Step <ArrowRight className="h-5 w-5 shrink-0 ml-2" />
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
                  So we can celebrate with you on your special day!
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
                  <ArrowLeft className="h-6 w-6 shrink-0" />
                </button>
                <button
                  type="button"
                  disabled={!birthMonth || !birthDay}
                  onClick={() => setStep(7)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  Next Step <ArrowRight className="h-5 w-5 shrink-0 ml-2" />
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
                    className="mx-auto h-32 w-32 shrink-0 rounded-3xl object-cover border-2 border-slate-200 shadow-md"
                  />
                ) : (
                  <div className="mx-auto flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-slate-100 border border-slate-200 text-slate-400">
                    <Upload className="h-10 w-10 shrink-0 text-slate-500" />
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-xs text-sm font-bold transition-colors"
                  >
                    <Upload className="h-4 w-4 shrink-0" />
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
                  <ArrowLeft className="h-6 w-6 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep(8)}
                  className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25"
                >
                  Next Step <ArrowRight className="h-5 w-5 shrink-0 ml-2" />
                </button>
              </div>
            </motion.div>
          )}


          {/* ========================================================================= */}
          {/* STEP 8: Final Review & Confirmation                                       */}
          {/* ========================================================================= */}
          {!isReturning && step === 8 && (
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
                  Step 8 of {totalSteps}
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
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="font-bold text-slate-900">{email}</span>
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
                  <span className="text-slate-500 font-medium">Designation:</span>
                   <span className="font-bold text-[#0077cc]">
                     Volunteer Worker (Pending Lead Verification)
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
                  className="h-5 w-5 shrink-0 rounded border-slate-300 text-[#0077cc] focus:ring-[#0077cc] mt-0.5 cursor-pointer"
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
                  onClick={() => setStep(7)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6 shrink-0" />
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

      {/* Footer shortcut to status page */}
      <div className="pt-4 text-center">
        <p className="text-sm text-slate-600">
          Already registered?{' '}
          <Link
            href="/register/status"
            className="font-semibold text-[#0077cc] underline underline-offset-4 hover:text-[#005fa3] transition-colors"
          >
            Check your Application &amp; Approval Status
          </Link>
        </p>
      </div>
    </div>
  )
}
