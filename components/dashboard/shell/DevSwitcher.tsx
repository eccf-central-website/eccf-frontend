/**
 * DevSwitcher — dev-only section of the user menu for switching the mock
 * session's role and the mock data state (normal / empty / error / slow).
 *
 * Rendered only when the server layout sees isMockAuthEnabled(); the
 * Server Actions re-check that gate themselves, so this has no reachable
 * behaviour in production.
 */

'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { WorkerRole } from '@/types'
import { ROLE_LABELS, ROLES } from '@/lib/dashboard/rbac'
import { DEV_MOCK_STATES, type DevMockState } from '@/lib/dashboard/shell'
import { setDevMockState, setDevRole } from '@/lib/dashboard/dev-actions'
import type { ActionResult } from '@/lib/dashboard/action-result'
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/dashboard/ui/dropdown-menu'

const MOCK_STATE_LABELS: Record<DevMockState, string> = {
  normal: 'Normal',
  empty: 'Empty',
  error: 'Error',
  slow: 'Slow (1.5s)',
}

interface DevSwitcherProps {
  role: WorkerRole
  mockState: DevMockState
}

export default function DevSwitcher({ role, mockState }: DevSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const run = (action: () => Promise<ActionResult>, success: string) => {
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(success)
      router.refresh()
    })
  }

  return (
    <>
      <DropdownMenuLabel className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warning-foreground">
        <FlaskConical aria-hidden="true" className="h-4 w-4 text-warning" />
        Developer
        {isPending && <Loader2 aria-label="Switching" className="ml-auto h-4 w-4 animate-spin" />}
      </DropdownMenuLabel>

      <DropdownMenuLabel className="pb-0 text-xs font-medium text-muted-foreground">Mock role</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={role}
        onValueChange={(value) => run(() => setDevRole(value), `Switched to ${ROLE_LABELS[value as WorkerRole]}`)}
      >
        {ROLES.map((r) => (
          <DropdownMenuRadioItem key={r} value={r} disabled={isPending} className="h-10">
            {ROLE_LABELS[r]}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>

      <DropdownMenuSeparator />
      <DropdownMenuLabel className="pb-0 text-xs font-medium text-muted-foreground">Mock data</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={mockState}
        onValueChange={(value) =>
          run(() => setDevMockState(value), `Mock data: ${MOCK_STATE_LABELS[value as DevMockState]}`)
        }
      >
        {DEV_MOCK_STATES.map((state) => (
          <DropdownMenuRadioItem key={state} value={state} disabled={isPending} className="h-10">
            {MOCK_STATE_LABELS[state]}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  )
}
