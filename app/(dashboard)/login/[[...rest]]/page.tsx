'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SignIn, ClerkLoaded, ClerkLoading, useAuth } from '@clerk/nextjs'
import LoadingState from '@/components/common/LoadingState'
import PwaPromptSuppressor from '@/components/common/PwaPromptSuppressor'
import { useTheme } from '@/components/dashboard/theme/ThemeProvider'
import { activateRegisteredWorkerLogin } from '@/app/actions/worker-registration'

function readCssHslVar(name: string): string | undefined {
  if (typeof window === 'undefined') return undefined
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const match = raw.match(/^(\d+(?:\.\d+)?)\s+([\d.]+)%\s+([\d.]+)%$/)
  if (!match) return undefined
  return `hsl(${Math.round(Number(match[1]))}, ${match[2]}%, ${match[3]}%)`
}

function useClerkDashboardVariables() {
  const { theme } = useTheme()
  const [vars, setVars] = useState<Record<string, string>>({})

  useEffect(() => {
    setVars({
      ...(readCssHslVar('--primary') ? { colorPrimary: readCssHslVar('--primary')! } : {}),
      ...(readCssHslVar('--primary-foreground')
        ? { colorTextOnPrimaryBackground: readCssHslVar('--primary-foreground')! }
        : {}),
      ...(readCssHslVar('--card') ? { colorBackground: readCssHslVar('--card')! } : {}),
      ...(readCssHslVar('--popover')
        ? { colorInputBackground: readCssHslVar('--popover')! }
        : {}),
      ...(readCssHslVar('--foreground')
        ? {
            colorInputText: readCssHslVar('--foreground')!,
            colorText: readCssHslVar('--foreground')!,
            colorNeutral: readCssHslVar('--foreground')!,
          }
        : {}),
      ...(readCssHslVar('--muted-foreground')
        ? { colorTextSecondary: readCssHslVar('--muted-foreground')! }
        : {}),
    })
  }, [theme])

  return vars
}

function ClerkLoginCard() {
  const { isLoaded } = useAuth()
  const searchParams = useSearchParams()
  const isApprovalPending = searchParams?.get('denied') === 'approval_pending'
  const clerkVariables = useClerkDashboardVariables()
  const [activateEmail, setActivateEmail] = useState('')
  const [activateStatus, setActivateStatus] = useState<{
    ok?: boolean
    message?: string
    error?: string
  } | null>(null)
  const [activating, setActivating] = useState(false)

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

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-background p-8 text-foreground">
        <LoadingState
          size="md"
          theme="dark"
          message="Loading Exco Portal"
          subtext="Connecting to fellowship authentication..."
        />
      </div>
    )
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4 py-12 text-foreground"
    >
      <PwaPromptSuppressor />

      <div className="flex w-full max-w-md flex-col items-center space-y-6">
        {isApprovalPending && (
          <div
            role="alert"
            className="w-full space-y-1 rounded-2xl border border-warning/30 bg-warning/15 p-4 text-center text-[13px] text-foreground shadow-lg"
          >
            <p className="font-semibold text-foreground">Executive Approval Required</p>
            <p className="leading-relaxed text-muted-foreground">
              Your sign-in succeeded, but this account does not have an approved executive
              appointment in fellowship records. If you were recently appointed, please ensure your
              position is approved by the President or fellowship administrator.
            </p>
          </div>
        )}

        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
          appearance={{
            variables: {
              ...clerkVariables,
              borderRadius: '0.75rem',
            },
            elements: {
              rootBox: 'w-full shadow-2xl flex justify-center',
              card: 'w-full bg-card border border-border text-card-foreground shadow-2xl rounded-2xl p-6 sm:p-8',
              headerTitle: 'font-heading font-normal text-2xl text-foreground',
              headerSubtitle: 'text-[13px] text-muted-foreground',
              socialButtonsBlockButton:
                'bg-popover border border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors h-11 rounded-xl',
              socialButtonsBlockButtonText: 'text-foreground font-medium text-[13px]',
              dividerRow: 'my-4',
              dividerLine: 'bg-border',
              dividerText: 'text-muted-foreground text-xs uppercase tracking-wider',
              formFieldLabel:
                'text-foreground text-xs font-semibold uppercase tracking-wider mb-1',
              formFieldInput:
                'bg-popover border border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 rounded-xl h-11 transition-colors',
              formButtonPrimary:
                'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl h-11 transition-colors shadow-md mt-2',
              footerAction: 'pt-4 border-t border-border text-muted-foreground text-[13px]',
              footerActionLink: 'text-primary hover:text-primary/80 font-semibold transition-colors',
              identityPreviewText: 'text-foreground text-sm font-medium',
              identityPreviewEditButton:
                'text-primary hover:text-primary/80 text-[13px] font-semibold',
              formResendCodeLink: 'text-primary hover:text-primary/80 text-[13px] font-semibold',
              otpCodeFieldInput:
                'bg-popover border border-input text-foreground text-xl font-mono focus:border-ring rounded-xl',
            },
          }}
        />

        {/* Troubleshooting Helper for Legacy Profile Sync */}
        <details className="group w-full pt-1 text-center">
          <summary className="inline-flex min-h-11 cursor-pointer list-none select-none items-center justify-center rounded-lg px-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Trouble accessing your account with Google?
          </summary>
          <div className="mt-3 space-y-3 rounded-xl border border-border bg-card p-4 text-left">
            <p className="text-center text-[13px] text-muted-foreground">
              Enter your registered workforce email below to sync your login access.
            </p>
            <form onSubmit={handleActivate} className="space-y-2.5">
              <label htmlFor="sync-workforce-email" className="sr-only">
                Registered workforce email
              </label>
              <input
                id="sync-workforce-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={activateEmail}
                onChange={(e) => setActivateEmail(e.target.value)}
                placeholder="Your registered email"
                className="h-11 w-full rounded-xl border border-input bg-popover px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                required
              />
              <button
                type="submit"
                disabled={activating}
                className="h-11 w-full rounded-xl bg-secondary text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {activating ? 'Syncing...' : 'Sync Account Access'}
              </button>
            </form>
            {activateStatus?.ok && (
              <p
                role="status"
                className="rounded-lg bg-success/10 px-3 py-2 text-center text-[13px] text-success"
              >
                {activateStatus.message}
              </p>
            )}
            {activateStatus && !activateStatus.ok && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-[13px] text-destructive"
              >
                {activateStatus.error}
              </p>
            )}
          </div>
        </details>

        {/* Footer Navigation */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            &larr; Return to main fellowship website
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <>
      <ClerkLoading>
        <div className="flex min-h-screen flex-1 items-center justify-center bg-background p-8 text-foreground">
          <LoadingState
            size="md"
            theme="dark"
            message="Loading Exco Portal"
            subtext="Connecting to fellowship authentication..."
          />
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        <Suspense
          fallback={
            <div className="flex min-h-screen flex-1 items-center justify-center bg-background p-8 text-foreground">
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
      </ClerkLoaded>
    </>
  )
}
