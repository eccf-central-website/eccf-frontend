'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'
import LoadingState from '@/components/common/LoadingState'
import PwaPromptSuppressor from '@/components/common/PwaPromptSuppressor'
import { useTheme } from '@/components/dashboard/theme/ThemeProvider'

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

function ClerkSignUpCard() {
  const clerkVariables = useClerkDashboardVariables()

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4 py-12 text-foreground"
    >
      <PwaPromptSuppressor />

      <div className="flex w-full max-w-md flex-col items-center space-y-6">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/login"
          afterSignUpUrl="/dashboard"
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
            },
          }}
        />

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

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-1 items-center justify-center bg-background p-8 text-foreground">
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
