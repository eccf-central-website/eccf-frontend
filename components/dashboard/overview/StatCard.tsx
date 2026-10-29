/**
 * StatCard — aligned KPI card component.
 *
 * Implements fixed-row anatomy:
 * - Row 1: Label + icon chip
 * - Row 2: Large tabular figure
 * - Row 3: Cohesive caption phrases that stack cleanly on mobile
 * - Distinct light-mode contrast against mist canvas and borderless tonal dark elevation.
 *
 * When `href` is present the entire card is a single real link (no hidden
 * overlay anchor), so keyboard, screen-reader, and pointer users all get the
 * same target and a visible focus ring.
 */

import Link from 'next/link'
import { cn } from '@/lib/utils'

export type StatTone = 'primary' | 'success' | 'warning' | 'destructive' | 'muted'

/** Soft tint-of-token chips — colour as a subtle wash. */
const TONE_CHIP: Record<StatTone, string> = {
  primary: 'bg-primary/10 text-primary dark:text-[#70a3ff]',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  destructive: 'bg-destructive/10 text-destructive',
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
  /** Accessible name for the whole-card link. */
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

  const cardClassName = cn(
    'group relative flex min-h-[136px] flex-col justify-between rounded-2xl bg-card p-4 text-card-foreground shadow-sm transition-all duration-150 sm:min-h-[148px] sm:p-5',
    'border-0 hover:shadow-md',
    href &&
      'cursor-pointer hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    className
  )

  const body = (
    <>
      {/* Row 1: Label + Icon */}
      <div className="flex items-start justify-between gap-2">
        <Heading
          id={labelId}
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm"
        >
          {label}
        </Heading>
        <div
          aria-hidden="true"
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 [&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-5 sm:[&_svg]:w-5',
            TONE_CHIP[tone]
          )}
        >
          {icon}
        </div>
      </div>

      {/* Row 2: Figure */}
      <div className="my-1">
        <p className="break-words font-mono text-2xl font-bold leading-none tracking-tight tabular-nums text-foreground sm:text-3xl">
          {rawValue === undefined ? value : <data value={rawValue}>{value}</data>}
        </p>
      </div>

      {/* Row 3: Caption — phrases stack on mobile as whole units */}
      {caption && (
        <div className="flex flex-col gap-0.5 text-xs font-normal text-muted-foreground sm:flex-row sm:items-center sm:gap-2 sm:text-sm">
          {caption}
        </div>
      )}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        aria-label={linkLabel ? `${linkLabel}: ${label}` : `${label}: ${value}`}
        className={cardClassName}
      >
        {body}
      </Link>
    )
  }

  return (
    <article aria-labelledby={labelId} className={cardClassName}>
      {body}
    </article>
  )
}
