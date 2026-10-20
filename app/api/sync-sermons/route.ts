/**
 * Multi-Platform RSS Auto-Sync API Handler — /api/sync-sermons
 *
 * Implements ADR-002: Ingests open RSS feeds from Spotify for Podcasters (Anchor)
 * and YouTube channel feeds, and auto-upserts sermonVault documents into Sanity CMS.
 *
 * When a sermon is uploaded to Spotify, this endpoint automatically matches and
 * retrieves its corresponding YouTube video ID and high-resolution thumbnail.
 */

import { NextResponse } from 'next/server'
import { constantTimeStringEqual } from '@/lib/security/constant-time'
import { runSermonSync } from '@/lib/sermonSync'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const secret = process.env.CRON_SECRET

    // Enforce authentication in production
    if (process.env.NODE_ENV === 'production') {
      if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
        console.error('[sync-sermons] CRON_SECRET is not configured; refusing to run.')
        return NextResponse.json({ error: 'Sermon sync is not configured.' }, { status: 503 })
      }

      if (!authHeader || !constantTimeStringEqual(authHeader, `Bearer ${secret}`)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else if (secret && authHeader) {
      if (!constantTimeStringEqual(authHeader, `Bearer ${secret}`)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const syncResult = await runSermonSync()
    return NextResponse.json(syncResult)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error'
    console.error('[sync-sermons] Unhandled error during sync:', err)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return POST(request)
}
