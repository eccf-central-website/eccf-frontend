/**
 * Route-Level RBAC Guard & Preview Bridge — middleware.ts
 *
 * Implements SDD §4.2, §6.2, and §7.3:
 * - Intercepts all requests to /dashboard/:path*
 * - Decodes NextAuth JWT session token
 * - Redirects unauthenticated requests to /login
 * - Enforces role-to-section access according to the RBAC matrix
 * - Redirects unauthorized section requests to /dashboard?denied=<section>
 * - Detects ?preview=true or draft cookies and bridges preview state to Server Components
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getAuthSecret } from '@/lib/env'
import { canAccessSection, isWorkerRole, sectionForPath, SECTION_PATHS } from '@/lib/dashboard/rbac'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPreviewParam = req.nextUrl.searchParams.get('preview') === 'true'
  const isPreviewCookie = req.cookies.get('preview')?.value === 'true' || req.cookies.has('__prerender_bypass')
  const isPreview = isPreviewParam || isPreviewCookie

  const requestHeaders = new Headers(req.headers)
  if (isPreview) {
    requestHeaders.set('x-preview-mode', 'true')
  }

  // When DASHBOARD_MOCK_AUTH=1 is set outside production, pass through
  const isMockAuth = process.env.NODE_ENV !== 'production' && process.env.DASHBOARD_MOCK_AUTH === '1'

  if (pathname.startsWith('/dashboard') && !isMockAuth) {
    const token = await getToken({
      req,
      secret: getAuthSecret(),
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
    if (section && !canAccessSection(role, section, { team: token.team as string, excoPosition: token.excoPosition as string })) {
      const deniedUrl = new URL(SECTION_PATHS.overview, req.url)
      deniedUrl.searchParams.set('denied', section)
      return NextResponse.redirect(deniedUrl)
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // If preview parameter is present, set partitioned SameSite=None cookie for seamless iframe rendering
  if (isPreviewParam && !req.cookies.has('preview')) {
    response.cookies.set('preview', 'true', {
      path: '/',
      sameSite: 'none',
      secure: true,
      maxAge: 60 * 60 * 24, // 24 hours
    })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
