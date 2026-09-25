'use server'

import { sanityWriteClient } from '@/lib/sanity'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

// Initialize Resend with the API key from environment variables
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// The email address where notifications will be sent
// (You must use the email address registered on your Resend account while in the free testing tier)
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'admin@eccf.com'

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
    const data = {
      _type: 'prayerRequest',
      name: formData.get('name') as string || 'Anonymous',
      request: formData.get('request') as string,
      dateSubmitted: new Date().toISOString(),
    }

    if (!data.request) {
      return { success: false, error: 'Prayer request is required.' }
    }

    await sanityWriteClient.create(data)

    // Send Email Notification
    if (resend) {
      await resend.emails.send({
        from: 'ECCF Prayer <onboarding@resend.dev>',
        to: NOTIFY_EMAIL,
        subject: `New Prayer Request: ${data.name}`,
        html: `
          <h2>New Prayer Request</h2>
          <p><strong>From:</strong> ${data.name}</p>
          <p><strong>Request:</strong></p>
          <blockquote style="border-left: 4px solid #0095ff; padding-left: 10px;">
            ${data.request}
          </blockquote>
          <br/>
          <p><em>Let us stand in faith together.</em></p>
        `,
      })
    }

    revalidatePath('/dashboard/prayer-requests')
    return { success: true }
  } catch (error) {
    console.error('Prayer request submission failed:', error)
    return { success: false, error: 'Failed to submit request. Please try again.' }
  }
}
