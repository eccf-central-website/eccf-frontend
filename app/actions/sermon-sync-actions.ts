'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/dashboard/rbac'
import { getSession } from '@/lib/dashboard/auth'
import { runSermonSync } from '@/lib/sermonSync'

export async function syncSermonsAction() {
  const session = await getSession()
  if (!session && process.env.NODE_ENV === 'production') {
    return { success: false, error: 'Unauthorized: Authentication required.' }
  }
  const role = session?.role ?? 'admin'

  try {
    requirePermission(role, 'sermons:sync')
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  try {
    const data = await runSermonSync()
    revalidatePath('/')
    revalidatePath('/sermons')
    revalidatePath('/dashboard')

    return { success: true, ...data }
  } catch (err) {
    console.error('[syncSermonsAction] Failed to execute sermon sync:', err)
    return { success: false, error: 'Failed to complete sermon sync.' }
  }
}
