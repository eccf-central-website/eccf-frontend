import { redirect } from 'next/navigation'

/**
 * Clerk sign-up is intentionally not offered as a standalone flow.
 * Signup is handled exclusively at /register (worker intake form), which
 * creates and links the Clerk account for the registered email.
 *
 * This route exists only to catch old links, bookmarks, and transfers that
 * still point here, and forwards them to the real registration flow.
 */
export default function SignUpPage() {
  redirect('/register')
}
