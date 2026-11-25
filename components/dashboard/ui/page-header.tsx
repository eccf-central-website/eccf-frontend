import * as React from 'react'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  /** Optional short uppercase eyebrow (e.g. Lagos date or section category). */
  eyebrow?: string
  /** Page heading rendered as the single <h1> in Belleza. */
  title: string
  /** Supporting summary in Work Sans, capped to readable measure. */
  description?: string
  /** Optional status/count badge rendered inline beside the title. */
  badge?: React.ReactNode
  /** Primary CTA placed at the trailing edge of the header. */
  primaryAction?: React.ReactNode
  /** Secondary actions rendered beside the primary CTA. */
  secondaryActions?: React.ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  primaryAction,
  secondaryActions,
  className,
}: PageHeaderProps) {
  const hasActions = Boolean(primaryAction || secondaryActions)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4',
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-heading font-normal text-[1.75rem] leading-[2.125rem] tracking-tight text-foreground [text-wrap:balance] sm:text-[2rem] sm:leading-[2.375rem]">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="max-w-[75ch] font-sans text-sm leading-relaxed text-muted-foreground [text-wrap:pretty] sm:text-[0.9375rem]">
            {description}
          </p>
        )}
      </div>

      {hasActions && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </div>
  )
}
