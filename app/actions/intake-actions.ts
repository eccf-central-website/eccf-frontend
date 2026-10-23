'use server'

import { createPrivateDocument, sanityPrivateClient } from '@/lib/sanity'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { encrypt, createBlindIndex } from '@/lib/encryption'
import { resolveResendFrom } from '@/lib/email/from'
import { verifyTurnstileToken } from '@/lib/security/turnstile'

// Initialize Resend with the API key from environment variables
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// The email address where notifications will be sent
// (You must use the email address registered on your Resend account while in the free testing tier)
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'admin@eccf.com'

export async function submitFirstTimer(formData: FormData) {
  try {
    if (!(await verifyTurnstileToken(formData.get('turnstileToken')))) {
      return { success: false, error: 'Complete the security check and try again.' }
    }
    const rawFirstName = (formData.get('firstName') as string)?.trim()
    const rawLastName = (formData.get('lastName') as string)?.trim()
    const rawFullNameInput = (formData.get('fullName') as string)?.trim()

    let rawFullName = ''
    if (rawFirstName || rawLastName) {
      if (!rawFirstName || !rawLastName) {
        return { success: false, error: 'Both First Name and Last Name are required.' }
      }
      rawFullName = `${rawFirstName} ${rawLastName}`
    } else if (rawFullNameInput) {
      const parts = rawFullNameInput.split(/\s+/).filter(Boolean)
      if (parts.length < 2) {
        return { success: false, error: 'Please enter both your First Name and Last Name.' }
      }
      rawFullName = rawFullNameInput
    }

    const rawPhone = (formData.get('phoneNumber') as string)?.trim()
    const rawHall = (formData.get('hall') as string)?.trim()
    const rawRoom = (formData.get('roomNumber') as string)?.trim()
    const rawDept = (formData.get('department') as string)?.trim()
    const rawLevel = (formData.get('level') as string)?.trim()

    if (!rawFullName || !rawPhone) {
      return { success: false, error: 'First Name, Last Name, and Phone Number are required.' }
    }

    const data: { _type: 'firstTimer'; [key: string]: unknown } = {
      _type: 'firstTimer',
      fullName: rawFullName,
      phoneNumber: encrypt(rawPhone),
      phoneBlindIndex: createBlindIndex(rawPhone),
      hall: rawHall || '',
      roomNumber: rawRoom ? encrypt(rawRoom) : '',
      department: rawDept || '',
      level: rawLevel || '',
      dateVisited: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    }

    if (rawFirstName) data.firstName = rawFirstName
    if (rawLastName) data.lastName = rawLastName

    await createPrivateDocument(data)

    // Email only a pointer; keep first-timer details inside the protected dashboard.
    if (resend) {
      await resend.emails.send({
        from: resolveResendFrom('ECCF Connect'),
        to: NOTIFY_EMAIL,
        subject: 'New first-timer form received',
        text: 'A first-timer form was submitted. Sign in to the ECCF dashboard to review it.',
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
    if (!(await verifyTurnstileToken(formData.get('turnstileToken')))) {
      return { success: false, error: 'Complete the security check and try again.' }
    }
    const rawName = (formData.get('name') as string)?.trim()
    const rawPhone = (formData.get('phoneNumber') as string)?.trim()
    const rawDetails = (formData.get('requestDetails') as string)?.trim()

    if (!rawName || !rawPhone || !rawDetails) {
      return { success: false, error: 'All fields are required.' }
    }

    const data = {
      _type: 'welfareRequest',
      name: rawName,
      phoneNumber: encrypt(rawPhone),
      phoneBlindIndex: createBlindIndex(rawPhone),
      requestDetails: encrypt(rawDetails),
      status: 'Pending',
      dateSubmitted: new Date().toISOString(),
    }

    await createPrivateDocument(data)

    // Welfare details are sensitive; email only a pointer to the protected dashboard.
    if (resend) {
      await resend.emails.send({
        from: resolveResendFrom('ECCF Welfare'),
        to: NOTIFY_EMAIL,
        subject: 'New welfare request received',
        text: 'A welfare request was submitted. Sign in to the ECCF dashboard to review it.',
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
    if (!(await verifyTurnstileToken(formData.get('turnstileToken')))) {
      return { success: false, error: 'Complete the security check and try again.' }
    }
    const rawName = (formData.get('name') as string)?.trim()
    const name = rawName || 'Anonymous'
    const rawRequest = (formData.get('request') as string)?.trim()

    if (!rawRequest) {
      return { success: false, error: 'Prayer request is required.' }
    }

    const data = {
      _type: 'prayerRequest',
      name,
      request: encrypt(rawRequest),
      dateSubmitted: new Date().toISOString(),
    }

    await createPrivateDocument(data)

    // Query Sanity for prayer coordinators and prayer team leaders
    let sanityPrayerEmails: string[] = []
    try {
      sanityPrayerEmails = await sanityPrivateClient.fetch<string[]>(`
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
      try {
        await resend.emails.send({
          from: resolveResendFrom('ECCF Prayer Network'),
          to: recipients,
          subject: 'New prayer request received',
          text: 'A prayer request was submitted. Sign in to the ECCF dashboard to review it.',
        })
      } catch (emailErr) {
        console.error('Failed to send prayer request email to all recipients:', emailErr)
        // Fallback attempt to NOTIFY_EMAIL if batch delivery was restricted
        if (recipients.length > 1 && NOTIFY_EMAIL) {
          try {
            await resend.emails.send({
              from: resolveResendFrom('ECCF Prayer Network'),
              to: NOTIFY_EMAIL,
              subject: 'New prayer request received',
              text: 'A prayer request was submitted. Sign in to the ECCF dashboard to review it.',
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
