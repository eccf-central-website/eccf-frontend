'use client'

import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SignIn } from '@clerk/nextjs'
import PwaPromptSuppressor from '@/components/common/PwaPromptSuppressor'

function ClerkLoginCard() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <PwaPromptSuppressor />
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="space-y-2 text-center">
          <div className="mx-auto mb-3 relative h-16 w-16 transition-transform hover:scale-105">
            <Image
              src="/logos/ECCF LOGO.png"
              alt="ECCF Logo"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-100">
            Exco Portal Sign-in
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Passwordless sign-in for appointed fellowship executives and leaders.
          </p>
        </div>

        {/* Clerk Sign-in Component */}
        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/register"
            afterSignInUrl="/dashboard"
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
                rootBox: 'w-full shadow-2xl',
                card: 'w-full bg-slate-950 border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
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
        </div>

        {/* Footer Navigation */}
        <div className="pt-2 text-center">
          <p className="text-xs text-slate-400">
            <Link href="/" className="hover:underline text-slate-400 hover:text-slate-300 transition-colors">
              &larr; Return to main fellowship website
            </Link>
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
        <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-950 p-8">
          <div className="h-96 w-full max-w-md animate-pulse bg-slate-900 rounded-2xl border border-slate-800" />
        </div>
      }
    >
      <ClerkLoginCard />
    </Suspense>
  )
}
