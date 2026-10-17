import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { safePreviewSlug } from '@/lib/preview'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  // Disable Draft Mode by clearing the cookie
  draftMode().disable()

  redirect(safePreviewSlug(searchParams.get('slug')))
}
