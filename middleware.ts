/**
 * Route-Level RBAC Guard & Preview Bridge — middleware.ts
 *
 * Implements Clerk Authentication (ADR-003) & SDD §4.2, §6.2, and §7.3:
 * - Protects /dashboard(.*) routes via clerkMiddleware()
 * - Retains DASHBOARD_MOCK_AUTH=1 pass-through outside production
 * - Retains ?preview=true or draft cookies bridging (x-preview-mode)
 * - Redirects /dashboard/login to /login preserving search parameters
 */

import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder'
    ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    : 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k'

const clerkSecretKey =
  process.env.CLERK_SECRET_KEY &&
  process.env.CLERK_SECRET_KEY !== 'sk_test_placeholder'
    ? process.env.CLERK_SECRET_KEY
    : 'sk_test_placeholder_secret_key_1234567890'

export default clerkMiddleware(
  (auth, req) => {
    const { pathname } = req.nextUrl
    const isPreviewParam = req.nextUrl.searchParams.get('preview') === 'true'
    const isPreviewCookie =
      req.cookies.get('preview')?.value === 'true' || req.cookies.has('__prerender_bypass')
    const isPreview = isPreviewParam || isPreviewCookie

    const requestHeaders = new Headers(req.headers)
    if (isPreview) {
      requestHeaders.set('x-preview-mode', 'true')
    }

    // Explicit redirect from /dashboard/login to /login preserving search parameters
    if (pathname === '/dashboard/login' || pathname === '/dashboard/login/') {
      const loginUrl = new URL('/login', req.url)
      req.nextUrl.searchParams.forEach((value, key) => {
        // Prevent callbackUrl loop if it pointed back to /dashboard/login
        if (key === 'callbackUrl' && (value === '/dashboard/login' || value === '/dashboard/login/')) {
          loginUrl.searchParams.set(key, '/dashboard')
        } else {
          loginUrl.searchParams.set(key, value)
        }
      })
      return NextResponse.redirect(loginUrl)
    }

    // When DASHBOARD_MOCK_AUTH=1 is set outside production, pass through
    const isMockAuth = process.env.NODE_ENV !== 'production' && process.env.DASHBOARD_MOCK_AUTH === '1'

    if (isDashboardRoute(req) && !isMockAuth) {
      auth().protect()
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
  },
  {
    publishableKey: clerkPublishableKey,
    secretKey: clerkSecretKey,
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
