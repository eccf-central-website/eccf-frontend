import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Info,
  Star,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] px-2.5 py-1 text-[13px] font-medium leading-none',
  {
    variants: {
      variant: {
        neutral: 'bg-muted text-muted-foreground',
        primary: 'bg-primary/10 text-accent-foreground dark:text-primary',
        info: 'bg-accent text-accent-foreground',
        success: 'bg-success/10 text-success',
        warning:
          'bg-warning/20 text-warning-foreground dark:bg-warning/15 dark:text-warning',
        destructive: 'bg-destructive/10 text-destructive',
        gold: 'bg-gold/20 text-gold-foreground dark:bg-gold/15 dark:text-gold',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
)

export type StatusBadgeVariant = NonNullable<
  VariantProps<typeof statusBadgeVariants>['variant']
>

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Custom icon element; when omitted, renders a semantic icon or dot. */
  icon?: React.ReactNode
  /** Render a compact indicator dot instead of an icon when `icon` is omitted. */
  dot?: boolean
}

function DefaultIndicator({
  variant,
  dot,
}: {
  variant: StatusBadgeVariant
  dot?: boolean
}) {
  if (dot || variant === 'neutral') {
    return (
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
      />
    )
  }

  switch (variant) {
    case 'primary':
      return <CircleDot className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    case 'info':
      return <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    case 'success':
      return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    case 'warning':
      return <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    case 'destructive':
      return <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    case 'gold':
      return <Star className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
  }
}

export function StatusBadge({
  className,
  variant = 'neutral',
  icon,
  dot,
  children,
  ...props
}: StatusBadgeProps) {
  const resolvedVariant: StatusBadgeVariant = variant ?? 'neutral'

  return (
    <span
      data-status-badge
      className={cn(statusBadgeVariants({ variant: resolvedVariant }), className)}
      {...props}
    >
      {icon !== undefined ? (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center [&_svg]:h-3.5 [&_svg]:w-3.5">
          {icon}
        </span>
      ) : (
        <DefaultIndicator variant={resolvedVariant} dot={dot} />
      )}
      <span>{children}</span>
    </span>
  )
}

export { statusBadgeVariants }
