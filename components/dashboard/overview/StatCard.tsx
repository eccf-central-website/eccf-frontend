/**
 * StatCard — aligned KPI card component.
 *
 * Implements fixed-row anatomy:
 * - Row 1: Label + icon chip
 * - Row 2: Large tabular figure
 * - Row 3: Cohesive caption phrases that stack cleanly on mobile
 * - Distinct light-mode contrast against mist canvas and borderless tonal dark elevation.
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
  headingLevel: Heading = 'h3',
  className,
}: StatCardProps) {
  const labelId = `${id}-label`

  const cardContent = (
    <article
      aria-labelledby={labelId}
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl bg-card p-4 text-card-foreground shadow-sm sm:p-5 transition-all duration-150',
        'border border-border/60 dark:border-white/[0.06] hover:shadow-md min-h-[136px] sm:min-h-[148px]',
        href && 'cursor-pointer hover:border-primary/40 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
    >
      {/* Row 1: Label + Icon */}
      <div className="flex items-start justify-between gap-2">
        <Heading id={labelId} className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-muted-foreground">
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
        <p className="break-words font-mono font-bold tabular-nums tracking-tight text-2xl leading-none text-foreground sm:text-3xl">
          {rawValue === undefined ? value : <data value={rawValue}>{value}</data>}
        </p>
      </div>

      {/* Row 3: Caption — phrases stack on mobile as whole units */}
      {caption && (
        <div className="text-xs sm:text-sm text-muted-foreground font-normal flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          {caption}
        </div>
      )}

      {href && (
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl focus:outline-none"
        />
      )}
    </article>
  )

  return cardContent
}
