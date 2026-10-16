'use server'

import { sanityClient, sanityWriteClient } from '@/lib/sanity'
import { getSession } from '@/lib/dashboard/auth'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function blocksToHtml(blocks: unknown): string {
  if (!blocks) return ''
  if (typeof blocks === 'string') {
    return `<p style="margin:0 0 12px 0; line-height:1.6; color:#334155;">${escapeHtml(blocks)}</p>`
  }
  if (!Array.isArray(blocks)) return ''

  let html = ''
  let inList = false

  for (const block of blocks) {
    if (block._type !== 'block' || !block.children) continue
    const text = (block.children as Array<{ text?: string; marks?: string[] }>)
      .map((child) => {
        let t = escapeHtml(child.text || '')
        if (child.marks?.includes('strong')) t = `<strong>${t}</strong>`
        if (child.marks?.includes('em')) t = `<em>${t}</em>`
        if (child.marks?.includes('underline')) t = `<u>${t}</u>`
        return t
      })
      .join('')

    if (block.listItem === 'bullet') {
      if (!inList) {
        html += '<ul style="margin: 0 0 14px 0; padding-left: 20px; color: #334155; line-height: 1.6;">'
        inList = true
      }
      html += `<li style="margin-bottom: 6px;">${text}</li>`
    } else {
      if (inList) {
        html += '</ul>'
        inList = false
      }
      if (block.style === 'h2' || block.style === 'h3') {
        html += `<h3 style="color: #0f172a; font-size: 18px; margin: 18px 0 8px 0; font-weight: 700;">${text}</h3>`
      } else {
        html += `<p style="margin: 0 0 12px 0; line-height: 1.6; color: #334155;">${text}</p>`
      }
    }
  }

  if (inList) {
    html += '</ul>'
  }

  return html
}

export async function broadcastAnnouncementManually(announcementId: string): Promise<{
  success: boolean
  message: string
  recipientCount?: number
}> {
  // Emails every subscriber, so only a signed-in admin (CSGB) may trigger it (S5).
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { success: false, message: 'Not authorised to broadcast announcements.' }
  }

  try {
    const cleanId = announcementId.replace(/^drafts\./, '')

    const doc = await sanityClient.fetch(
      `*[_type == "announcement" && _id == $id][0]{
        _id,
        title,
        category,
        time,
        location,
        eventDate,
        publishDate,
        content,
        isPublished,
        sentToSubscribers
      }`,
      { id: cleanId }
    )

    if (!doc) {
      return { success: false, message: 'Announcement not found.' }
    }

    if (doc.isPublished === false) {
      return { success: false, message: 'Cannot broadcast draft announcement. Please publish it first.' }
    }

    const subscribers = await sanityWriteClient.fetch<string[]>(
      `*[_type == "subscriber" && isActive != false && defined(email) && email != ""].email`
    )

    if (!subscribers || subscribers.length === 0) {
      return { success: false, message: 'No active subscribers found on the mailing list.' }
    }

    if (!resend) {
      return { success: false, message: 'Resend API key is not configured.' }
    }

    const title = doc.title || 'Fellowship Announcement'
    const category = (doc.category || 'GENERAL BULLETIN').toUpperCase()
    const contentHtml = blocksToHtml(doc.content)

    const dateDetails = doc.eventDate || doc.publishDate
    const formattedDate = dateDetails
      ? new Date(dateDetails).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 14px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #0095ff; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="color: #0077cc; margin: 0 0 4px 0; font-size: 20px;">EDSU Christian Campus Fellowship</h2>
          <p style="color: #64748b; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">Fellowship Announcement Bulletin</p>
        </div>

        <div style="margin-bottom: 12px;">
          <span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 10px; border-radius: 9999px;">
            ${escapeHtml(category)}
          </span>
        </div>

        <h1 style="color: #0f172a; font-size: 24px; line-height: 1.3; margin: 0 0 16px 0; font-weight: 800;">
          ${escapeHtml(title)}
        </h1>

        ${
          formattedDate || doc.time || doc.location
            ? `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
            ${formattedDate ? `<p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><strong>Date:</strong> ${escapeHtml(formattedDate)}</p>` : ''}
            ${doc.time ? `<p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><strong>Time:</strong> ${escapeHtml(doc.time)}</p>` : ''}
            <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Venue:</strong> ${escapeHtml(doc.location || 'NLT 5, Faculty of Law, ESUI')}</p>
          </div>
        `
            : ''
        }

        <div style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 26px;">
          ${contentHtml}
        </div>

        <div style="text-align: center; margin-bottom: 26px;">
          <a href="https://eccf-frontend.vercel.app/announcements" style="display: inline-block; background-color: #0095ff; color: #ffffff; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 28px; border-radius: 9999px; text-decoration: none;">
            View Online Bulletins &rarr;
          </a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          <p style="margin: 0 0 6px 0;"><strong>Edo State University Christian Campus Fellowship (ECCF)</strong> &bull; NLT 5, Faculty of Law, ESUI</p>
          <p style="margin: 0 0 6px 0;"><em>Sunday Worship Encounter: 08:00 AM &bull; Wednesday Bible Study: 04:50 PM</em></p>
          <p style="margin: 0;">You received this bulletin because you subscribed to updates on our website.</p>
        </div>
      </div>
    `

    const BATCH_SIZE = 100
    let deliveredCount = 0

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const chunk = subscribers.slice(i, i + BATCH_SIZE)
      const batchPayload = chunk.map((subscriberEmail) => ({
        from: 'ECCF Bulletins <onboarding@resend.dev>',
        to: subscriberEmail,
        subject: `[ECCF Bulletin] ${title}`,
        html: emailHtml,
      }))

      try {
        if (batchPayload.length === 1) {
          await resend.emails.send(batchPayload[0])
        } else {
          await resend.batch.send(batchPayload)
        }
        deliveredCount += chunk.length
      } catch (batchErr) {
        console.error('Failed to send batch chunk:', batchErr)
      }
    }

    await sanityWriteClient
      .patch(cleanId)
      .set({
        sentToSubscribers: true,
        sentAt: new Date().toISOString(),
      })
      .commit()

    return {
      success: true,
      message: `Successfully broadcasted to ${deliveredCount} subscriber(s).`,
      recipientCount: deliveredCount,
    }
  } catch (error) {
    console.error('Manual broadcast error:', error)
    return {
      success: false,
      message: 'Failed to broadcast announcement. Please try again.',
    }
  }
}
