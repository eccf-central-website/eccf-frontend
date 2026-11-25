/**
 * DeniedToast — when requireSection() bounces a role to the overview with
 * `?denied=<section>`, show an error toast once and strip the param so a
 * reload or back-navigation doesn't repeat it.
 */

'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { SECTION_PATHS, type DashboardSection } from '@/lib/dashboard/rbac'
import { TOAST_IDS, toastError } from '@/lib/dashboard/toast'
import { navItemForSection } from './nav-items'

function isSection(value: string | null): value is DashboardSection {
  return value !== null && Object.prototype.hasOwnProperty.call(SECTION_PATHS, value)
}

export default function DeniedToast() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const denied = searchParams?.get('denied')
  const shownKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!denied) {
      shownKeyRef.current = null
      return
    }

    const dedupeKey = `${pathname ?? ''}:${denied}`
    if (shownKeyRef.current === dedupeKey) return

    const label = isSection(denied) ? navItemForSection(denied).label : 'that page'
    // Deferred one tick so the <Toaster/> mounted in the same commit has
    // subscribed; the cleanup also dedupes StrictMode's double effect run.
    const timer = setTimeout(() => {
      shownKeyRef.current = dedupeKey
      toastError(`You don't have access to ${label}.`, {
        id: TOAST_IDS.denied,
        description: 'Ask an admin if you think you should.',
      })
      if (pathname && typeof window !== 'undefined') {
        window.history.replaceState(null, '', pathname)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [denied, pathname])

  return null
}
