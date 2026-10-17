'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/dashboard/rbac'
import { getSession } from '@/lib/dashboard/auth'

export async function syncSermonsAction() {
  const session = await getSession()
  // No session means refused, in every environment. Local testing uses the
  // DASHBOARD_MOCK_AUTH mock session instead of an implicit admin.
  if (!session) {
    return { success: false, error: 'Unauthorized: Authentication required.' }
  }
  const role = session.role

  try {
    requirePermission(role, 'sermons:sync')
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  const secret = process.env.CRON_SECRET
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    return { success: false, error: 'CRON_SECRET is not configured on the server.' }
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/sync-sermons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `Sync failed (${res.status}): ${errText}` }
    }

    const data = await res.json()
    revalidatePath('/')
    revalidatePath('/sermons')
    revalidatePath('/dashboard')

    return { success: true, ...data }
  } catch (err) {
    console.error('[syncSermonsAction] Failed to trigger sermon sync:', err)
    return { success: false, error: 'Failed to connect to sermon sync endpoint.' }
  }
}
