/**
 * ErrorState — friendly failure panel with Retry and an optional way back.
 *
 * Never renders `error.message`: in production Next replaces server errors
 * with a generic message plus a `digest`, and in development the raw text
 * could include data we must not show. The digest is shown as a reference
 * code so an Exco can quote it and we can find the server log.
 *
 * Retry runs `router.refresh()` and `reset()` in one transition. In Next 14
 * `reset()` alone re-renders the segment from the cached RSC payload (which
 * still throws); the refresh refetches Server Component data first. Without
 * `reset` (inline use outside an error.tsx) Retry only refreshes.
 */

'use client'

import { useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Loader2, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SECTION_PATHS } from '@/lib/dashboard/rbac'
import { Button } from '@/components/dashboard/ui/button'

interface ErrorStateProps {
  title?: string
  description?: string
  /** Next's error digest, shown as a reference code. */
  digest?: string
  /** The error boundary's reset(); omit for inline use. */
  reset?: () => void
  /** "Back" link target; null hides it. Hidden automatically when already there. */
  backHref?: string | null
  backLabel?: string
  /** Move focus to the heading on mount (route error boundaries). */
  autoFocus?: boolean
  headingLevel?: 'h2' | 'h3'
  className?: string
}

export default function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this. Check your connection and try again.",
  digest,
  reset,
  backHref = SECTION_PATHS.overview,
  backLabel = 'Back to overview',
  autoFocus = false,
  headingLevel: Heading = 'h2',
  className,
}: ErrorStateProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus()
  }, [autoFocus])

  const retry = () => {
    startTransition(() => {
      router.refresh()
      reset?.()
    })
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center rounded-xl border border-destructive/30 bg-card px-6 py-12 text-center sm:py-16',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
      >
        <AlertTriangle className="h-6 w-6" />
      </div>
      <Heading
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 rounded-sm font-serif text-xl text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {title}
      </Heading>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {digest && (
        <p className="mt-3 text-xs text-muted-foreground">
          Reference: <code className="select-all rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{digest}</code>
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={retry} disabled={isPending} className="h-10 px-5 focus-visible:ring-2">
          {isPending ? <Loader2 aria-hidden="true" className="motion-safe:animate-spin" /> : <RotateCw aria-hidden="true" />}
          {isPending ? 'Retrying…' : 'Retry'}
        </Button>
        {backHref !== null && pathname !== backHref && (
          <Button asChild variant="outline" className="h-10 px-5 focus-visible:ring-2">
            <Link href={backHref}>
              <ArrowLeft aria-hidden="true" />
              {backLabel}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
