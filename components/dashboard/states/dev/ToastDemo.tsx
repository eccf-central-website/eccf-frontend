/**
 * Dev-only demo controls for the UI states gallery: fire each toast helper
 * (including toastFromResult with ok and failed ActionResults) and a
 * stand-in "Clear filters" action for the no-results EmptyState.
 */

'use client'

import { toastError, toastFromResult, toastSuccess } from '@/lib/dashboard/toast'
import type { ActionResult } from '@/lib/dashboard/action-result'
import { Button } from '@/components/dashboard/ui/button'

const OK: ActionResult<{ count: number }> = { ok: true, data: { count: 3 } }
const FAILED: ActionResult<{ count: number }> = { ok: false, error: 'You do not have permission to do that.' }

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button className="h-10" onClick={() => toastSuccess('Entry saved', { description: 'Sunday Service · 214 attendees' })}>
        Success
      </Button>
      <Button className="h-10" variant="destructive" onClick={() => toastError("Couldn't save the entry", { description: 'Check your connection and try again.' })}>
        Error
      </Button>
      <Button
        className="h-10"
        variant="outline"
        onClick={() => toastFromResult(OK, { success: (data) => `${data.count} requests marked resolved`, id: 'gallery-result' })}
      >
        toastFromResult (ok)
      </Button>
      <Button
        className="h-10"
        variant="outline"
        onClick={() => toastFromResult(FAILED, { success: 'Saved', id: 'gallery-result' })}
      >
        toastFromResult (fail)
      </Button>
    </div>
  )
}

export function ClearFiltersDemo() {
  return (
    <Button className="h-10" variant="outline" onClick={() => toastSuccess('Filters cleared')}>
      Clear filters
    </Button>
  )
}
