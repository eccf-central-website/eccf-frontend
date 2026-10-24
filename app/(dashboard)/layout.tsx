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
import { ThemeProvider, THEME_STORAGE_KEY } from '@/components/dashboard/theme/ThemeProvider'
import './dashboard.css'

export const metadata: Metadata = {
  title: 'Exco Dashboard — ECCF',
  robots: { index: false, follow: false },
}

// Blocking script: paints the dashboard dark before hydration so there is no
// white flash. Only an explicitly stored 'light' preference opts out — keep
// this in sync with the ThemeProvider defaults above.
const themeBootScript = `(function(){try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`

export default function DashboardGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {/* Blocking script: paints the dashboard dark before hydration so there
          is no white flash. Only an explicitly stored 'light' preference opts
          out; kept in sync with the ThemeProvider defaults. */}
      <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      <ThemeProvider>
        <TooltipProvider delayDuration={200}>
          <div
            data-dashboard-root
            className="flex min-h-dvh flex-1 flex-col bg-background text-foreground transition-colors duration-150"
          >
            {children}
          </div>
          {/* Toasts portal to body, outside the themed root — they still
              pick up .dark because it is toggled on <html>. */}
          <Toaster position="top-center" richColors closeButton />
        </TooltipProvider>
      </ThemeProvider>
    </>
  )
}
