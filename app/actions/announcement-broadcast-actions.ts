'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/dashboard/auth'
import { isCSGBMember } from '@/lib/dashboard/rbac'
import { sanityClient, sanityPrivateClient, sanityWriteClient } from '@/lib/sanity'
import { resolveResendFrom } from '@/lib/email/from'
import {
  emailButton,
  emailDetails,
  emailRichText,
  escapeHtml,
  renderEmailLayout,
  resolveSiteUrl,
} from '@/lib/email/layout'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function broadcastAnnouncementManually(announcementId: string): Promise<{
  success: boolean
  message: string
  recipientCount?: number
}> {
  const session = await getSession()
  if (!session || !isCSGBMember(session)) {
    return { success: false, message: 'You do not have permission to send announcements.' }
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

    const subscribers = await sanityPrivateClient.fetch<string[]>(
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
    const contentHtml = emailRichText(doc.content)
    const siteUrl = resolveSiteUrl()

    const dateDetails = doc.eventDate || doc.publishDate
    const formattedDate = dateDetails
      ? new Date(dateDetails).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null

    const detailRows = [
      ...(formattedDate ? [{ label: 'Date', value: escapeHtml(formattedDate) }] : []),
      ...(doc.time ? [{ label: 'Time', value: escapeHtml(doc.time) }] : []),
      {
        label: 'Venue',
        value: escapeHtml(doc.location || 'NLT 5, Faculty of Law, ESUI'),
      },
    ]

    const emailHtml = renderEmailLayout({
      preheader: title,
      eyebrow: `Bulletin · ${escapeHtml(category)}`,
      title: escapeHtml(title),
      siteUrl,
      content: [
        formattedDate || doc.time || doc.location ? emailDetails(detailRows) : '',
        contentHtml,
        emailButton({
          href: `${siteUrl}/announcements`,
          label: 'Read this bulletin online',
          siteUrl,
        }),
      ].join(''),
      footerNote:
        'You received this bulletin because you subscribed to fellowship updates on our website.',
    })

    const BATCH_SIZE = 100
    let deliveredCount = 0

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const chunk = subscribers.slice(i, i + BATCH_SIZE)
      const batchPayload = chunk.map((subscriberEmail) => ({
        from: resolveResendFrom('ECCF Bulletins'),
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

    revalidatePath('/dashboard/announcements')

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
