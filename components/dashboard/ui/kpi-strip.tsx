import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type KpiTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'gold'

export interface KpiStripItem {
  id?: string
  label: string
  /** Formatted metric figure (e.g. "42", "₦86,500", "94%"). */
  value: string
  /** Machine-readable value for <data value>; defaults to `value`. */
  rawValue?: number | string
  /** Optional contextual detail (>= 13px). */
  caption?: React.ReactNode
  /** Optional icon shown inside a subtle tonal chip. */
  icon?: React.ReactNode
  tone?: KpiTone
  /** Makes the tile a semantic link. */
  href?: string
  /** Makes the tile an interactive button (e.g. quick filter). */
  onClick?: () => void
  /** Highlights the tile when acting as an active filter. */
  active?: boolean
  /** Accessible label override for interactive tiles. */
  ariaLabel?: string
}

export interface KpiStripProps {
  items: KpiStripItem[]
  /** Optional accessible section label. */
  ariaLabel?: string
  className?: string
}

const TONE_ICON_CHIP: Record<KpiTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-accent-foreground dark:text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/20 text-warning-foreground dark:bg-warning/15 dark:text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  gold: 'bg-gold/20 text-gold-foreground dark:bg-gold/15 dark:text-gold',
}

const TONE_DOT: Record<KpiTone, string> = {
  neutral: 'bg-muted-foreground',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  gold: 'bg-gold',
}

function getGridColumnsClass(count: number): string {
  if (count <= 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-1 min-[420px]:grid-cols-2'
  if (count === 3) return 'grid-cols-1 sm:grid-cols-3'
  return 'grid-cols-2 lg:grid-cols-4'
}

export function KpiStrip({ items, ariaLabel, className }: KpiStripProps) {
  if (items.length === 0) return null

  const Container = ariaLabel ? 'section' : 'div'

  return (
    <Container
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
      className={cn(
        'rounded-[var(--radius-card)] bg-card p-1.5 shadow-sm sm:p-2',
        className
      )}
    >
      <div className={cn('grid gap-1 sm:gap-1.5', getGridColumnsClass(items.length))}>
        {items.map((item, idx) => {
          const tone = item.tone ?? 'neutral'
          const interactive = Boolean(item.href || item.onClick)
          const tileClassName = cn(
            'group flex min-w-0 flex-col justify-between gap-2 rounded-[calc(var(--radius-card)-4px)] p-3 text-left transition-colors sm:p-4',
            item.active
              ? 'bg-surface-raised ring-1 ring-inset ring-primary/35'
              : interactive
                ? 'hover:bg-surface-raised/80'
                : 'bg-transparent',
            interactive &&
              'min-h-11 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card'
          )

          const content = (
            <>
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px] font-medium leading-snug text-muted-foreground">
                  {!item.icon && tone !== 'neutral' && (
                    <span
                      aria-hidden="true"
                      className={cn('h-2 w-2 shrink-0 rounded-full', TONE_DOT[tone])}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </span>
                {item.icon && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] [&_svg]:h-4 [&_svg]:w-4',
                      TONE_ICON_CHIP[tone]
                    )}
                  >
                    {item.icon}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <p className="font-sans text-xl font-semibold leading-tight tracking-tight tabular-nums text-foreground sm:text-2xl">
                  <data value={String(item.rawValue ?? item.value)}>
                    {item.value}
                  </data>
                </p>
                {item.caption && (
                  <div className="text-[13px] leading-snug text-muted-foreground">
                    {item.caption}
                  </div>
                )}
              </div>
            </>
          )

          const key = item.id ?? `${item.label}-${idx}`

          if (item.href) {
            return (
              <Link
                key={key}
                href={item.href}
                aria-label={item.ariaLabel ?? `${item.label}: ${item.value}`}
                aria-current={item.active ? 'page' : undefined}
                className={tileClassName}
              >
                {content}
              </Link>
            )
          }

          if (item.onClick) {
            return (
              <button
                key={key}
                type="button"
                onClick={item.onClick}
                aria-pressed={item.active}
                aria-label={item.ariaLabel ?? `${item.label}: ${item.value}`}
                className={tileClassName}
              >
                {content}
              </button>
            )
          }

          return (
            <div key={key} className={tileClassName}>
              {content}
            </div>
          )
        })}
      </div>
    </Container>
  )
}
