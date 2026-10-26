'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useClerk } from '@clerk/nextjs';
import {
  checkWorkerPhoneAndInitiateVerification,
  clearPendingWorkerChallenge,
  confirmWorkerSelfServiceLink,
  registerWorker,
  requestRegistrationEmailOtp,
  requestWorkerSelfServiceLink,
  verifyRegistrationEmailOtp,
  verifyWorkerOtp,
  uploadWorkerPhotoDirectAction,
  type PendingWorkerOtpChallenge,
  type SignedInWorkerSnapshot,
  type WorkerRegistrationResult,
} from '@/app/actions/worker-registration';
import {
  FALLBACK_TEAM_UNIT_OPTIONS,
  type TeamUnitOption,
} from '@/lib/dashboard/attendance-constants';
import { compressImage } from '@/lib/image-compression';
import TurnstileWidget from '@/components/forms/TurnstileWidget';

const HALLS_OF_RESIDENCE = [
  'Hall 1',
  'Hall 2',
  'Hall 3',
  'Hall 4',
  'Hall 5',
  'Hall 6',
  'Hall 7',
  'Hall 8',
];

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
];

function getDaysInMonth(monthStr: string): number {
  const month = parseInt(monthStr, 10);
  if ([4, 6, 9, 11].includes(month)) return 30;
  if (month === 2) return 29;
  return 31;
}

function maskEmailDisplay(value?: string | null): string | null {
  if (!value || !value.includes('@')) return null;
  const [local, domain] = value.split('@');
  if (!local || !domain) return null;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function getInitials(name?: string | null): string {
  if (!name) return 'EC';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export interface WorkerRegistrationFormProps {
  initialEmail?: string;
  initialFirstName?: string;
  initialLastName?: string;
  clerkUserId?: string;
  isClerkSignedIn?: boolean;
  emailVerified?: boolean;
  signedInWorker?: SignedInWorkerSnapshot;
  signedInNeedsVerification?: boolean;
  /** Published teams from Sanity. Falls back to the static list when omitted. */
  teamOptions?: TeamUnitOption[];
  hallOptions?: string[];
  selfServiceToken?: string;
  initialPendingChallenge?: PendingWorkerOtpChallenge;
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
  teamOptions,
  hallOptions,
  selfServiceToken: propSelfServiceToken = '',
  initialPendingChallenge,
}: WorkerRegistrationFormProps) {
  const [selfServiceToken] = useState(
    () =>
      propSelfServiceToken ||
      (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('selfServiceToken') || ''
        : '')
  );
  const { signOut } = useClerk();

  const resolvedHallOptions =
    hallOptions && hallOptions.length > 0
      ? hallOptions
      : HALLS_OF_RESIDENCE;

  const resolvedTeamOptions =
    teamOptions && teamOptions.length > 0
      ? teamOptions
      : FALLBACK_TEAM_UNIT_OPTIONS;
  const availableTeamNames = resolvedTeamOptions.map((option) => option.name);

  // Step & Flow State
  const [step, setStep] = useState(signedInWorker ? 2 : 1);
  const [isReturning, setIsReturning] = useState(Boolean(signedInWorker));
  const [isReturnerFlow, setIsReturnerFlow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestingUpdateLink, setRequestingUpdateLink] = useState(false);
  const [updateLinkMessage, setUpdateLinkMessage] = useState<string | null>(
    null,
  );
  const [updateIdentifier, setUpdateIdentifier] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const [isHumanVerified, setIsHumanVerified] = useState(
    () => isClerkSignedIn || Boolean(initialPendingChallenge?.hasChallenge),
  );
  const [signingOut, setSigningOut] = useState(false);

  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
    if (token) setIsHumanVerified(true);
  }, []);

  // Existing Worker Detection & OTP Verification State
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [verificationPending, setVerificationPending] = useState(
    () => Boolean(initialPendingChallenge?.hasChallenge),
  );
  const [maskedEmail, setMaskedEmail] = useState<string | null>(
    () =>
      initialPendingChallenge?.maskedEmail ||
      (signedInWorker?.email ? maskEmailDisplay(signedInWorker.email) : null),
  );
  const [profileFirstName, setProfileFirstName] = useState<string | null>(
    () =>
      initialPendingChallenge?.firstName ||
      signedInWorker?.firstName ||
      null,
  );
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(
    () =>
      initialPendingChallenge?.hasChallenge
        ? `A 6-digit verification code was sent to ${initialPendingChallenge.maskedEmail || 'your email'}. Check your inbox and spam folder.`
        : null,
  );

  // First-time registration email ownership check
  const [registrationOtpSent, setRegistrationOtpSent] = useState(false);
  const [registrationOtp, setRegistrationOtp] = useState('');
  const [registrationEmailVerified, setRegistrationEmailVerified] =
    useState(false);
  const [registrationVerifiedEmail, setRegistrationVerifiedEmail] = useState<
    string | null
  >(null);
  const [registrationOtpNotice, setRegistrationOtpNotice] = useState<
    string | null
  >(null);
  const [registrationOtpError, setRegistrationOtpError] = useState<
    string | null
  >(null);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [emailOtpCooldown, setEmailOtpCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (emailOtpCooldown <= 0) return;
    const timer = setInterval(() => {
      setEmailOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailOtpCooldown]);

  // Form Fields
  const [phoneNumber, setPhoneNumber] = useState(
    () => initialPendingChallenge?.phone || signedInWorker?.phoneNumber || '',
  );
  const [firstName, setFirstName] = useState(
    signedInWorker?.firstName || initialFirstName,
  );
  const [middleName, setMiddleName] = useState(
    signedInWorker?.middleName || '',
  );
  const [lastName, setLastName] = useState(
    signedInWorker?.lastName || initialLastName,
  );
  const fullName = [firstName.trim(), middleName.trim(), lastName.trim()]
    .filter(Boolean)
    .join(' ');
  const [email, setEmail] = useState(signedInWorker?.email || initialEmail);
  const [teams, setTeams] = useState<string[]>(() => {
    const raw = signedInWorker?.teams || [];
    return raw.map((t) => {
      const found = availableTeamNames.find((a) => a.toLowerCase() === t.toLowerCase());
      return found || t;
    });
  });

  const toggleTeam = (t: string) => {
    setTeams((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t],
    );
  };

  const [hall, setHall] = useState(signedInWorker?.hall || '');
  const [roomNumber, setRoomNumber] = useState(
    signedInWorker?.roomNumber || '',
  );
  const [birthMonth, setBirthMonth] = useState(
    signedInWorker?.birthMonth
      ? String(signedInWorker.birthMonth).padStart(2, '0')
      : '',
  );
  const [birthDay, setBirthDay] = useState(
    signedInWorker?.birthDay
      ? String(signedInWorker.birthDay).padStart(2, '0')
      : '',
  );
  const effectiveBirthDate =
    birthMonth && birthDay
      ? `${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
      : '';
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(
    signedInWorker?.profileImageUrl || null,
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  // Executive Designation State (No passwords)

  // Privacy & Status
  const [ndprConsent, setNdprConsent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] =
    useState<WorkerRegistrationResult | null>(null);
  const [isUploadingSuccessPhoto, setIsUploadingSuccessPhoto] = useState(false);
  const [successPhotoError, setSuccessPhotoError] = useState<string | null>(
    null,
  );
  const successFileInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore in-progress registration draft if the component mounts or network refreshes
  useEffect(() => {
    if (typeof window === 'undefined' || signedInWorker || propSelfServiceToken) return;
    try {
      const raw = sessionStorage.getItem('eccf_worker_reg_draft_v1');
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft && typeof draft === 'object') {
        if (typeof draft.step === 'number' && draft.step >= 1 && draft.step <= 8) setStep(draft.step);
        if (typeof draft.phoneNumber === 'string') setPhoneNumber(draft.phoneNumber);
        if (typeof draft.verificationPending === 'boolean') {
          setVerificationPending(draft.verificationPending);
          if (draft.verificationPending) {
            setIsHumanVerified(true);
          }
        }
        if (typeof draft.maskedEmail === 'string') setMaskedEmail(draft.maskedEmail);
        if (typeof draft.profileFirstName === 'string') setProfileFirstName(draft.profileFirstName);
        if (typeof draft.firstName === 'string') setFirstName(draft.firstName);
        if (typeof draft.middleName === 'string') setMiddleName(draft.middleName);
        if (typeof draft.lastName === 'string') setLastName(draft.lastName);
        if (typeof draft.email === 'string') setEmail(draft.email);
        if (typeof draft.registrationOtpSent === 'boolean') setRegistrationOtpSent(draft.registrationOtpSent);
        if (typeof draft.registrationEmailVerified === 'boolean') setRegistrationEmailVerified(draft.registrationEmailVerified);
        if (typeof draft.registrationVerifiedEmail === 'string') setRegistrationVerifiedEmail(draft.registrationVerifiedEmail);
        if (Array.isArray(draft.teams)) setTeams(draft.teams);
        if (typeof draft.hall === 'string') setHall(draft.hall);
        if (typeof draft.roomNumber === 'string') setRoomNumber(draft.roomNumber);
        if (typeof draft.birthMonth === 'string') setBirthMonth(draft.birthMonth);
        if (typeof draft.birthDay === 'string') setBirthDay(draft.birthDay);
      }
    } catch {
      // ignore
    }
  }, [signedInWorker, propSelfServiceToken]);

  // Auto-save registration progress to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined' || signedInWorker || isReturning) return;
    try {
      sessionStorage.setItem(
        'eccf_worker_reg_draft_v1',
        JSON.stringify({
          step,
          phoneNumber,
          verificationPending,
          maskedEmail,
          profileFirstName,
          firstName,
          middleName,
          lastName,
          email,
          registrationOtpSent,
          registrationEmailVerified,
          registrationVerifiedEmail,
          teams,
          hall,
          roomNumber,
          birthMonth,
          birthDay,
        })
      );
    } catch {
      // ignore
    }
  }, [
    step,
    phoneNumber,
    verificationPending,
    maskedEmail,
    profileFirstName,
    firstName,
    middleName,
    lastName,
    email,
    registrationOtpSent,
    registrationEmailVerified,
    registrationVerifiedEmail,
    teams,
    hall,
    roomNumber,
    birthMonth,
    birthDay,
    signedInWorker,
    isReturning,
  ]);

  // Retain verified security status across registration steps

  // Auto-fill exec hall when hall changes

  // Auto-fill exec team when teams change

  useEffect(() => {
    if (!selfServiceToken) return;
    let active = true;

    void confirmWorkerSelfServiceLink(selfServiceToken)
      .then((result) => {
        if (!active) return;
        if (result.ok && result.purpose === 'profile' && result.worker) {
          const worker = result.worker;
          setIsReturning(true);
          setPhoneNumber(worker.phoneNumber || '');
          setFirstName(
            worker.firstName || worker.fullName.split(/\s+/)[0] || '',
          );
          setMiddleName(worker.middleName || '');
          setLastName(worker.lastName || '');
          setEmail(worker.email || '');
          const matchedA = (worker.teams || []).map((t) => {
            const found = availableTeamNames.find((a) => a.toLowerCase() === t.toLowerCase());
            return found || t;
          });
          setTeams(matchedA);
          setHall(worker.hall || '');
          setRoomNumber(worker.roomNumber || '');
          setBirthMonth(
            worker.birthMonth ? String(worker.birthMonth).padStart(2, '0') : '',
          );
          setBirthDay(
            worker.birthDay ? String(worker.birthDay).padStart(2, '0') : '',
          );
          setExistingPhotoUrl(worker.profileImageUrl || null);
          setProfileFirstName(
            worker.firstName || worker.fullName.split(/\s+/)[0] || null,
          );
          setStep(2);
          setError(null);
        } else {
          setError(
            result.error ||
              'This secure link is invalid or has expired. Request a new one.',
          );
        }

        const url = new URL(window.location.href);
        url.searchParams.delete('selfServiceToken');
        window.history.replaceState(
          {},
          '',
          `${url.pathname}${url.search}${url.hash}`,
        );
      })
      .catch(() => {
        if (active)
          setError(
            'This secure link is invalid or has expired. Request a new one.',
          );
      });

    return () => {
      active = false;
    };
  }, [selfServiceToken, availableTeamNames]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      // Return to the public form so the next person can register on this device.
      await signOut({ redirectUrl: '/register' });
    } catch {
      window.location.href = '/login';
    } finally {
      setSigningOut(false);
    }
  };

  const resetToNewRegistration = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('eccf_worker_reg_draft_v1');
      } catch {
        // ignore
      }
    }
    void clearPendingWorkerChallenge();
    setSuccessResult(null);
    setIsReturning(false);
    setIsReturnerFlow(false);
    setStep(1);
    setPhoneNumber('');
    setFirstName(initialFirstName);
    setMiddleName('');
    setLastName(initialLastName);
    setEmail(initialEmail);
    setTeams([]);
    setHall('');
    setRoomNumber('');
    setBirthMonth('');
    setBirthDay('');
    setBase64Image(null);
    setImagePreview(null);
    setExistingPhotoUrl(null);
    setVerificationPending(false);
    setVerificationNotice(null);
    setProfileFirstName(null);
    setMaskedEmail(null);
    setOtpCode('');
    setResendCooldown(0);
    resetRegistrationEmailVerification();
    setError(null);
  };

  function resetRegistrationEmailVerification() {
    setRegistrationOtpSent(false);
    setRegistrationOtp('');
    setRegistrationEmailVerified(false);
    setRegistrationVerifiedEmail(null);
    setRegistrationOtpNotice(null);
    setRegistrationOtpError(null);
    setEmailOtpCooldown(0);
  }

  // Total steps based on flow
  // Returning flow: Step 1 (Phone) -> Step 2 (Location) -> Step 3 (Photo) -> Step 4 (Confirm)
  // New worker flow: Step 1 (Phone) -> Step 2 (Name) -> Step 3 (Email) -> Step 4 (Team) -> Step 5 (Location) -> Step 6 (Birthday) -> Step 7 (Photo) -> Step 8 (Review)
  const totalSteps = isReturning ? 4 : 8;

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    try {
      const compressed = await compressImage(
        file,
        { maxWidth: 1200, maxHeight: 1200, quality: 0.82 },
        { fullName, team: teams[0] || 'General' },
      );
      setImagePreview(compressed.dataUrl);
      setBase64Image(compressed.base64);
      setError(null);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        setImagePreview(res);
        const rawBase64 = res.split(',')[1] || res;
        setBase64Image(rawBase64);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }

  // Phone submit: checks if worker already exists; sends OTP/magic link if existing
  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (checkingPhone) return;
    setError(null);
    setVerificationNotice(null);

    const clean = phoneNumber.trim().replace(/\s+/g, '');
    if (clean.length < 8) {
      setError('Please enter a valid phone number (at least 8 digits).');
      return;
    }

    if (!isClerkSignedIn && !isHumanVerified && !turnstileToken && process.env.NODE_ENV === 'production') {
      setError('Please complete the security check before continuing.');
      return;
    }

    setCheckingPhone(true);
    try {
      const result = await checkWorkerPhoneAndInitiateVerification({
        phoneNumber: clean,
        turnstileToken: turnstileToken || undefined,
      });

      if (!result.ok) {
        if (result.error?.toLowerCase().includes('security') || result.error?.toLowerCase().includes('verification')) {
          setTurnstileToken('');
          setIsHumanVerified(false);
          setTurnstileResetSignal((v) => v + 1);
        }
        setError(
          result.error || 'Unable to check phone number. Please try again.',
        );
        return;
      }

      if (!result.exists) {
        setIsReturning(false);
        resetRegistrationEmailVerification();
        setStep(2);
        return;
      }

      // Existing worker detected -> OTP flow
      setVerificationPending(true);
      setMaskedEmail(result.maskedEmail || 'your registered email');
      setProfileFirstName(result.firstName || null);
      setVerificationNotice(null);
      setResendCooldown(result.retryAfterSeconds ?? 60);

      // Immediately write challenge to sessionStorage so any router refresh retains the OTP screen
      if (typeof window !== 'undefined') {
        try {
          const raw = sessionStorage.getItem('eccf_worker_reg_draft_v1');
          const draft = raw ? JSON.parse(raw) : {};
          delete draft.verificationNotice;
          sessionStorage.setItem(
            'eccf_worker_reg_draft_v1',
            JSON.stringify({
              ...draft,
              step: 1,
              phoneNumber: clean,
              verificationPending: true,
              maskedEmail: result.maskedEmail || 'your registered email',
              profileFirstName: result.firstName || null,
            }),
          );
        } catch {
          // ignore
        }
      }
    } catch {
      setError(
        'An unexpected error occurred while checking your phone number. Please try again.',
      );
    } finally {
      setCheckingPhone(false);
    }
  }

  async function handleEmailNext() {
    setError(null);
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Already proven for this exact address — skip straight to teams.
    if (
      registrationEmailVerified &&
      registrationVerifiedEmail === clean.trim().toLowerCase()
    ) {
      setStep(4);
      return;
    }

    setCheckingEmail(true);
    setRegistrationOtpError(null);
    setRegistrationOtpNotice(null);
    try {
      const result = await requestRegistrationEmailOtp({
        email: clean,
        firstName,
      });

      if (!result.ok) {
        setError(
          result.error ||
            'Unable to send the confirmation code. Please try again.',
        );
        return;
      }

      setRegistrationOtpSent(true);
      setRegistrationOtp('');
      setRegistrationOtpNotice(null);
      setEmailOtpCooldown(result.retryAfterSeconds ?? 60);
    } catch {
      setError(
        'An unexpected error occurred while sending the confirmation code. Please try again.',
      );
    } finally {
      setCheckingEmail(false);
    }
  }

  async function handleVerifyRegistrationEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanOtp = registrationOtp.trim().replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleanOtp)) {
      setRegistrationOtpError(
        'Enter the 6-digit confirmation code sent to your email.',
      );
      return;
    }

    setVerifyingEmailOtp(true);
    try {
      const result = await verifyRegistrationEmailOtp({
        email: cleanEmail,
        otp: cleanOtp,
      });

      if (!result.ok) {
        setRegistrationOtpError(
          result.error || 'That code is not correct. Please try again.',
        );
        return;
      }

      setRegistrationOtp('');
      setRegistrationEmailVerified(true);
      setRegistrationVerifiedEmail(cleanEmail.toLowerCase());
      setRegistrationOtpNotice(null);
      setRegistrationOtpError(null);
      setStep(4);
      setError(null);
    } catch {
      setRegistrationOtpError(
        'Unable to verify the confirmation code. Please try again.',
      );
    } finally {
      setVerifyingEmailOtp(false);
    }
  }

  async function handleResendRegistrationOtp() {
    if (emailOtpCooldown > 0) return;
    setError(null);
    setRegistrationOtpNotice(null);
    setRegistrationOtpError(null);
    setCheckingEmail(true);
    try {
      const result = await requestRegistrationEmailOtp({
        email: email.trim(),
        firstName,
      });

      if (!result.ok) {
        setRegistrationOtpError(
          result.error ||
            'Failed to resend the confirmation code. Please try again.',
        );
        return;
      }

      setRegistrationOtp('');
      setRegistrationOtpNotice(
        result.message ||
          `A fresh 6-digit confirmation code was sent to ${maskEmailDisplay(email) || email}. Check your inbox and spam folder.`,
      );
      setEmailOtpCooldown(result.retryAfterSeconds ?? 60);
    } catch {
      setRegistrationOtpError(
        'Could not resend the confirmation code. Please try again.',
      );
    } finally {
      setCheckingEmail(false);
    }
  }

  function handleEmailChange(value: string) {
    const prevClean = email.trim().toLowerCase();
    const nextClean = value.trim().toLowerCase();
    setEmail(value);
    if (
      prevClean &&
      nextClean &&
      prevClean !== nextClean &&
      (registrationVerifiedEmail || registrationOtpSent)
    ) {
      // The proof only applies to the confirmed address; a different address
      // must be verified again before it can be used.
      resetRegistrationEmailVerification();
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const clean = otpCode.trim().replace(/\s+/g, '');
    if (clean.length !== 6 || !/^\d{6}$/.test(clean)) {
      setError(
        'Please enter the 6-digit verification code sent to your email.',
      );
      return;
    }

    setVerifyingOtp(true);
    try {
      const result = await verifyWorkerOtp({
        phoneNumber,
        otp: clean,
      });

      if (!result.ok || !result.worker) {
        setError(
          result.error ||
            'Invalid or expired verification code. Please check your email or request a new code.',
        );
        return;
      }

      const worker = result.worker;
      setIsReturning(true);
      setPhoneNumber(worker.phoneNumber || phoneNumber);
      setFirstName(worker.firstName || worker.fullName.split(/\s+/)[0] || '');
      setMiddleName(worker.middleName || '');
      setLastName(worker.lastName || '');
      setEmail(worker.email || '');
      const matchedB = (worker.teams || []).map((t) => {
        const found = availableTeamNames.find((a) => a.toLowerCase() === t.toLowerCase());
        return found || t;
      });
      setTeams(matchedB);
      setHall(worker.hall || '');
      setRoomNumber(worker.roomNumber || '');
      setBirthMonth(
        worker.birthMonth ? String(worker.birthMonth).padStart(2, '0') : '',
      );
      setBirthDay(
        worker.birthDay ? String(worker.birthDay).padStart(2, '0') : '',
      );
      setExistingPhotoUrl(worker.profileImageUrl || null);
      setProfileFirstName(
        worker.firstName || worker.fullName.split(/\s+/)[0] || null,
      );
      setMaskedEmail(
        worker.email ? maskEmailDisplay(worker.email) : maskedEmail,
      );

      setVerificationPending(false);
      setOtpCode('');
      setStep(2);
      setError(null);
      if (typeof window !== 'undefined') {
        try {
          const raw = sessionStorage.getItem('eccf_worker_reg_draft_v1');
          if (raw) {
            const draft = JSON.parse(raw);
            delete draft.verificationPending;
            delete draft.maskedEmail;
            delete draft.profileFirstName;
            delete draft.verificationNotice;
            draft.step = 2;
            sessionStorage.setItem('eccf_worker_reg_draft_v1', JSON.stringify(draft));
          }
        } catch {
          // ignore
        }
      }
    } catch {
      setError('An error occurred during verification. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return;
    setError(null);
    setVerificationNotice(null);
    setCheckingPhone(true);
    try {
      const result = await checkWorkerPhoneAndInitiateVerification({
        phoneNumber,
        turnstileToken: turnstileToken || undefined,
      });
      if (result.ok && result.exists) {
        setVerificationNotice(
          `A fresh 6-digit verification code has been sent to ${result.maskedEmail || maskedEmail}.`,
        );
        setMaskedEmail(result.maskedEmail || maskedEmail);
        setProfileFirstName(result.firstName || profileFirstName);
        setResendCooldown(result.retryAfterSeconds ?? 60);
      } else if (result.ok && !result.exists) {
        setError(
          'No workforce profile matches that phone number anymore. Please use a different phone number.',
        );
      } else {
        setError(result.error || 'Failed to resend code. Please try again.');
      }
    } catch {
      setError('Could not resend code. Please try again.');
    } finally {
      setCheckingPhone(false);
    }
  }

  function handleChangePhone() {
    setVerificationPending(false);
    setOtpCode('');
    setError(null);
    setVerificationNotice(null);
    setResendCooldown(0);
    setProfileFirstName(null);
    setPhoneNumber('');
    setTurnstileToken('');
    setIsHumanVerified(isClerkSignedIn);
    setTurnstileResetSignal((v) => v + 1);
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('eccf_worker_reg_draft_v1');
        if (raw) {
          const draft = JSON.parse(raw);
          delete draft.verificationPending;
          delete draft.maskedEmail;
          delete draft.profileFirstName;
          delete draft.verificationNotice;
          draft.phoneNumber = '';
          sessionStorage.setItem('eccf_worker_reg_draft_v1', JSON.stringify(draft));
        }
      } catch {
        // ignore
      }
    }
    void clearPendingWorkerChallenge();
  }

  async function handleRequestUpdateLink() {
    setError(null);
    setUpdateLinkMessage(null);
    setRequestingUpdateLink(true);
    try {
      const result = await requestWorkerSelfServiceLink({
        identifier: updateIdentifier,
        purpose: 'profile',
        turnstileToken,
      });
      setUpdateLinkMessage(result.message);
      if (result.maskedEmail) {
        setMaskedEmail(result.maskedEmail);
        setProfileFirstName(result.firstName || null);
        if (result.phoneNumber) {
          setPhoneNumber(result.phoneNumber);
        }
        setVerificationPending(true);
        setResendCooldown(60);
        if (typeof window !== 'undefined') {
          try {
            const raw = sessionStorage.getItem('eccf_worker_reg_draft_v1');
            const draft = raw ? JSON.parse(raw) : {};
            delete draft.verificationNotice;
            sessionStorage.setItem(
              'eccf_worker_reg_draft_v1',
              JSON.stringify({
                ...draft,
                step: 1,
                phoneNumber: result.phoneNumber || phoneNumber,
                verificationPending: true,
                maskedEmail: result.maskedEmail,
                profileFirstName: result.firstName || null,
              }),
            );
          } catch {
            // ignore
          }
        }
      }
    } catch {
      setUpdateLinkMessage(
        'If those details match a worker account with an email on file, a secure link and code have been sent.',
      );
    } finally {
      setRequestingUpdateLink(false);
    }
  }

  // Construct Executive Application Input

  // Final Submission
  async function handleFinalSubmit() {
    setError(null);
    setSubmitting(true);

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
        // Only send the photo when the user actually picked a new one.
        // The server preserves the existing image when this is omitted —
        // echoing it back caused valid Sanity-hosted photos to be rejected.
        requestPhotoUpload: Boolean(base64Image),
        turnstileToken,
        clerkUserId,
        ndprConsent,
        isExco: false,
      });

      if (registrationResult.requiresVerification) {
        try {
          const linkResult = await requestWorkerSelfServiceLink({
            identifier: email,
            purpose: 'profile',
            turnstileToken: turnstileToken || undefined,
          });
          if (linkResult.maskedEmail) {
            setIsReturning(true);
            setPhoneNumber(linkResult.phoneNumber || phoneNumber);
            setMaskedEmail(linkResult.maskedEmail);
            setProfileFirstName(linkResult.firstName || null);
            setVerificationPending(true);
            setVerificationNotice(null);
            setResendCooldown(60);
            setStep(1);
            return;
          }
        } catch {
          // fall through to error below
        }
        setError(
          registrationResult.error ||
            'A worker record was found matching those contact details. Verify your email to update your profile.',
        );
        return;
      }

      if (registrationResult.requiresEmailVerification) {
        // The email proof expired while the applicant filled the rest of the
        // form. Send a fresh confirmation code and return to the email step.
        try {
          const retrigger = await requestRegistrationEmailOtp({
            email,
            firstName,
            turnstileToken: turnstileToken || undefined,
          });
          if (retrigger.ok) {
            setRegistrationEmailVerified(false);
            setRegistrationVerifiedEmail(null);
            setRegistrationOtpSent(true);
            setRegistrationOtp('');
            setRegistrationOtpError(null);
            setRegistrationOtpNotice(
              'Your email confirmation expired. A new 6-digit code has been sent — confirm your email, then submit again.',
            );
            setEmailOtpCooldown(retrigger.retryAfterSeconds ?? 60);
            setStep(3);
            return;
          }
          setError(
            retrigger.error ||
              'Verify your email address before completing registration.',
          );
        } catch {
          setError(
            'Verify your email address to complete registration. Try again from the email step.',
          );
        }
        setStep(3);
        return;
      }

      if (registrationResult.ok) {
        const newPortrait: string | undefined = base64Image ?? undefined;
        const pickedNewPhoto = Boolean(newPortrait);
        let finalResult: WorkerRegistrationResult = {
          ...registrationResult,
          fullName: registrationResult.fullName || fullName,
          email: registrationResult.email || email,
          phoneNumber: registrationResult.phoneNumber || phoneNumber,
          hall: registrationResult.hall || hall,
          roomNumber: registrationResult.roomNumber || roomNumber,
          teams: registrationResult.teams || teams,
          profileImageUrl: pickedNewPhoto
            ? newPortrait
            : existingPhotoUrl || undefined,
          photoUploaded: pickedNewPhoto ? false : Boolean(existingPhotoUrl),
        };

        if (newPortrait && registrationResult.workerId) {
          try {
            const direct = await uploadWorkerPhotoDirectAction({
              workerId: registrationResult.workerId,
              base64Image: newPortrait,
            });
            if (direct.ok && direct.fileUrl) {
              finalResult = {
                ...finalResult,
                profileImageUrl: direct.fileUrl,
                photoUploaded: true,
              };
            }
          } catch {
            // fall through to the preview-only state
          }

          // Last resort: keep showing the *new* portrait as a data-URL
          // preview and mark the upload as pending, rather than silently
          // resurfacing the previous profile photo.
          if (!finalResult.photoUploaded) {
            finalResult = {
              ...finalResult,
              profileImageUrl: newPortrait,
              photoUploaded: false,
            };
          }
        }

        toast.success(
          finalResult.message || 'Registration submitted successfully!',
        );
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('eccf_worker_reg_draft_v1');
          } catch {
            // ignore
          }
        }
        setSuccessResult(finalResult);
      } else {
        setError(
          registrationResult.error ||
            'Failed to submit registration. Please check your fields.',
        );
        toast.error(
          registrationResult.error ||
            'Failed to submit registration. Please check your fields.',
        );
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
      setTurnstileToken('');
      setTurnstileResetSignal((value) => value + 1);
    }
  }

  const handleSuccessPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !successResult?.workerId) return;

    setIsUploadingSuccessPhoto(true);
    setSuccessPhotoError(null);

    try {
      const compressed = await compressImage(file);
      const res = await uploadWorkerPhotoDirectAction({
        workerId: successResult.workerId,
        // Clean base64 (no data-URL prefix) — the action's signer and the
        // Drive webhook both expect the raw payload.
        base64Image: compressed.base64,
      });

      if (res.ok && res.fileUrl) {
        setSuccessResult((prev) =>
          prev
            ? {
                ...prev,
                profileImageUrl: res.fileUrl,
                photoUploaded: true,
              }
            : null,
        );
        toast.success('Portrait photo successfully uploaded!');
      } else {
        setSuccessPhotoError(
          res.error || 'Failed to upload photo. Please try again.',
        );
      }
    } catch {
      setSuccessPhotoError(
        'An error occurred while compressing or uploading your photo.',
      );
    } finally {
      setIsUploadingSuccessPhoto(false);
    }
  };

  const slideVariants = {
    enter: { opacity: 0, x: 25 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -25 },
  };

  // Render Success Screen
  if (successResult?.ok) {
    const firstName =
      successResult.fullName?.trim().split(/\s+/)[0] || 'Worker';
    const hasPhoto = Boolean(successResult.profileImageUrl);
    const teamsList =
      successResult.teams && successResult.teams.length > 0
        ? successResult.teams
        : teams;
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
              {isReturning ? 'Profile Updated' : 'Request Received'}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-slate-950 font-bold tracking-tight">
              {isReturning
                ? `Welcome Back, ${firstName}!`
                : `Registration Submitted, ${firstName}!`}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
              {isReturning
                ? 'Your workforce profile has been updated.'
                : 'Your Team Leader(s) have received your request and will review your membership.'}
            </p>
          </div>
        </div>

        {/* Profile & Application Summary Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm space-y-6 text-left">
          {/* Identity & Avatar Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-4 min-w-0">
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
                {successResult.photoUploaded && (
                  <span
                    className="absolute bottom-1 right-1 h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-500 ring-2 ring-white"
                    title="Photo Uploaded"
                  />
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 break-words">
                    {successResult.fullName || fullName}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/80 text-[11px] font-semibold">
                    {isReturning ? 'Updated Member' : 'New Intake'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-mono flex items-center gap-1.5 min-w-0">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="break-all">
                    {successResult.email || email}
                  </span>
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>
                    {successResult.hall || hall}{' '}
                    {successResult.roomNumber
                      ? `• Room ${successResult.roomNumber}`
                      : ''}
                  </span>
                </p>
              </div>
            </div>

            {/* Photo upload status badge */}
            <div className="self-stretch sm:self-center">
              {successResult.photoUploaded ? (
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
                    <span>
                      {isUploadingSuccessPhoto
                        ? 'Uploading...'
                        : 'Attach Portrait Photo'}
                    </span>
                  </button>
                  {successPhotoError && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {successPhotoError}
                    </p>
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
              <span className="text-[11px] text-slate-400">
                Review by Team Leads
              </span>
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
              Your Team Lead(s) will review and confirm your unit membership in
              their Exco attendance and workforce roster.
            </p>
          </div>
        </div>

        {/* Verification Next Steps Notice */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 text-left space-y-3.5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-[#0077cc] shrink-0 mt-0.5">
              <ShieldCheck className="h-5 w-5 shrink-0" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <h3 className="font-bold text-slate-950 text-sm sm:text-base">
                What happens next?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your registration has been safely received. Your Team Leader(s) have been notified and will review your membership request on their leadership portal.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                You do not need to sign in or take any extra steps—your submission is complete. Once reviewed and verified by your Team Lead(s), your active workforce membership will be confirmed.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex min-h-14 items-center justify-center rounded-2xl bg-slate-950 px-8 py-4 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-md"
          >
            Return to Homepage
          </Link>
          {isClerkSignedIn ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex min-h-14 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all disabled:opacity-60"
            >
              <LogOut className="h-4 w-4 shrink-0 mr-2" />
              {signingOut
                ? 'Signing out…'
                : 'Sign out to register another member'}
            </button>
          ) : (
            <button
              type="button"
              onClick={resetToNewRegistration}
              className="flex min-h-14 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
            >
              <RotateCcw className="h-4 w-4 shrink-0 mr-2" /> Register Another
              Member
            </button>
          )}
        </div>
      </div>
    );
  }

  const signedInDisplayName =
    signedInWorker?.fullName ||
    [initialFirstName, initialLastName].filter(Boolean).join(' ') ||
    initialEmail;
  const signedInEmail = initialEmail || signedInWorker?.email || '';
  const signedInFirstName =
    signedInWorker?.firstName ||
    initialFirstName ||
    signedInDisplayName.split(/\s+/)[0];

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
                        Your workforce record is already on file. You are here
                        to refresh it — no new registration will be created.
                      </p>
                    </>
                  ) : signedInNeedsVerification ? (
                    <>
                      <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
                        We found a profile for this email
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        It is linked to a different sign-in method. Use “Already
                        registered as a worker?” below to confirm with a
                        one-time email code.
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-950 tracking-tight">
                        You&apos;re signed in, {signedInFirstName}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        No workforce profile is linked to this account yet.
                        Complete the short form once and it will stay linked to
                        this sign-in.
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
                  Clerk has already confirmed this sign-in, so no second code is
                  required to open your own profile. Contact-detail changes
                  still need an administrator.
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
            {signedInWorker
              ? 'Profile Refresh'
              : isReturning
                ? 'Returning Worker Refresh'
                : 'New Worker Intake'}
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
          {step === 1 &&
            (verificationPending ? (
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
                    {profileFirstName
                      ? `Welcome back, ${profileFirstName}`
                      : 'Enter Verification Code'}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    We found your workforce profile on file. For your privacy,
                    personal details stay locked until you confirm this request
                    with the code below.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/80 border border-sky-200/90 flex items-start gap-3.5">
                  <Mail className="h-5 w-5 text-[#0077cc] shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-700 leading-relaxed">
                    <p>
                      We sent a <strong>6-digit security code</strong> and a{' '}
                      <strong>direct unlock link</strong> to the email on file:
                    </p>
                    <p className="font-mono font-bold text-slate-950 text-base mt-1">
                      {maskedEmail}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Not seeing it? Check your spam or promotions folder before
                      requesting another code.
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
                    <label
                      htmlFor="otp-input"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 font-mono"
                    >
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
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, ''))
                      }
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
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin" />{' '}
                        Verifying Code...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Verify &amp; Open My Profile{' '}
                        <ArrowRight className="h-5 w-5 shrink-0" />
                      </span>
                    )}
                  </button>
                </form>

                <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || checkingPhone}
                    className="font-semibold text-[#0077cc] hover:underline disabled:text-slate-400 disabled:no-underline"
                  >
                    {resendCooldown > 0
                      ? `Resend verification code (${resendCooldown}s)`
                      : 'Resend verification code'}
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
            ) : isReturnerFlow ? (
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
                    Enter your registered email or phone number to receive a
                    secure profile unlock link.
                  </p>
                </div>

                <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="space-y-3">
                    <label
                      htmlFor="returner-identifier"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1"
                    >
                      Registered Email or Phone Number
                    </label>
                    <input
                      id="returner-identifier"
                      type="text"
                      autoComplete="username"
                      autoFocus
                      value={updateIdentifier}
                      onChange={(event) =>
                        setUpdateIdentifier(event.target.value)
                      }
                      placeholder="name@example.com or 0801 234 5678"
                      aria-label="Email or phone number on your worker profile"
                      className="flex h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-6 text-xl font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestUpdateLink}
                    disabled={
                      requestingUpdateLink ||
                      updateIdentifier.trim().length < 5
                    }
                    className="flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]"
                  >
                    {requestingUpdateLink ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin" />{' '}
                        Sending secure code…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Email me a profile update code & link{' '}
                        <ArrowRight className="h-5 w-5 shrink-0" />
                      </span>
                    )}
                  </button>

                  {updateLinkMessage && (
                    <p
                      role="status"
                      aria-live="polite"
                      className="text-xs text-slate-700 rounded-lg bg-slate-100 p-3"
                    >
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
                    {isClerkSignedIn
                      ? 'Link Your Workforce Profile'
                      : 'Worker Registration'}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-slate-950 font-bold tracking-tight">
                    {isClerkSignedIn
                      ? 'Confirm your phone number'
                      : 'Start with your phone number'}
                  </h2>
                  {isClerkSignedIn && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      We&apos;ll check whether a workforce record already exists
                      before creating a new one for{' '}
                      <strong className="font-mono text-slate-800">
                        {initialEmail}
                      </strong>
                      .
                    </p>
                  )}
                </div>

                <form
                  onSubmit={handlePhoneSubmit}
                  className="space-y-6"
                >
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

                  {!isClerkSignedIn && phoneNumber.trim().replace(/\s+/g, '').length >= 8 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-3 text-xs font-semibold text-slate-700">
                        Complete the security check to proceed.
                      </p>
                      <TurnstileWidget
                        onToken={handleTurnstileToken}
                        resetSignal={turnstileResetSignal}
                        align="left"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      phoneNumber.trim().replace(/\s+/g, '').length < 8 ||
                      checkingPhone ||
                      (!isClerkSignedIn && !isHumanVerified && !turnstileToken)
                    }
                    className="flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-4 sm:px-8 text-sm sm:text-base md:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]"
                  >
                    {checkingPhone ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin" />{' '}
                        Checking Records...
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
                      setIsReturnerFlow(true);
                      setError(null);
                      setUpdateIdentifier('');
                      setUpdateLinkMessage(null);
                    }}
                    className="flex w-full items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:border-[#0077cc] hover:text-[#0077cc] hover:bg-slate-50 transition-all"
                  >
                    <ArrowRight className="h-4 w-4 shrink-0" />
                    <span>Already registered as a worker?</span>
                  </button>
                )}
              </motion.div>
            ))}

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
                    <strong>{teams.join(', ') || 'Unassigned'}</strong> ·
                    Previous record:{' '}
                    <strong>
                      {hall || 'Unassigned'}, Room {roomNumber || '—'}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Update your profile details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    aria-label="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="h-12 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                  />
                  <input
                    aria-label="Middle name"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Middle name (optional)"
                    className="h-12 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                  />
                  <input
                    aria-label="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="h-12 rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-slate-600">
                    Email on file
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
                    />
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
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className="mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                    >
                      <option value="">Select month</option>
                      {MONTHS.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Birthday day
                    <input
                      type="number"
                      min="1"
                      max={birthMonth ? getDaysInMonth(birthMonth) : 31}
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077cc]"
                    />
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
                    {resolvedHallOptions.map((h) => (
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
                      Operational Team(s){' '}
                      <span className="text-red-500">*</span>
                    </label>
                    {teams.length > 0 && (
                      <span className="text-xs font-semibold text-[#0077cc] bg-sky-100 px-2.5 py-0.5 rounded-full">
                        {teams.length} team{teams.length > 1 ? 's' : ''}{' '}
                        selected
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {availableTeamNames.map((t) => {
                      const isSelected = teams.includes(t);
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
                                isSelected
                                  ? 'bg-[#0077cc] border-[#0077cc]'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 shrink-0 stroke-[3]" />
                              )}
                            </span>
                            <span>{t}</span>
                          </span>
                        </button>
                      );
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
                  Keep your existing photo on file or upload a fresh celebratory
                  picture.
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
                  Review &amp; Confirm{' '}
                  <ArrowRight className="h-5 w-5 shrink-0 ml-2" />
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
                  <span className="text-slate-500 font-medium">
                    Operational Team{teams.length > 1 ? 's' : ''}:
                  </span>
                  <span className="font-bold text-slate-900">
                    {teams.join(', ')}
                  </span>
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
                  disabled={submitting}
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
                  Please enter your first, middle, and last name for official
                  records.
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
                    Middle Name{' '}
                    <span className="text-slate-400 font-normal normal-case">
                      (optional)
                    </span>
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
                  disabled={
                    firstName.trim().length < 2 || lastName.trim().length < 2
                  }
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
                  {registrationEmailVerified
                    ? 'Email address confirmed'
                    : registrationOtpSent
                      ? 'Check your inbox'
                      : 'What is your email address?'}
                </h2>
                <p className="text-sm text-slate-600">
                  {registrationEmailVerified
                    ? 'You confirmed this inbox is yours. Your profile will stay linked to this email.'
                    : registrationOtpSent
                      ? 'Enter the confirmation code to prove this email belongs to you before continuing.'
                      : 'Used for official correspondence and Clerk authentication. We check you can read it before you continue.'}
                </p>
              </div>

              {registrationEmailVerified ? (
                <>
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex items-start gap-3.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-700 leading-relaxed">
                      <p>
                        <strong className="text-slate-900">{email}</strong> is
                        confirmed and belongs to you.
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        This confirmation lasts for a short while — complete
                        your registration soon. Team selection is next.
                      </p>
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
                      className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-8 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50"
                    >
                      Next Step <ArrowRight className="h-5 w-5 shrink-0 ml-2" />
                    </button>
                  </div>
                </>
              ) : registrationOtpSent ? (
                <>
                  <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/80 border border-sky-200/90 flex items-start gap-3.5">
                    <Mail className="h-5 w-5 text-[#0077cc] shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-700 leading-relaxed">
                      <p>
                        We sent a <strong>6-digit confirmation code</strong> to:
                      </p>
                      <p className="font-mono font-bold text-slate-950 text-base mt-1">
                        {maskEmailDisplay(email) || email}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Not seeing it? Check your spam or promotions folder
                        before requesting another code.
                      </p>
                    </div>
                  </div>

                  {registrationOtpNotice && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{registrationOtpNotice}</span>
                    </div>
                  )}

                  <form
                    onSubmit={handleVerifyRegistrationEmailOtp}
                    className="space-y-6"
                  >
                    {registrationOtpError && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <span>{registrationOtpError}</span>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="registration-email-otp"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 font-mono"
                      >
                        6-Digit Confirmation Code
                      </label>
                      <input
                        id="registration-email-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoFocus
                        value={registrationOtp}
                        onChange={(e) =>
                          setRegistrationOtp(e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="• • • • • •"
                        className="flex h-16 w-full rounded-2xl border-2 border-slate-300 bg-white px-6 text-center text-3xl font-mono font-bold tracking-[14px] text-slate-900 placeholder:text-slate-300 shadow-sm focus:outline-none focus:ring-4 focus:ring-[#0077cc]/20 focus:border-[#0077cc] transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={
                        registrationOtp.length !== 6 || verifyingEmailOtp
                      }
                      className="flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-6 text-base sm:text-lg font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]"
                    >
                      {verifyingEmailOtp ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-5 w-5 shrink-0 animate-spin" />{' '}
                          Verifying Code...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          Confirm Email &amp; Continue{' '}
                          <ArrowRight className="h-5 w-5 shrink-0" />
                        </span>
                      )}
                    </button>
                  </form>

                  <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <button
                      type="button"
                      onClick={handleResendRegistrationOtp}
                      disabled={emailOtpCooldown > 0 || checkingEmail}
                      className="font-semibold text-[#0077cc] hover:underline disabled:text-slate-400 disabled:no-underline"
                    >
                      {emailOtpCooldown > 0
                        ? `Resend confirmation code (${emailOtpCooldown}s)`
                        : 'Resend confirmation code'}
                    </button>

                    <button
                      type="button"
                      onClick={resetRegistrationEmailVerification}
                      className="text-slate-500 hover:text-slate-900 underline"
                    >
                      Use a different email address
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
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
                      disabled={
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
                        checkingEmail
                      }
                      onClick={handleEmailNext}
                      className="flex h-16 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-5 text-base font-bold text-white transition-all hover:brightness-105 shadow-lg shadow-sky-600/25 disabled:pointer-events-none disabled:opacity-50 sm:px-8 sm:text-lg"
                    >
                      {checkingEmail ? (
                        <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                          <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                          Sending Code…
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                          <span className="sm:hidden">Send Code</span>
                          <span className="hidden sm:inline">
                            Send Confirmation Code
                          </span>
                          <ArrowRight
                            className="h-5 w-5 shrink-0"
                            aria-hidden="true"
                          />
                        </span>
                      )}
                    </button>
                  </div>
                </>
              )}
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
                  Select all operational teams you belong to. A worker can serve
                  in more than one team.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {availableTeamNames.map((t) => {
                  const isSelected = teams.includes(t);
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
                            isSelected
                              ? 'bg-[#0077cc] border-[#0077cc]'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 shrink-0 stroke-[3]" />
                          )}
                        </span>
                        <span>{t}</span>
                      </span>
                      {isSelected && (
                        <span className="text-xs font-medium text-sky-600 bg-sky-100/60 px-2 py-0.5 rounded-md">
                          Selected
                        </span>
                      )}
                    </button>
                  );
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
                  Select your hostel or residence hall, and enter your room
                  number.
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
                    {resolvedHallOptions.map((h) => (
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
                      const newMonth = e.target.value;
                      setBirthMonth(newMonth);
                      if (birthDay) {
                        const maxD = getDaysInMonth(newMonth);
                        if (parseInt(birthDay, 10) > maxD) {
                          setBirthDay(String(maxD).padStart(2, '0'));
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
                    {Array.from(
                      { length: birthMonth ? getDaysInMonth(birthMonth) : 31 },
                      (_, i) => {
                        const dayVal = String(i + 1).padStart(2, '0');
                        return (
                          <option key={dayVal} value={dayVal}>
                            {i + 1}
                          </option>
                        );
                      },
                    )}
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
                  A clear celebratory photo we can celebrate you with on your
                  birthday.
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
                  Review your registration summary and complete your workforce
                  onboarding.
                </p>
              </div>

              <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-5 py-2 shadow-sm sm:px-6">
                <div className="grid grid-cols-[minmax(0,40%)_1fr] items-start gap-x-5 py-3.5">
                  <dt className="text-sm font-medium leading-relaxed text-slate-500">
                    Name
                  </dt>
                  <dd className="min-w-0 break-words text-right text-sm font-bold leading-relaxed text-slate-900">
                    {fullName}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,40%)_1fr] items-start gap-x-5 py-3.5">
                  <dt className="text-sm font-medium leading-relaxed text-slate-500">
                    Email
                  </dt>
                  <dd className="min-w-0 break-words text-right text-sm font-bold leading-relaxed text-slate-900">
                    {email}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,40%)_1fr] items-start gap-x-5 py-3.5">
                  <dt className="text-sm font-medium leading-relaxed text-slate-500">
                    Phone
                  </dt>
                  <dd className="min-w-0 break-words text-right text-sm font-bold leading-relaxed text-slate-900">
                    {phoneNumber}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,40%)_1fr] items-start gap-x-5 py-3.5">
                  <dt className="text-sm font-medium leading-relaxed text-slate-500">
                    Operational Team{teams.length > 1 ? 's' : ''}
                  </dt>
                  <dd className="min-w-0 break-words text-right text-sm font-bold leading-relaxed text-slate-900">
                    {teams.join(', ')}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,40%)_1fr] items-start gap-x-5 py-3.5">
                  <dt className="text-sm font-medium leading-relaxed text-slate-500">
                    Hostel / Room
                  </dt>
                  <dd className="min-w-0 break-words text-right text-sm font-bold leading-relaxed text-slate-900">
                    {hall}, {roomNumber}
                  </dd>
                </div>
                {birthMonth && birthDay && (
                  <div className="grid grid-cols-[minmax(0,40%)_1fr] items-start gap-x-5 py-3.5">
                    <dt className="text-sm font-medium leading-relaxed text-slate-500">
                      Birthday
                    </dt>
                    <dd className="min-w-0 break-words text-right text-sm font-bold leading-relaxed text-slate-900">
                      {MONTHS.find((m) => m.value === birthMonth)?.label}{' '}
                      {parseInt(birthDay, 10)}
                    </dd>
                  </div>
                )}
                <div className="grid grid-cols-[minmax(0,40%)_1fr] items-start gap-x-5 py-3.5">
                  <dt className="text-sm font-medium leading-relaxed text-slate-500">
                    Designation
                  </dt>
                  <dd className="min-w-0 break-words text-right text-sm font-bold leading-relaxed text-[#0077cc]">
                    Volunteer Worker (Pending Lead Verification)
                  </dd>
                </div>
              </dl>

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
                  I consent to ECCF collecting and processing my fellowship
                  workforce information in accordance with the Nigerian Data
                  Protection Regulation (NDPR).
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
                  disabled={submitting || !ndprConsent}
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

      {/* Footer shortcut */}
      <div className="pt-4 text-center">
        <p className="text-xs text-slate-500">
          Already registered as a worker? You can update your details anytime using your registered phone number above.
        </p>
      </div>
    </div>
  );
}
