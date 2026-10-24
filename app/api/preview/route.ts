import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

function safeRedirectPath(slug: string | null): string {
  if (!slug) return '/'
  // Ensure the path is an internal relative path starting with / and not // or /\ or containing backslashes
  if (!slug.startsWith('/') || slug.startsWith('//') || slug.includes('\\')) {
    return '/'
  }
  return slug
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = safeRedirectPath(searchParams.get('slug'))

  // Enable Draft Mode by setting the cookie
  draftMode().enable()

  // Redirect to the validated relative path
  redirect(slug)
}
