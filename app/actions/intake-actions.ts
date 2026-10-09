'use server'

import { sanityClient, sanityWriteClient } from '@/lib/sanity'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

// Initialize Resend with the API key from environment variables
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// The email address where notifications will be sent
// (You must use the email address registered on your Resend account while in the free testing tier)
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'admin@eccf.com'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function submitFirstTimer(formData: FormData) {
  try {
    const data = {
      _type: 'firstTimer',
      fullName: formData.get('fullName') as string,
      phoneNumber: formData.get('phoneNumber') as string,
      hall: formData.get('hall') as string,
      roomNumber: formData.get('roomNumber') as string,
      department: formData.get('department') as string,
      level: formData.get('level') as string,
      dateVisited: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    }

    if (!data.fullName || !data.phoneNumber) {
      return { success: false, error: 'Name and Phone Number are required.' }
    }

    await sanityWriteClient.create(data)

    // Send Email Notification
    if (resend) {
      await resend.emails.send({
        from: 'ECCF Connect <onboarding@resend.dev>',
        to: NOTIFY_EMAIL,
        subject: `New First Timer: ${data.fullName}`,
        html: `
          <h2>New First Timer Connection!</h2>
          <p><strong>Name:</strong> ${data.fullName}</p>
          <p><strong>Phone Number:</strong> ${data.phoneNumber}</p>
          <p><strong>Hall:</strong> ${data.hall || 'N/A'} (Room: ${data.roomNumber || 'N/A'})</p>
          <p><strong>Department:</strong> ${data.department || 'N/A'} (${data.level || 'N/A'})</p>
          <br/>
          <p><em>Please ensure the follow-up team reaches out to them!</em></p>
        `,
      })
    }
    
    revalidatePath('/dashboard/first-timers')
    return { success: true }
  } catch (error) {
    console.error('First Timer submission failed:', error)
    return { success: false, error: 'Failed to submit form. Please try again.' }
  }
}

export async function submitWelfareRequest(formData: FormData) {
  try {
    const data = {
      _type: 'welfareRequest',
      name: formData.get('name') as string,
      phoneNumber: formData.get('phoneNumber') as string,
      requestDetails: formData.get('requestDetails') as string,
      status: 'Pending',
      dateSubmitted: new Date().toISOString(),
    }

    if (!data.name || !data.phoneNumber || !data.requestDetails) {
      return { success: false, error: 'All fields are required.' }
    }

    await sanityWriteClient.create(data)

    // Send Email Notification
    if (resend) {
      await resend.emails.send({
        from: 'ECCF Welfare <onboarding@resend.dev>',
        to: NOTIFY_EMAIL,
        subject: `Urgent: New Welfare Request from ${data.name}`,
        html: `
          <h2>New Welfare Request</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Phone Number:</strong> ${data.phoneNumber}</p>
          <p><strong>Request Details:</strong></p>
          <blockquote style="border-left: 4px solid #ccc; padding-left: 10px;">
            ${data.requestDetails}
          </blockquote>
          <br/>
          <p><em>Please review this in the Exco dashboard and follow up.</em></p>
        `,
      })
    }

    revalidatePath('/dashboard/welfare')
    return { success: true }
  } catch (error) {
    console.error('Welfare request submission failed:', error)
    return { success: false, error: 'Failed to submit request. Please try again.' }
  }
}

export async function submitPrayerRequest(formData: FormData) {
  try {
    const rawName = (formData.get('name') as string)?.trim()
    const name = rawName || 'Anonymous'
    const request = (formData.get('request') as string)?.trim()

    if (!request) {
      return { success: false, error: 'Prayer request is required.' }
    }

    const data = {
      _type: 'prayerRequest',
      name,
      request,
      dateSubmitted: new Date().toISOString(),
    }

    await sanityWriteClient.create(data)

    // Query Sanity for prayer coordinators and prayer team leaders
    let sanityPrayerEmails: string[] = []
    try {
      sanityPrayerEmails = await sanityClient.fetch<string[]>(`
        *[_type == "worker" && defined(email) && email != "" && (
          excoPosition == "Prayer Coordinator" ||
          excoPosition match "*Prayer*" ||
          (role in ["admin", "team_lead"] && (team->name match "*Prayer*" || team match "*Prayer*"))
        )].email
      `)
    } catch (queryErr) {
      console.warn('Could not query prayer leaders from Sanity:', queryErr)
    }

    // Optional environment variable overrides/additions
    const envPrayerEmails = [
      process.env.PRAYER_LEAD_EMAIL,
      process.env.PRAYER_ASSISTANT_EMAIL,
      ...(process.env.PRAYER_NOTIFY_EMAILS ? process.env.PRAYER_NOTIFY_EMAILS.split(',') : []),
    ]

    // Deduplicated list of all recipient emails
    const recipients = Array.from(
      new Set(
        [
          NOTIFY_EMAIL,
          ...envPrayerEmails,
          ...(sanityPrayerEmails || []),
        ]
          .map((e) => e?.trim())
          .filter((e): e is string => Boolean(e && e.includes('@')))
      )
    )

    // Send Email Notification
    if (resend && recipients.length > 0) {
      const formattedDate = new Date(data.dateSubmitted).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #0095ff; padding-bottom: 14px; margin-bottom: 20px;">
            <h2 style="color: #0077cc; margin: 0 0 4px 0; font-size: 20px;">EDSU Christian Campus Fellowship</h2>
            <p style="color: #64748b; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Intercessory Prayer Network</p>
          </div>

          <h3 style="color: #0f172a; font-size: 18px; margin: 0 0 16px 0;">New Prayer Request Received</h3>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;">
              <strong>From:</strong> ${escapeHtml(data.name)}
            </p>
            <p style="margin: 0; font-size: 14px; color: #334155;">
              <strong>Date & Time:</strong> ${escapeHtml(formattedDate)}
            </p>
          </div>

          <p style="font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
            Prayer Request:
          </p>
          <blockquote style="margin: 0 0 24px 0; padding: 16px 18px; background-color: #f0f9ff; border-left: 4px solid #0095ff; border-radius: 4px; font-size: 15px; line-height: 1.6; color: #0f172a; white-space: pre-wrap;">
${escapeHtml(data.request)}
          </blockquote>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 13px; color: #64748b; line-height: 1.5;">
            <p style="margin: 0 0 8px 0;"><em>"The prayer of a righteous person is powerful and effective." — James 5:16</em></p>
            <p style="margin: 0;">This request is also available in real-time on the <strong>Exco Dashboard</strong>.</p>
          </div>
        </div>
      `

      try {
        await resend.emails.send({
          from: 'ECCF Prayer Network <onboarding@resend.dev>',
          to: recipients,
          subject: `New Prayer Request: ${data.name}`,
          html: emailHtml,
        })
      } catch (emailErr) {
        console.error('Failed to send prayer request email to all recipients:', emailErr)
        // Fallback attempt to NOTIFY_EMAIL if batch delivery was restricted
        if (recipients.length > 1 && NOTIFY_EMAIL) {
          try {
            await resend.emails.send({
              from: 'ECCF Prayer Network <onboarding@resend.dev>',
              to: NOTIFY_EMAIL,
              subject: `New Prayer Request: ${data.name}`,
              html: emailHtml,
            })
          } catch (fallbackErr) {
            console.error('Fallback email to fellowship address failed:', fallbackErr)
          }
        }
      }
    }

    revalidatePath('/dashboard/prayer-requests')
    return { success: true }
  } catch (error) {
    console.error('Prayer request submission failed:', error)
    return { success: false, error: 'Failed to submit request. Please try again.' }
  }
}
