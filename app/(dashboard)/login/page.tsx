'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Label } from '@/components/dashboard/ui/label'

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
            className={`p-4 rounded-xl text-sm flex items-start gap-3 shadow-xs ${
              isPendingApproval
                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            {isPendingApproval ? (
              <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            )}
            <p className="font-medium leading-relaxed">{errorMessage}</p>
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
              placeholder="e.g. john@example.com or 08012345678"
              className="h-12 rounded-xl border border-slate-300 dark:border-stone-700 bg-slate-50/60 hover:bg-slate-50/90 focus-visible:bg-white dark:bg-stone-900 px-3.5 text-foreground placeholder:text-slate-400 shadow-xs focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-stone-300">
                Password
              </Label>
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
