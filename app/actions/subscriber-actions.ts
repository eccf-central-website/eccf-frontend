'use server'

import { createPrivateDocument, patchPrivateDocument, sanityPrivateClient } from '@/lib/sanity'
import { resolveResendFrom } from '@/lib/email/from'
import {
  emailButton,
  emailDetails,
  emailNotice,
  emailParagraph,
  emailSectionTitle,
  escapeHtml,
  renderEmailLayout,
  resolveSiteUrl,
} from '@/lib/email/layout'
import { Resend } from 'resend'
import { verifyTurnstileToken } from '@/lib/security/turnstile'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function subscribeToAnnouncements(formData: FormData): Promise<{
  success: boolean
  message: string
}> {
  try {
    if (!(await verifyTurnstileToken(formData.get('turnstileToken')))) {
      return { success: false, message: 'Complete the security check and try again.' }
    }
    const rawEmail = formData.get('email') as string
    const rawName = formData.get('name') as string

    if (!rawEmail || typeof rawEmail !== 'string') {
      return { success: false, message: 'Please enter a valid email address.' }
    }

    const email = rawEmail.trim().toLowerCase()
    const name = rawName ? rawName.trim() : ''

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Please enter a valid email address.' }
    }

    // Check for existing subscriber
    const existing = await sanityPrivateClient.fetch<{
      _id: string
      email: string
      isActive?: boolean
    } | null>(
      `*[_type == "subscriber" && lower(email) == $email][0]{ _id, email, isActive }`,
      { email }
    )

    if (existing) {
      if (existing.isActive !== false) {
        return {
          success: true,
          message: "You're already subscribed to fellowship bulletins!",
        }
      }

      // Reactivate subscription
      await patchPrivateDocument(existing._id)
        .set({
          isActive: true,
          subscribedAt: new Date().toISOString(),
          ...(name ? { name } : {}),
        })
        .commit()
    } else {
      // Create new subscriber
      await createPrivateDocument({
        _type: 'subscriber',
        email,
        name: name || undefined,
        subscribedAt: new Date().toISOString(),
        isActive: true,
      })
    }

    // Send Welcome Email via Resend
    if (resend) {
      const siteUrl = resolveSiteUrl()
      const welcomeHtml = renderEmailLayout({
        preheader: 'You are on the ECCF mailing list. Here is what to expect.',
        eyebrow: 'Bulletins · Welcome',
        title: `Welcome to fellowship updates${name ? `, ${escapeHtml(name)}` : ''}`,
        siteUrl,
        content: [
          emailParagraph(
            'Grace and peace to you! You have successfully subscribed to receive announcements, weekly service bulletins, academic prayer alerts and special event notices from the Edo State University Christian Campus Fellowship.'
          ),
          emailSectionTitle('Our weekly gatherings'),
          emailDetails([
            { label: 'Venue', value: 'NLT 5, Faculty of Law, ESUI' },
            { label: 'Sunday', value: 'Worship Encounter · 08:00 AM' },
            { label: 'Wednesday', value: 'Bible Study · 04:50 PM' },
          ]),
          emailParagraph(
            'Whenever a new announcement is posted by our executive team, a notification will arrive in this inbox so you never miss what God is doing on campus.'
          ),
          emailButton({
            href: `${siteUrl}/announcements`,
            label: 'Read the latest bulletins',
            siteUrl,
          }),
          emailNotice({
            title: 'No spam, ever',
            body: 'We only write when there is something worth sharing. Your address stays with the fellowship and is never sold or passed on.',
            tone: 'neutral',
          }),
          emailParagraph(
            '<em>&ldquo;Raising Spiritual Dynamites and Academic Giants.&rdquo;</em>',
            { muted: true, small: true, last: true }
          ),
        ].join(''),
        footerNote: `You received this email because ${escapeHtml(email)} was subscribed to fellowship updates at ${siteUrl.replace(/^https?:\/\//, '')}/announcements.`,
      })

      try {
        const { error: sendError } = await resend.emails.send({
          from: resolveResendFrom('ECCF Bulletins'),
          to: email,
          subject: 'Welcome to ECCF Announcements & Bulletins',
          html: welcomeHtml,
        })
        if (sendError) {
          console.warn('[subscribeToAnnouncements] Welcome confirmation email delivery rejected by Resend:', sendError?.message || sendError?.name || 'Rejected')
        }
      } catch (emailErr) {
        console.warn('[subscribeToAnnouncements] Welcome confirmation email delivery failed:', emailErr instanceof Error ? emailErr.message : 'Unknown error')
      }
    }

    return {
      success: true,
      message: "You're all set! Check your inbox for a confirmation message.",
    }
  } catch (error) {
    console.error('Subscription action error:', error)
    return {
      success: false,
      message: 'Failed to subscribe. Please try again later.',
    }
  }
}
