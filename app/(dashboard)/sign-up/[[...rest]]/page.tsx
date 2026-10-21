'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'
import LoadingState from '@/components/common/LoadingState'
import PwaPromptSuppressor from '@/components/common/PwaPromptSuppressor'

function ClerkSignUpCard() {
  const [ready, setReady] = useState(false)

  // Hold loading animation for a smooth minimum duration so users can see the branded transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true)
    }, 1800) // 1.8 seconds smooth branded presentation
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <PwaPromptSuppressor />

      {!ready ? (
        <LoadingState
          size="md"
          theme="dark"
          message="Loading Account Setup"
          subtext="Preparing secure fellowship onboarding..."
        />
      ) : (
        <div className="w-full max-w-md flex flex-col items-center space-y-6 animate-in fade-in duration-500">
          {/* Header Info */}
          <div className="w-full text-center space-y-1">
            <span className="inline-block text-[11px] font-semibold tracking-wider text-blue-400 uppercase bg-blue-950/60 border border-blue-800/40 px-3 py-1 rounded-full">
              First-Time Exco Setup
            </span>
            <p className="text-xs text-slate-400 pt-1">
              Use the email address registered with the fellowship.
            </p>
          </div>

          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/login"
            afterSignUpUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: '#2563eb',
                colorBackground: '#020617',
                colorInputBackground: '#0f172a',
                colorInputText: '#f8fafc',
                colorText: '#f8fafc',
                colorTextSecondary: '#94a3b8',
                colorNeutral: '#f8fafc',
                borderRadius: '0.75rem',
              },
              elements: {
                rootBox: 'w-full shadow-2xl flex justify-center',
                card: 'w-full bg-slate-950 border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8',
                socialButtonsBlockButton:
                  'bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white transition-all h-11 rounded-xl',
                socialButtonsBlockButtonText: 'text-slate-200 font-medium text-xs',
                dividerRow: 'my-4',
                dividerLine: 'bg-slate-800',
                dividerText: 'text-slate-400 text-xs uppercase tracking-wider',
                formFieldLabel: 'text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1',
                formFieldInput:
                  'bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-11 transition-all',
                formButtonPrimary:
                  'bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl h-11 transition-all shadow-md mt-2',
                footerAction: 'pt-4 border-t border-slate-900 text-slate-400 text-xs',
                footerActionLink: 'text-blue-400 hover:text-blue-300 font-semibold transition-colors',
                identityPreviewText: 'text-slate-200 text-sm font-medium',
                identityPreviewEditButton: 'text-blue-400 hover:text-blue-300 text-xs font-semibold',
                formResendCodeLink: 'text-blue-400 hover:text-blue-300 text-xs font-semibold',
                otpCodeFieldInput:
                  'bg-slate-900 border border-slate-800 text-slate-100 text-xl font-mono focus:border-blue-500 rounded-xl',
              },
            }}
          />

          {/* Footer Navigation */}
          <div className="text-center space-y-2">
            <div>
              <Link href="/login" className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium">
                Already created your account? Sign in &rarr;
              </Link>
            </div>
            <div>
              <Link href="/" className="text-xs text-slate-400 hover:text-slate-300 hover:underline transition-colors">
                &larr; Return to main fellowship website
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-950 p-8">
          <LoadingState
            size="md"
            theme="dark"
            message="Loading Account Setup"
            subtext="Connecting to fellowship authentication..."
          />
        </div>
      }
    >
      <ClerkSignUpCard />
    </Suspense>
  )
}
