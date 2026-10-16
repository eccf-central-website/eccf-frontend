'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/dashboard/rbac'

export async function syncSermonsAction(session?: { role: string; name: string }) {
  if (!session && process.env.NODE_ENV === 'production') {
    return { success: false, error: 'Unauthorized: Authentication required' }
  }
  const currentSession = session ?? { role: 'admin', name: 'Admin' }

  try {
    requirePermission(currentSession.role, 'sermons')
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  // Call the existing API route that performs the RSS ingestion
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/sync-sermons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const err = await res.text()
    return { success: false, error: err }
  }

  const data = await res.json()
  // Revalidate affected pages so new sermons appear immediately
  revalidatePath('/sermons')
  revalidatePath('/')

  return { success: true, ...data }
}
