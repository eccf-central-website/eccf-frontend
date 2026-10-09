/**
 * StatCard — one overview figure: label, icon, big number, caption and an
 * optional link to the section it summarises.
 *
 * Server Component (icons are rendered here, never passed to the client).
 * Accessibility:
 *   - The label is the card's heading and the figure follows it directly,
 *     so screen readers read "Pending welfare, 3" together.
 *   - `tone` colours only the icon chip (solid token pairs that meet AA);
 *     callers put the meaning in words too ("Needs follow-up", "Deficit"),
 *     so colour is never the only signal. Gold is never used as text.
 *   - The link is a short "View …" link stretched over the whole card, so
 *     the card is one 40 px+ target without a verbose accessible name.
 */

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatTone = 'primary' | 'success' | 'warning' | 'destructive' | 'muted'

const TONE_CHIP: Record<StatTone, string> = {
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  muted: 'bg-muted text-muted-foreground',
}

export interface StatCardProps {
  /** Stable, page-unique id used to label the card. */
  id: string
  label: string
  /** Rendered icon element, e.g. `<UserPlus />`. */
  icon: React.ReactNode
  /** Display figure, already formatted ("12", "₦86,500", "—"). */
  value: string
  /** Machine-readable figure for <data value>; omit when there is none. */
  rawValue?: number
  caption?: React.ReactNode
  tone?: StatTone
  /** Section link; omit when the role can't access the section. */
  href?: string
  linkLabel?: string
  /** h4 when the card sits under a group heading. */
  headingLevel?: 'h3' | 'h4'
  className?: string
}

export default function StatCard({
  id,
  label,
  icon,
  value,
  rawValue,
  caption,
  tone = 'primary',
  href,
  linkLabel,
  headingLevel: Heading = 'h3',
  className,
}: StatCardProps) {
  const labelId = `${id}-label`

  return (
    <article
      aria-labelledby={labelId}
      className={cn(
        'relative flex flex-col rounded-xl border bg-card p-5 text-card-foreground shadow sm:p-6',
        href && 'transition-colors hover:border-primary/40 focus-within:ring-2 focus-within:ring-ring',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <Heading id={labelId} className="text-sm font-medium text-muted-foreground">
          {label}
        </Heading>
        <div
          aria-hidden="true"
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg [&_svg]:h-5 [&_svg]:w-5',
            TONE_CHIP[tone]
          )}
        >
          {icon}
        </div>
      </div>

      <p className="mt-2 break-words font-serif text-3xl leading-tight text-foreground">
        {rawValue === undefined ? value : <data value={rawValue}>{value}</data>}
      </p>
      {caption && <p className="mt-1 text-sm text-muted-foreground">{caption}</p>}

      {href && linkLabel && (
        <Link
          href={href}
          className="mt-3 inline-flex min-h-10 items-center gap-1 self-start text-sm font-medium text-primary underline-offset-4 after:absolute after:inset-0 after:rounded-xl after:content-[''] hover:underline focus-visible:outline-none"
        >
          {linkLabel}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      )}
    </article>
  )
}
