import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { findSermonsWithAi } from '@/lib/sermon-ai/finder'
import { getClientIpHashFromHeaders } from '@/lib/sermon-ai/rate-limit'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
} as const

const FinderRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, 'Search query must be at least 2 characters.')
    .max(300, 'Search query must be 300 characters or less.'),
  mode: z.enum(['page', 'modal']).optional(),
  preacher: z
    .string()
    .trim()
    .max(120)
    .nullish()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  maxDurationSeconds: z
    .number()
    .finite()
    .int()
    .positive()
    .max(86400)
    .nullish()
    .transform((val) => (typeof val === 'number' ? val : undefined)),
  excludeIds: z
    .array(z.string().trim().min(1).max(128))
    .max(50)
    .nullish()
    .transform((val) => (Array.isArray(val) && val.length > 0 ? val : undefined)),
  limit: z
    .number()
    .finite()
    .int()
    .min(1)
    .max(12)
    .nullish()
    .transform((val) => (typeof val === 'number' ? val : undefined)),
})

export async function POST(request: NextRequest) {
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request body.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const parsed = FinderRequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || 'Invalid search request.'
    return NextResponse.json(
      { error: firstIssue },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  try {
    const ipHash = getClientIpHashFromHeaders(request.headers)
    const response = await findSermonsWithAi(parsed.data, { ipHash })
    return NextResponse.json(response, { status: 200, headers: NO_STORE_HEADERS })
  } catch {
    console.error('[api/sermons/finder] Unexpected error handling search request.')
    return NextResponse.json(
      { error: 'Unable to process search right now. Please try again shortly.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
