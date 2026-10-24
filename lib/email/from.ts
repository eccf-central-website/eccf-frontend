import 'server-only'

/**
 * Resolve the `from` address used by every Resend send site.
 *
 * Resolution order:
 * 1. `RESEND_FROM_EMAIL` — canonical production sender.
 * 2. `EMAIL_FROM` — intentional alias retained for older deployments.
 * 3. Development fallback: `onboarding@resend.dev`.
 *
 * The Resend sandbox address only delivers to the Resend account owner. Never
 * rely on the fallback in production; verify a domain at
 * https://resend.com/domains and set `RESEND_FROM_EMAIL` to an address on it.
 *
 * Configured values may be either a bare address (`no-reply@example.org`) or a
 * pre-formatted mailbox (`ECCF Bulletins <no-reply@example.org>`). A bare address
 * is combined with the caller's display name so existing branding is preserved.
 */

const DEVELOPMENT_FALLBACK_ADDRESS = 'onboarding@resend.dev'
const RESEND_SANDBOX_PATTERN = /@resend\.dev>?$/i

let fallbackWarningLogged = false
let sandboxWarningLogged = false

function warnOnce(kind: 'fallback' | 'sandbox') {
  if (kind === 'fallback') {
    if (fallbackWarningLogged) return
    fallbackWarningLogged = true
    console.warn(
      '[email] RESEND_FROM_EMAIL and EMAIL_FROM are not configured. ' +
        `Using the development fallback ${DEVELOPMENT_FALLBACK_ADDRESS}. ` +
        'Resend only delivers from this address to the Resend account owner. ' +
        'Verify a domain at https://resend.com/domains and set RESEND_FROM_EMAIL before sending to other recipients.'
    )
    return
  }

  if (sandboxWarningLogged) return
  sandboxWarningLogged = true
  console.warn(
    '[email] The configured sender still uses the @resend.dev sandbox domain. ' +
      'Resend only delivers from this domain to the Resend account owner. ' +
      'Verify a domain at https://resend.com/domains and update RESEND_FROM_EMAIL.'
  )
}

export function resolveResendFrom(displayName = 'ECCF'): string {
  let configured = process.env.RESEND_FROM_EMAIL?.trim() || process.env.EMAIL_FROM?.trim()

  if (configured) {
    if (!configured.includes('@')) {
      const corrected = `team@${configured}`
      console.warn(`[email] RESEND_FROM_EMAIL "${configured}" was missing "@". Auto-corrected to "${corrected}".`)
      configured = corrected
    }
    if (RESEND_SANDBOX_PATTERN.test(configured)) warnOnce('sandbox')
    // A configured value that already contains a mailbox must be used verbatim,
    // otherwise the environment's own display name would be overwritten.
    return /<[^>]+>/.test(configured) ? configured : `${displayName} <${configured}>`
  }

  warnOnce('fallback')
  return `${displayName} <${DEVELOPMENT_FALLBACK_ADDRESS}>`
}

/** Exposed for diagnostics/tests without leaking the resolved mailbox value. */
export function isResendSandboxSender(from: string): boolean {
  return RESEND_SANDBOX_PATTERN.test(from)
}
