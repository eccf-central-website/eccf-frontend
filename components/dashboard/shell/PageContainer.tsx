/**
 * PageContainer — the content column every dashboard page renders in.
 * Shared by pages and their loading.tsx/error.tsx so a skeleton occupies
 * exactly the space the real page will, with no jump when it streams in.
 */

import { cn } from '@/lib/utils'

export default function PageContainer({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn('mx-auto w-full max-w-6xl space-y-4 px-3 py-6 sm:space-y-6 sm:px-4 sm:py-8 lg:px-6 lg:py-10 min-w-0', className)}>{children}</div>
}
