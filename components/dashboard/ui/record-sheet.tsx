'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/dashboard/ui/sheet'

export interface RecordSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Optional metadata or status badge rendered above the title inside the sticky header. */
  headerExtra?: React.ReactNode
  children: React.ReactNode
  /** Optional sticky footer slot (e.g. primary/secondary actions). */
  footer?: React.ReactNode
  side?: 'right' | 'left' | 'bottom'
  className?: string
  bodyClassName?: string
}

export function RecordSheet({
  open,
  onOpenChange,
  title,
  description,
  headerExtra,
  children,
  footer,
  side = 'right',
  className,
  bodyClassName,
}: RecordSheetProps) {
  const isBottom = side === 'bottom'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          'flex flex-col gap-0 border-border/60 bg-card p-0 text-card-foreground',
          isBottom
            ? 'max-h-[90dvh] w-full rounded-t-[var(--radius-panel)]'
            : 'h-full w-full sm:max-w-[480px]',
          className
        )}
      >
        <SheetHeader className="sticky top-0 z-10 shrink-0 border-b border-border/50 bg-card px-5 py-4 pr-14 text-left sm:px-6">
          {headerExtra && <div className="mb-1">{headerExtra}</div>}
          <SheetTitle className="font-sans text-lg font-semibold leading-snug text-foreground">
            {title}
          </SheetTitle>
          {description ? (
            <SheetDescription className="text-sm text-muted-foreground [text-wrap:pretty]">
              {description}
            </SheetDescription>
          ) : (
            <SheetDescription className="sr-only">
              Record details
            </SheetDescription>
          )}
        </SheetHeader>

        <div
          className={cn(
            'flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6',
            bodyClassName
          )}
        >
          {children}
        </div>

        {footer && (
          <SheetFooter
            className="sticky bottom-0 z-10 shrink-0 border-t border-border/50 bg-card px-5 py-4 sm:px-6"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
