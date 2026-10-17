import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { isValidPreviewSecret, safePreviewSlug } from '@/lib/preview'

/**
 * Enables Draft Mode for the Sanity Studio preview pane.
 * Requires ?secret=<SANITY_PREVIEW_SECRET>; anything else is refused (S13).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (!isValidPreviewSecret(searchParams.get('secret'))) {
    return NextResponse.json({ error: 'Invalid preview token' }, { status: 401 })
  }

  draftMode().enable()
  redirect(safePreviewSlug(searchParams.get('slug')))
}
