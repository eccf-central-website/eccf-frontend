/**
 * Root 404 — rendered outside any route group, so it reuses the public
 * site layout to keep the Navbar/Footer it had before the (public) split.
 */

import Link from 'next/link'
import PublicLayout from './(public)/layout'

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 pt-28 text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0077cc]">404</p>
        <h1 className="mt-2 font-serif text-3xl text-slate-950 sm:text-4xl">Page not found</h1>
        <p className="mt-3 max-w-md text-slate-600">The page you are looking for has moved or no longer exists.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0095ff] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-500/20 transition-colors hover:bg-[#0080e0]"
        >
          Back to home
        </Link>
      </div>
    </PublicLayout>
  )
}
