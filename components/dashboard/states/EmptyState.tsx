/**
 * EmptyState — shown when a list, ledger or overview has nothing to show.
 *
 * Two variants with different meanings:
 *   - `nothing-yet`: the collection is genuinely empty (a blank ledger).
 *     Pair with an "Add the first entry" action where the role can add.
 *   - `no-results`: data exists but the current search/filters match none.
 *     Pair with a "Clear filters" action. Announced politely (role="status")
 *     so screen-reader users hear the result of their filter change.
 *
 * Server-Component-safe. `icon` is a rendered element (e.g. `<Users />`),
 * not a component reference, so it can be passed from a Server Component
 * into a client table/feed without hitting the serialisation boundary.
 */

import { Inbox, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'

export type EmptyStateVariant = 'nothing-yet' | 'no-results'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title: string
  description?: string
  /** Rendered icon element; defaults to Inbox (nothing-yet) or SearchX (no-results). */
  icon?: React.ReactNode
  /** CTA slot: a Link-as-Button ("Add the first entry") or a client button ("Clear filters"). */
  action?: React.ReactNode
  headingLevel?: 'h2' | 'h3'
  className?: string
}

const DEFAULT_ICONS: Record<EmptyStateVariant, React.ReactNode> = {
  'nothing-yet': <Inbox />,
  'no-results': <SearchX />,
}

export default function EmptyState({
  variant = 'nothing-yet',
  title,
  description,
  icon,
  action,
  headingLevel: Heading = 'h2',
  className,
}: EmptyStateProps) {
  return (
    <div
      role={variant === 'no-results' ? 'status' : undefined}
      className={cn(
        'flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-12 text-center sm:py-16',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground [&_svg]:h-6 [&_svg]:w-6"
      >
        {icon ?? DEFAULT_ICONS[variant]}
      </div>
      <Heading className="mt-4 font-serif text-xl text-foreground">{title}</Heading>
      {description && <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
