import 'server-only'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstileToken(token: unknown): Promise<boolean> {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!siteKey || !secretKey) {
    return process.env.NODE_ENV !== 'production' && token === 'development-bypass' && !siteKey && !secretKey
  }
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return false

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: secretKey, response: token }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return false
    const result = (await response.json()) as { success?: boolean }
    return result.success === true
  } catch {
    return false
  }
}
