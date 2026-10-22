'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { SignIn } from '@clerk/nextjs'
import LoadingState from '@/components/common/LoadingState'
import PwaPromptSuppressor from '@/components/common/PwaPromptSuppressor'
import { activateRegisteredWorkerLogin } from '@/app/actions/worker-registration'

function ClerkLoginCard() {
  const [ready, setReady] = useState(false)
  const [activateEmail, setActivateEmail] = useState('')
  const [activateStatus, setActivateStatus] = useState<{ ok?: boolean; message?: string; error?: string } | null>(null)
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true)
    }, 1800)
    return () => clearTimeout(timer)
  }, [])

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setActivating(true)
    setActivateStatus(null)
    try {
      const result = await activateRegisteredWorkerLogin(activateEmail)
      setActivateStatus(result)
    } finally {
      setActivating(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-stone-950 px-4 py-12 text-stone-100">
      <PwaPromptSuppressor />

      {!ready ? (
        <LoadingState
          size="md"
          theme="dark"
          message="Loading Exco Portal"
          subtext="Preparing secure fellowship authentication..."
        />
      ) : (
        <div className="w-full max-w-md flex flex-col items-center space-y-6 animate-in fade-in duration-500">
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: '#2563eb',
                colorBackground: '#1c1917',
                colorInputBackground: '#292524',
                colorInputText: '#f8fafc',
                colorText: '#f8fafc',
                colorTextSecondary: '#a8a29e',
                colorNeutral: '#f8fafc',
                borderRadius: '0.75rem',
              },
              elements: {
                rootBox: 'w-full shadow-2xl flex justify-center',
                card: 'w-full bg-stone-950 border border-stone-800 shadow-2xl rounded-2xl p-6 sm:p-8',
                socialButtonsBlockButton:
                  'bg-stone-900 border border-stone-800 text-stone-200 hover:bg-stone-800 hover:text-white transition-all h-11 rounded-xl',
                socialButtonsBlockButtonText: 'text-stone-200 font-medium text-xs',
                dividerRow: 'my-4',
                dividerLine: 'bg-stone-800',
                dividerText: 'text-stone-400 text-xs uppercase tracking-wider',
                formFieldLabel: 'text-stone-300 text-xs font-semibold uppercase tracking-wider mb-1',
                formFieldInput:
                  'bg-stone-900 border border-stone-800 text-stone-100 placeholder:text-stone-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-11 transition-all',
                formButtonPrimary:
                  'bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl h-11 transition-all shadow-md mt-2',
                footerAction: 'pt-4 border-t border-stone-900 text-stone-400 text-xs',
                footerActionLink: 'text-blue-400 hover:text-blue-300 font-semibold transition-colors',
                identityPreviewText: 'text-stone-200 text-sm font-medium',
                identityPreviewEditButton: 'text-blue-400 hover:text-blue-300 text-xs font-semibold',
                formResendCodeLink: 'text-blue-400 hover:text-blue-300 text-xs font-semibold',
                otpCodeFieldInput:
                  'bg-stone-900 border border-stone-800 text-stone-100 text-xl font-mono focus:border-blue-500 rounded-xl',
              },
            }}
          />

          {/* Activation for previously registered workers */}
          <div className="w-full border-t border-stone-800 pt-4 space-y-3">
            <p className="text-xs text-stone-400 text-center">
              Registered before but cannot sign in? Activate your login below.
            </p>
            <form onSubmit={handleActivate} className="space-y-2">
              <input
                type="email"
                value={activateEmail}
                onChange={(e) => setActivateEmail(e.target.value)}
                placeholder="Your registered email"
                className="w-full h-10 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <button
                type="submit"
                disabled={activating}
                className="w-full h-10 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 text-sm font-medium transition-all disabled:opacity-50"
              >
                {activating ? 'Activating...' : 'Activate Login'}
              </button>
            </form>
            {activateStatus?.ok && (
              <p className="text-xs text-emerald-400 text-center">{activateStatus.message}</p>
            )}
            {activateStatus && !activateStatus.ok && (
              <p className="text-xs text-red-400 text-center">{activateStatus.error}</p>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="text-center">
            <Link href="/" className="text-xs text-stone-400 hover:text-stone-300 hover:underline transition-colors">
              &larr; Return to main fellowship website
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-1 items-center justify-center bg-stone-950 p-8">
          <LoadingState
            size="md"
            theme="dark"
            message="Loading Exco Portal"
            subtext="Connecting to fellowship authentication..."
          />
        </div>
      }
    >
      <ClerkLoginCard />
    </Suspense>
  )
}
