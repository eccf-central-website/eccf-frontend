import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug') || '/'

  // Enable Draft Mode by setting the cookie
  draftMode().enable()

  // Redirect to the path from the fetched url
  redirect(slug)
}
