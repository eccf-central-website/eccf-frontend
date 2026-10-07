/**
 * Dashboard Route-Group Layout — theme + global UI providers for the Exco
 * Dashboard and its sign-in page. Deliberately has no sidebar so /login can
 * share the theme; the authenticated shell lives in dashboard/layout.tsx.
 *
 * The shadcn/ui token sheet is imported here and nowhere else, keeping the
 * dashboard's styling and libraries out of the public site.
 */

import type { Metadata } from 'next'
import { Toaster } from '@/components/dashboard/ui/sonner'
import { TooltipProvider } from '@/components/dashboard/ui/tooltip'
import './dashboard.css'

export const metadata: Metadata = {
  title: 'Exco Dashboard — ECCF',
  robots: { index: false, follow: false },
}

export default function DashboardGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-1 flex-col bg-background text-foreground">{children}</div>
      <Toaster position="top-center" richColors closeButton />
    </TooltipProvider>
  )
}
