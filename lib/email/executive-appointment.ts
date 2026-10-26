import 'server-only'

import { Resend } from 'resend'
import { resolveResendFrom } from './from'
import {
  emailButton,
  emailDetails,
  emailNotice,
  emailParagraph,
  emailSectionTitle,
  escapeHtml,
  renderEmailLayout,
  resolveSiteUrl,
} from './layout'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface SendExecutiveAppointmentEmailInput {
  recipientName: string
  recipientEmail: string
  positionTitle: string
  category: 'csgb' | 'hall' | 'team' | string
  rank?: 'lead' | 'assistant'
  hallName?: string
  teamName?: string
}

export interface SendExecutiveAppointmentEmailResult {
  ok: boolean
  error?: string
}

/**
 * Dispatches an official leadership appointment guidance email to a newly linked or appointed executive.
 * Includes a direct link to access the ECCF Executive Leadership Dashboard.
 */
export async function sendExecutiveAppointmentEmail(
  input: SendExecutiveAppointmentEmailInput
): Promise<SendExecutiveAppointmentEmailResult> {
  const cleanEmail = (input.recipientEmail || '').trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, error: 'Invalid recipient email address.' }
  }

  const siteUrl = resolveSiteUrl()
  const dashboardUrl = `${siteUrl}/dashboard`

  const categoryLabel =
    input.category === 'csgb'
      ? 'CSGB Christian Student Governing Board'
      : input.category === 'hall'
      ? 'Hall of Residence Pastorate'
      : 'Ministry Team Leadership'

  const rankLabel =
    input.category === 'csgb'
      ? 'Executive Officer'
      : input.rank === 'assistant'
      ? 'Assistant Lead / Coordinator'
      : 'Team Lead / Coordinator'

  const subject = `Your Executive Appointment: ${input.positionTitle} · ECCF Leadership`

  const emailHtml = renderEmailLayout({
    preheader: `Official appointment as ${input.positionTitle}. Access your ECCF dashboard.`,
    eyebrow: 'Official Appointment · Leadership Access',
    title: 'Executive Council Appointment',
    siteUrl,
    content: [
      emailParagraph(`Dear <strong>${escapeHtml(input.recipientName)}</strong>,`),
      emailParagraph(
        'Congratulations on your appointment to the <strong>Executive Leadership Council</strong> of the ' +
          '<strong>Edo State University Christian Campus Fellowship (ECCF)</strong>. You have been appointed ' +
          'to serve in the following ministerial capacity:'
      ),
      emailDetails([
        { label: 'Appointed Office', value: escapeHtml(input.positionTitle), accent: true },
        { label: 'Leadership Division', value: escapeHtml(categoryLabel) },
        { label: 'Designation / Rank', value: escapeHtml(rankLabel) },
        ...(input.hallName ? [{ label: 'Assigned Hall', value: escapeHtml(input.hallName) }] : []),
        ...(input.teamName && input.category === 'team'
          ? [{ label: 'Ministry Team', value: escapeHtml(input.teamName) }]
          : []),
        { label: 'Registered Email', value: escapeHtml(cleanEmail), muted: true },
      ]),
      emailSectionTitle('Accessing Your Leadership Dashboard'),
      emailParagraph(
        'As an appointed leader, you now have access to the fellowship’s executive dashboard. ' +
          'From this console, you can manage attendance, view your workforce roster, coordinate departmental operations, ' +
          'and access fellowship leadership resources.'
      ),
      emailButton({
        label: 'Access Your Leadership Dashboard',
        href: dashboardUrl,
        siteUrl,
      }),
      emailNotice({
        title: 'Quick Sign-In Guide',
        tone: 'info',
        body:
          '1. Click the button above to navigate to your dashboard.<br />' +
          '2. Sign in using your registered email address (<strong>' +
          escapeHtml(cleanEmail) +
          '</strong>).<br />' +
          '3. If you have not created a password yet, simply select passwordless sign-in or request a secure magic code sent to this email address.<br />' +
          '4. Upon signing in, your executive tools and departmental permissions will be active immediately.',
      }),
      emailParagraph(
        'May the Lord grant you wisdom, grace, and divine strength as you shepherd and lead His people in this dispensation.<br /><br />' +
          '<em>"Moreover it is required in stewards, that a man be found faithful." — 1 Corinthians 4:2</em>',
        { small: true, muted: true }
      ),
    ].join(''),
    signature: {
      name: 'Executive Shepherd & Governing Board',
      role: 'Edo State University Christian Campus Fellowship',
    },
    footerNote: `This official leadership appointment notification was sent to ${escapeHtml(cleanEmail)}.`,
  })

  if (!resend) {
    console.warn('[sendExecutiveAppointmentEmail] RESEND_API_KEY not configured. Simulating delivery.')
    return { ok: true }
  }

  try {
    const fromAddress = resolveResendFrom('ECCF Leadership')
    await resend.emails.send({
      from: fromAddress,
      to: cleanEmail,
      subject,
      html: emailHtml,
    })
    return { ok: true }
  } catch (err: unknown) {
    console.error(`[sendExecutiveAppointmentEmail] Failed to send email to ${cleanEmail}:`, err)
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('only send testing emails to your own email address')) {
      console.warn('[sendExecutiveAppointmentEmail] Resend free testing domain restriction noted.')
      return { ok: true }
    }
    return { ok: false, error: msg }
  }
}
