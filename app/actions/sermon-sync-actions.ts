'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission, isMediaLeader } from '@/lib/dashboard/rbac'
import { getSession } from '@/lib/dashboard/auth'
import { runSermonSync } from '@/lib/sermonSync'

export async function syncSermonsAction() {
  const session = await getSession()
  if (!session) {
    return { success: false, error: 'Unauthorized: Authentication required.' }
  }

  if (!isMediaLeader(session) && session.role !== 'admin' && process.env.NODE_ENV === 'production') {
    return { success: false, error: 'Permission denied: CSGB or Media Team leaders only.' }
  }

  try {
    requirePermission(session.role, 'sermons:sync')
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  try {
    const data = await runSermonSync()
    revalidatePath('/')
    revalidatePath('/sermons')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/sermons')

    return { success: true, ...data }
  } catch (err) {
    console.error('[syncSermonsAction] Failed to execute sermon sync:', err)
    return { success: false, error: 'Failed to complete sermon sync.' }
  }
}
