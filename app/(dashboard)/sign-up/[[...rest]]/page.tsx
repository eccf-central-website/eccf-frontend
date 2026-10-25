'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'
import LoadingState from '@/components/common/LoadingState'
import PwaPromptSuppressor from '@/components/common/PwaPromptSuppressor'

/* Midnight-navy palette shared with the ECCF Midnight dashboard theme. */
const NAVY = {
  card: '#0f1420',
  input: '#161d2e',
  text: '#e8edf5',
  textMuted: '#9aa7bd',
}

function ClerkSignUpCard() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true)
    }, 1800)
    return () => clearTimeout(timer)
  }, [])

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
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/login"
            afterSignUpUrl="/dashboard"
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
                formFieldInput:
                  'bg-[#161d2e] border border-[#1e2740] text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-11 transition-all',
                formButtonPrimary:
                  'bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl h-11 transition-all shadow-md mt-2',
                footerAction: 'pt-4 border-t border-[#1c2438] text-slate-400 text-xs',
                footerActionLink: 'text-blue-400 hover:text-blue-300 font-semibold transition-colors',
              },
            }}
          />

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

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-1 items-center justify-center bg-[#0a0e19] p-8">
          <LoadingState
            size="md"
            theme="dark"
            message="Loading Exco Portal"
            subtext="Preparing secure fellowship authentication..."
          />
        </div>
      }
    >
      <ClerkSignUpCard />
    </Suspense>
  )
}
