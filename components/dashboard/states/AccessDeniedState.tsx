/**
 * AccessDeniedState — clean in-dashboard 403 / restricted-section panel.
 *
 * Server- and client-safe (no hooks or browser-only APIs). Pairs a borderless
 * tonal `bg-card` surface with a clear role-context explanation and a 44px
 * link back to Overview (`/dashboard`).
 */

import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SECTION_PATHS } from '@/lib/dashboard/rbac'
import { Button } from '@/components/dashboard/ui/button'

interface AccessDeniedStateProps {
  /** Display name of the restricted section, e.g. "Finance Ledger". */
  sectionName?: string
  /** Optional heading override; defaults to a section-aware title. */
  title?: string
  /** Concise explanation of why the current role cannot open this view. */
  description?: string
  /** Optional active role or post label shown for clarity, e.g. "Hall Pastor". */
  roleLabel?: string
  /** Destination for the return CTA; defaults to Overview (`/dashboard`). */
  backHref?: string
  backLabel?: string
  /** Optional secondary CTA slot alongside the Overview link. */
  secondaryAction?: React.ReactNode
  headingLevel?: 'h1' | 'h2' | 'h3'
  className?: string
}

export default function AccessDeniedState({
  sectionName,
  title,
  description,
  roleLabel,
  backHref = SECTION_PATHS.overview,
  backLabel = 'Back to Overview',
  secondaryAction,
  headingLevel: Heading = 'h2',
  className,
}: AccessDeniedStateProps) {
  const resolvedTitle =
    title ?? (sectionName ? `Access to ${sectionName} is restricted` : 'Access restricted')

  const resolvedDescription =
    description ??
    (roleLabel && sectionName
      ? `Your current fellowship role (${roleLabel}) does not include permission to view ${sectionName}. Contact a CSGB administrator if your assignment has changed.`
      : roleLabel
        ? `Your current fellowship role (${roleLabel}) does not include permission to view this section. Contact a CSGB administrator if your assignment has changed.`
        : sectionName
          ? `Your current fellowship role does not include permission to view ${sectionName}. Contact a CSGB administrator if your assignment has changed.`
          : 'Your current fellowship role does not include permission to view this section. Contact a CSGB administrator if your assignment has changed.')

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border-0 bg-card px-6 py-12 text-center shadow-sm sm:py-16',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
      >
        <ShieldAlert className="h-6 w-6 shrink-0" />
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        403 · Restricted Section
      </p>

      <Heading className="mt-2 font-sans text-lg font-semibold text-foreground text-balance sm:text-xl">
        {resolvedTitle}
      </Heading>

      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
        {resolvedDescription}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 [&_a]:min-h-11 [&_button]:min-h-11">
        <Button asChild variant="default" className="h-auto min-h-11 px-5 py-2.5 focus-visible:ring-2">
          <Link href={backHref}>
            <ArrowLeft aria-hidden="true" />
            {backLabel}
          </Link>
        </Button>
        {secondaryAction}
      </div>
    </div>
  )
}
