/**
 * Dashboard toast helpers — the only way dashboard code should raise a
 * toast, so durations, dedupe ids and Server Action handling stay uniform.
 * Styling lives on <Toaster/> (components/dashboard/ui/sonner.tsx).
 *
 * Client-side only (sonner renders in the browser); call from Client
 * Components and event handlers, never from Server Components or actions.
 *
 * Messages must be user-facing copy: never raw exception text and never
 * personal data (phone/room numbers). ActionResult.error is already
 * curated server-side, so toastFromResult can show it as-is.
 */

import { toast } from 'sonner'
import type { ActionResult } from './action-result'

/** Stable ids for toasts that must not stack (the newest replaces the last). */
export const TOAST_IDS = {
  denied: 'dashboard-denied',
  devSwitch: 'dashboard-dev-switch',
} as const

const SUCCESS_DURATION = 4000
// Errors stay longer: the user needs time to read what went wrong.
const ERROR_DURATION = 8000

export interface DashboardToastOptions {
  /** Dedupe key; reuse one from TOAST_IDS where it matters. */
  id?: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function toastSuccess(message: string, opts: DashboardToastOptions = {}) {
  return toast.success(message, { ...opts, duration: SUCCESS_DURATION })
}

export function toastError(message: string, opts: DashboardToastOptions = {}) {
  return toast.error(message, { ...opts, duration: ERROR_DURATION })
}

interface FromResultOptions<T> extends Omit<DashboardToastOptions, 'action'> {
  /** Success copy, or a builder from the action's data. */
  success: string | ((data: T) => string)
}

/**
 * Toast a Server Action's result: success copy when ok, the action's
 * curated error otherwise. Returns whether it succeeded, so callers can
 * write `if (toastFromResult(result, { success: 'Saved' })) form.reset()`.
 */
export function toastFromResult<T>(
  result: ActionResult<T>,
  { success, ...opts }: FromResultOptions<T>
): result is Extract<ActionResult<T>, { ok: true }> {
  if (result.ok) {
    toastSuccess(typeof success === 'function' ? success(result.data) : success, opts)
    return true
  }
  toastError(result.error, { id: opts.id })
  return false
}
