'use server'

import { createPrivateDocument, patchPrivateDocument, sanityPrivateClient } from '@/lib/sanity'
import { Resend } from 'resend'
import { verifyTurnstileToken } from '@/lib/security/turnstile'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

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
      const displayName = name ? ` ${escapeHtml(name)}` : ''
      const welcomeHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 14px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #0095ff; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #0077cc; margin: 0 0 4px 0; font-size: 20px;">ESUI Christian Campus Fellowship</h2>
            <p style="color: #64748b; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Campus Bulletins &amp; Notices</p>
          </div>

          <h3 style="color: #0f172a; font-size: 19px; margin: 0 0 14px 0;">Welcome to Fellowship Updates${displayName}!</h3>

          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 18px 0;">
            Grace and peace to you! You have successfully subscribed to receive announcements, weekly service bulletins, academic prayer alerts, and special event notices from Edo State University Christian Campus Fellowship (ECCF).
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.04em;">
              Weekly Encounters &bull; Venue: NLT 5, Faculty of Law, ESUI
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
              <li><strong>Sunday Worship Encounter:</strong> 08:00 AM</li>
              <li><strong>Wednesday Bible Study:</strong> 04:50 PM</li>
            </ul>
          </div>

          <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
            Whenever a new announcement is posted by our executive team, you will receive a direct notification in this inbox so you never miss what God is doing on campus.
          </p>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
            <p style="margin: 0 0 6px 0;"><em>"Raising Spiritual Dynamites and Academic Giants."</em></p>
            <p style="margin: 0;">You received this email because ${escapeHtml(email)} was subscribed on <a href="https://eccf-frontend.vercel.app/announcements" style="color: #0077cc; text-decoration: underline;">eccf-frontend.vercel.app/announcements</a>.</p>
          </div>
        </div>
      `

      try {
        await resend.emails.send({
          from: 'ECCF Bulletins <onboarding@resend.dev>',
          to: email,
          subject: 'Welcome to ECCF Announcements & Bulletins',
          html: welcomeHtml,
        })
      } catch (emailErr) {
        console.warn('Welcome confirmation email delivery failed:', emailErr)
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
