'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, AlertCircle, Clock, KeyRound, CheckCircle2, Lock } from 'lucide-react'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/dashboard/ui/dialog'
import { setupExcoPassword } from '@/app/actions/worker-registration'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const initialError = searchParams.get('error')

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialError === 'CredentialsSignin' ? 'Invalid credentials. Please check your details.' : null
  )
  const [isPendingApproval, setIsPendingApproval] = useState(false)

  // Reset / Set Password Modal State
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [resetIdentifier, setResetIdentifier] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setIsPendingApproval(false)

    try {
      const res = await signIn('credentials', {
        redirect: false,
        identifier: identifier.trim(),
        password,
        callbackUrl,
      })

      if (res?.error) {
        if (res.error.toLowerCase().includes('pending administrator approval')) {
          setIsPendingApproval(true)
          setErrorMessage(
            'Your Exco designation request is currently pending administrator approval. Please contact a fellowship executive.'
          )
        } else {
          setErrorMessage(res.error)
        }
      } else if (res?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setErrorMessage('An unexpected error occurred during sign-in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSetupPassword(e: React.FormEvent) {
    e.preventDefault()
    setResetError(null)
    setResetSuccess(null)

    if (!resetIdentifier.trim()) {
      setResetError('Please enter your registered email or phone number.')
      return
    }
    if (resetPassword.length < 8) {
      setResetError('Password must be at least 8 characters long.')
      return
    }
    if (resetPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.')
      return
    }

    setResetLoading(true)
    try {
      const result = await setupExcoPassword({
        identifier: resetIdentifier.trim(),
        newPassword: resetPassword,
      })

      if (result.ok) {
        setResetSuccess(result.message || 'Password set successfully!')
        setIdentifier(resetIdentifier.trim())
        setPassword(resetPassword)
        setErrorMessage(null)
        setTimeout(() => {
          setIsResetOpen(false)
          setResetSuccess(null)
          setResetPassword('')
          setResetConfirmPassword('')
        }, 1500)
      } else {
        setResetError(result.error || 'Failed to update password. Please check your credentials.')
      }
    } catch {
      setResetError('An unexpected network error occurred. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  const isMissingPasswordError = errorMessage?.toLowerCase().includes('password set up')

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-sm sm:max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto mb-4 relative h-16 w-16 transition-transform hover:scale-105">
            <Image
              src="/logos/ECCF LOGO.png"
              alt="ECCF Logo"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            Exco Portal Sign-in
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Sign in with your registered email or phone number to access the fellowship management console.
          </p>
        </div>

        {/* Error / Alert banner */}
        {errorMessage && (
          <div
            className={`p-4 rounded-xl text-sm flex flex-col gap-2 shadow-xs ${
              isPendingApproval
                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            <div className="flex items-start gap-3">
              {isPendingApproval ? (
                <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              )}
              <p className="font-medium leading-relaxed">{errorMessage}</p>
            </div>

            {isMissingPasswordError && (
              <div className="mt-1 pt-2 border-t border-destructive/20 pl-8">
                <button
                  type="button"
                  onClick={() => {
                    setResetIdentifier(identifier)
                    setResetError(null)
                    setResetSuccess(null)
                    setIsResetOpen(true)
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-destructive hover:underline cursor-pointer"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Set up your dashboard password now &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="identifier" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-stone-300">
              Email or Phone Number
            </Label>
            <Input
              id="identifier"
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="michael.akan@example.com or 08012345678"
              className="h-12 rounded-xl border border-slate-300 dark:border-stone-700 bg-slate-50/60 hover:bg-slate-50/90 focus-visible:bg-white dark:bg-stone-900 px-3.5 text-foreground placeholder:text-slate-400 shadow-xs focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-stone-300">
                Password
              </Label>
              <button
                type="button"
                onClick={() => {
                  setResetIdentifier(identifier)
                  setResetError(null)
                  setResetSuccess(null)
                  setIsResetOpen(true)
                }}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Set or reset password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your dashboard password"
                className="h-12 rounded-xl border border-slate-300 dark:border-stone-700 bg-slate-50/60 hover:bg-slate-50/90 focus-visible:bg-white dark:bg-stone-900 px-3.5 pr-10 text-foreground placeholder:text-slate-400 shadow-xs focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all mt-2"
          >
            {loading ? 'Authenticating…' : 'Sign in to Dashboard'}
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-200 dark:border-stone-800 text-center space-y-2">
          <p className="text-sm">
            <a
              href="/register"
              className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
            >
              Not Registered?
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            <a href="/" className="hover:underline text-slate-500 dark:text-stone-400">
              &larr; Return to main fellowship website
            </a>
          </p>
        </div>
      </div>

      {/* Set / Reset Password Modal */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-stone-950 p-6 shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Lock className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg font-bold">Configure Exco Password</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Establish or update your dashboard credentials for your registered Exco profile.
            </DialogDescription>
          </DialogHeader>

          {resetError && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2 border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{resetError}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSetupPassword} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <Label htmlFor="reset-id" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-stone-300">
                Registered Email or Phone Number
              </Label>
              <Input
                id="reset-id"
                type="text"
                required
                value={resetIdentifier}
                onChange={(e) => setResetIdentifier(e.target.value)}
                placeholder="e.g. 08168730661 or name@example.com"
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="reset-pw" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-stone-300">
                New Password (Min. 8 characters)
              </Label>
              <Input
                id="reset-pw"
                type="password"
                required
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Enter new secure password"
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="reset-cpw" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-stone-300">
                Confirm New Password
              </Label>
              <Input
                id="reset-cpw"
                type="password"
                required
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetOpen(false)}
                className="flex-1 h-11 rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={resetLoading}
                className="flex-1 h-11 rounded-xl text-xs font-semibold"
              >
                {resetLoading ? 'Saving…' : 'Save Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="h-96 w-full max-w-md animate-pulse bg-muted rounded-2xl" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
