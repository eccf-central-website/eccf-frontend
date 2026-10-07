/**
 * DeniedToast — when requireSection() bounces a role to the overview with
 * `?denied=<section>`, show an error toast once and strip the param so a
 * reload or back-navigation doesn't repeat it.
 */

'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { SECTION_PATHS, type DashboardSection } from '@/lib/dashboard/rbac'
import { navItemForSection } from './nav-items'

function isSection(value: string | null): value is DashboardSection {
  return value !== null && Object.prototype.hasOwnProperty.call(SECTION_PATHS, value)
}

export default function DeniedToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const denied = searchParams.get('denied')

  useEffect(() => {
    if (!denied) return

    const label = isSection(denied) ? navItemForSection(denied).label : 'that page'
    // Deferred one tick so the <Toaster/> mounted in the same commit has
    // subscribed; the cleanup also dedupes StrictMode's double effect run.
    const timer = setTimeout(() => {
      toast.error(`You don't have access to ${label}.`, {
        id: 'dashboard-denied',
        description: 'Ask an admin if you think you should.',
      })
      router.replace(pathname, { scroll: false })
    }, 0)
    return () => clearTimeout(timer)
  }, [denied, pathname, router])

  return null
}
