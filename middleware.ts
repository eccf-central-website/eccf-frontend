/**
 * Route-Level RBAC Guard — middleware.ts
 *
 * Implements SDD §4.2, §6.2, and §7.3:
 * - Intercepts all requests to /dashboard/:path*
 * - Decodes NextAuth JWT session token
 * - Redirects unauthenticated requests to /login
 * - Enforces role-to-section access according to the RBAC matrix
 * - Redirects unauthorized section requests to /dashboard?denied=<section>
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { canAccessSection, isWorkerRole, sectionForPath, SECTION_PATHS } from '@/lib/dashboard/rbac'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // When DASHBOARD_MOCK_AUTH=1 is set outside production, pass through
  const isMockAuth = process.env.NODE_ENV !== 'production' && process.env.DASHBOARD_MOCK_AUTH === '1'
  if (isMockAuth) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({
      req,
      secret:
        process.env.NEXTAUTH_SECRET ||
        process.env.AUTH_SECRET ||
        'eccf-secret-session-key-production-fallback',
    })

    if (!token) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = token.role
    if (!isWorkerRole(role)) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('error', 'UnauthorizedRole')
      return NextResponse.redirect(loginUrl)
    }

    // Check RBAC section boundary
    const section = sectionForPath(pathname)
    if (section && !canAccessSection(role, section)) {
      const deniedUrl = new URL(SECTION_PATHS.overview, req.url)
      deniedUrl.searchParams.set('denied', section)
      return NextResponse.redirect(deniedUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
