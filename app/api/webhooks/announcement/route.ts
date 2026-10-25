import { NextRequest, NextResponse } from 'next/server'
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
import { constantTimeStringEqual } from '@/lib/security/constant-time'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SANITY_WEBHOOK_SECRET
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
      console.error('[announcement-webhook] SANITY_WEBHOOK_SECRET is not configured; refusing to run.')
      return NextResponse.json({ error: 'Announcement webhook is not configured.' }, { status: 503 })
    }
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !constantTimeStringEqual(authHeader, `Bearer ${secret}`)) {
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 })
    }

    const payload = await req.json().catch(() => ({}))
    const docId = payload._id || payload.id

    if (typeof docId !== 'string' || docId.length > 256) {
      return NextResponse.json({ error: 'No announcement ID provided in payload' }, { status: 400 })
    }

    // Clean Sanity draft prefix if triggered during publish
    const cleanId = docId.replace(/^drafts\./, '')

    // Fetch the canonical published document from Sanity
    const query = `*[_type == "announcement" && _id == $id][0]{
      _id,
      title,
      category,
      isPinned,
      time,
      location,
      eventDate,
      publishDate,
      content,
      isPublished,
      sendBroadcastOnPublish,
      sentToSubscribers,
      sentAt
    }`

    const doc = await sanityClient.fetch(query, { id: cleanId })

    if (!doc) {
      return NextResponse.json({ skipped: true, reason: 'Announcement document not found' }, { status: 404 })
    }

    // Guard 1: Must be marked as Published
    if (doc.isPublished === false) {
      return NextResponse.json({ skipped: true, reason: 'Announcement is still marked as Draft' })
    }

    // Guard 2: Must have broadcast enabled
    // Legacy announcements may have `sendBroadcastOnPublish: true` or leave it
    // undefined. New announcements are written with an explicit `false` so
    // publishing is always followed by a deliberate per-card broadcast.
    if (doc.sendBroadcastOnPublish === false) {
      return NextResponse.json({ skipped: true, reason: 'Broadcast is disabled for this announcement' })
    }

    // Guard 3: Prevent duplicate email blasts
    if (doc.sentToSubscribers === true) {
      return NextResponse.json({
        skipped: true,
        reason: 'Announcement was already broadcasted to subscribers',
        sentAt: doc.sentAt,
      })
    }

    // Fetch all active subscribers
    const subscribers = await sanityPrivateClient.fetch<string[]>(
      `*[_type == "subscriber" && isActive != false && defined(email) && email != ""].email`
    )

    if (!subscribers || subscribers.length === 0) {
      // Mark as sent even if zero subscribers currently registered
      await sanityWriteClient
        .patch(cleanId)
        .set({
          sentToSubscribers: true,
          sentAt: new Date().toISOString(),
        })
        .commit()

      return NextResponse.json({
        success: true,
        message: 'No active subscribers found. Document marked as broadcasted.',
        recipientsCount: 0,
      })
    }

    if (!resend) {
      return NextResponse.json({
        error: 'Resend is not configured (missing RESEND_API_KEY)',
      }, { status: 500 })
    }

    // Prepare email content
    const title = doc.title || 'Fellowship Announcement'
    const category = (doc.category || 'GENERAL BULLETIN').toUpperCase()
    const contentHtml = emailRichText(doc.content)

    const dateDetails = doc.eventDate || doc.publishDate
    const formattedDate = dateDetails
      ? new Date(dateDetails).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null

    const appUrl = resolveSiteUrl(
      process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    )

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
      siteUrl: appUrl,
      content: [
        formattedDate || doc.time || doc.location ? emailDetails(detailRows) : '',
        contentHtml,
        emailButton({
          href: `${appUrl}/announcements`,
          label: 'Read this bulletin online',
          siteUrl: appUrl,
        }),
      ].join(''),
      footerNote:
        'You received this bulletin because you subscribed to fellowship updates on our website.',
    })

    // Broadcast in chunks using Resend batch API (up to 100 per batch)
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
        console.error(`Failed to send batch chunk starting at index ${i}:`, batchErr)
      }
    }

    // Mark announcement as sent to avoid duplicate broadcasts
    await sanityWriteClient
      .patch(cleanId)
      .set({
        sentToSubscribers: true,
        sentAt: new Date().toISOString(),
      })
      .commit()

    return NextResponse.json({
      success: true,
      broadcasted: true,
      recipientsTargeted: subscribers.length,
      recipientsDelivered: deliveredCount,
      announcementId: cleanId,
    })
  } catch (error) {
    console.error('Announcement webhook broadcast error:', error)
    return NextResponse.json(
      { error: 'Internal server error processing broadcast' },
      { status: 500 }
    )
  }
}
