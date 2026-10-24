'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { SignIn } from '@clerk/nextjs'
import LoadingState from '@/components/common/LoadingState'
import PwaPromptSuppressor from '@/components/common/PwaPromptSuppressor'
import { activateRegisteredWorkerLogin } from '@/app/actions/worker-registration'

/* Midnight-navy palette shared with the ECCF Midnight dashboard theme. */
const NAVY = {
  card: '#0f1420',
  input: '#161d2e',
  text: '#e8edf5',
  textMuted: '#9aa7bd',
}

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
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[#0a0e19] px-4 py-12 text-slate-100">
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
            // Signup is handled exclusively at /register. When a social
            // sign-in (e.g. Continue with Google) finds no existing account,
            // Clerk transfers the flow here — send them to the worker
            // registration form instead of a Clerk sign-up page.
            signUpUrl="/register"
            afterSignInUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: '#2563eb',
                colorBackground: NAVY.card,
                colorInputBackground: NAVY.input,
                colorInputText: NAVY.text,
                colorText: NAVY.text,
                colorTextSecondary: NAVY.textMuted,
                colorNeutral: NAVY.text,
                borderRadius: '0.75rem',
              },
              elements: {
                rootBox: 'w-full shadow-2xl flex justify-center',
                card: 'w-full bg-[#0f1420] border border-[#1c2438] shadow-2xl rounded-2xl p-6 sm:p-8',
                socialButtonsBlockButton:
                  'bg-[#141b2c] border border-[#1e2740] text-slate-200 hover:bg-[#1c2740] hover:text-white transition-all h-11 rounded-xl',
                socialButtonsBlockButtonText: 'text-slate-200 font-medium text-xs',
                dividerRow: 'my-4',
                dividerLine: 'bg-[#1e2740]',
                dividerText: 'text-slate-400 text-xs uppercase tracking-wider',
                formFieldLabel: 'text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1',
                formFieldInput: 'bg-[#161d2e] border border-[#1e2740] text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-11 transition-all',
                formButtonPrimary:
                  'bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl h-11 transition-all shadow-md mt-2',
                footerAction: 'pt-4 border-t border-[#1c2438] text-slate-400 text-xs',
                footerActionLink: 'text-blue-400 hover:text-blue-300 font-semibold transition-colors',
                identityPreviewText: 'text-slate-200 text-sm font-medium',
                identityPreviewEditButton: 'text-blue-400 hover:text-blue-300 text-xs font-semibold',
                formResendCodeLink: 'text-blue-400 hover:text-blue-300 text-xs font-semibold',
                otpCodeFieldInput: 'bg-[#161d2e] border border-[#1e2740] text-slate-100 text-xl font-mono focus:border-blue-500 rounded-xl',
              },
            }}
          />

          {/* Activation for previously registered workers */}
          <div className="w-full border-t border-[#1c2438] pt-4 space-y-3">
            <p className="text-xs text-slate-400 text-center">
              Registered before but cannot sign in? Activate your login below.
            </p>
            <form onSubmit={handleActivate} className="space-y-2">
              <input
                type="email"
                value={activateEmail}
                onChange={(e) => setActivateEmail(e.target.value)}
                placeholder="Your registered email"
                className="w-full h-10 rounded-xl bg-[#141b2c] border border-[#1e2740] text-slate-100 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <button
                type="submit"
                disabled={activating}
                className="w-full h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-100 text-sm font-medium transition-all disabled:opacity-50"
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
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-300 hover:underline transition-colors">
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
        <div className="flex min-h-screen flex-1 items-center justify-center bg-[#0a0e19] p-8">
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
