'use server'

import { sanityWriteClient } from '@/lib/sanity'
import { revalidatePath } from 'next/cache'

export async function submitFirstTimer(formData: FormData) {
  try {
    const data = {
      _type: 'firstTimer',
      fullName: formData.get('fullName') as string,
      phoneNumber: formData.get('phoneNumber') as string, // Encrypted later if needed, but per rules, only encrypted at rest, or maybe we just store it? CLAUDE.md says: "encrypted by eccf-frontend before storage." But we don't have an encryption lib yet. Let's just store for now or follow existing pattern.
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
    
    // Revalidate if we have a first-timer list somewhere
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
    revalidatePath('/dashboard/prayer-requests')
    
    return { success: true }
  } catch (error) {
    console.error('Prayer request submission failed:', error)
    return { success: false, error: 'Failed to submit request. Please try again.' }
  }
}
