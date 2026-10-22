'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { UserPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { registerChaplain } from '@/app/actions/executive-approval-actions'
import { toastSuccess, toastError } from '@/lib/dashboard/toast'

export default function ChaplainRegistrationCard() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await registerChaplain({ email, fullName })
      if (result.ok) {
        toastSuccess('Chaplain registered successfully.')
        setEmail('')
        setFullName('')
      } else {
        toastError(result.error)
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <UserPlus className="h-4 w-4" />
        </div>
        <h2 className="font-serif font-bold text-lg text-foreground">Register Chaplain</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        The Fellowship President may register a Chaplain by email. Chaplains inherit president-level views and authority.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          type="email"
          placeholder="chaplain@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" disabled={isPending || !email.trim()}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Chaplain'}
        </Button>
      </form>
    </div>
  )
}
