'use client'

import * as React from 'react'
import { AlertTriangle, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/dashboard/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dashboard/ui/dialog'

export type ConfirmDialogTone = 'destructive' | 'warning' | 'primary'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Action-oriented title clearly naming the target object and action. */
  title: string
  /** Explains why confirmation is requested. */
  description?: React.ReactNode
  /** Highlighted summary banner detailing consequences of the action. */
  effectSummary?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmDialogTone
  loading?: boolean
  loadingLabel?: string
  confirmDisabled?: boolean
  children?: React.ReactNode
  onConfirm: () => void | Promise<void>
  className?: string
}

const SUMMARY_TONE: Record<ConfirmDialogTone, string> = {
  destructive: 'bg-destructive/10 text-destructive',
  warning:
    'bg-warning/20 text-warning-foreground dark:bg-warning/15 dark:text-warning',
  primary: 'bg-primary/10 text-accent-foreground dark:text-primary',
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  effectSummary,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'destructive',
  loading = false,
  loadingLabel,
  confirmDisabled = false,
  children,
  onConfirm,
  className,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next)
      }}
    >
      <DialogContent
        className={cn('sm:max-w-[440px]', className)}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          if (loading) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-sans text-lg font-semibold leading-snug text-foreground">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground [text-wrap:pretty]">
              {description}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">
              Confirm this action before proceeding.
            </DialogDescription>
          )}
        </DialogHeader>

        {effectSummary && (
          <div
            role="note"
            className={cn(
              'flex items-start gap-2.5 rounded-[var(--radius-control)] px-3.5 py-3 text-sm leading-relaxed',
              SUMMARY_TONE[tone]
            )}
          >
            {tone === 'primary' ? (
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 flex-1">{effectSummary}</div>
          </div>
        )}

        {children}

        <DialogFooter className="gap-2 pt-1 sm:gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            aria-busy={loading || undefined}
            className={cn(
              'w-full sm:w-auto',
              tone === 'warning' &&
                'bg-warning text-warning-foreground hover:bg-warning/90'
            )}
          >
            {loading && (
              <Loader2
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            <span>{loading ? (loadingLabel ?? confirmLabel) : confirmLabel}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
