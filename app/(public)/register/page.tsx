import { Suspense } from 'react'
import { WorkerRegistrationForm, type TeamOption } from '@/components/forms/WorkerRegistrationForm'
import { sanityClient } from '@/lib/sanity'
import { REGISTRATION_TEAMS_QUERY } from '@/lib/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Worker Registration & CRM — ECCF',
  description:
    'Official workforce profile registration and update portal for Edo State University Christian Campus Fellowship.',
  robots: {
    index: false,
    follow: false,
  },
}

// Team options come from published teamUnit docs, so they must be fetched per request.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RegisterPage() {
  const teamOptions = await sanityClient
    .fetch<TeamOption[]>(REGISTRATION_TEAMS_QUERY)
    .catch((err) => {
      console.error('[register] Failed to load teams:', err)
      return [] as TeamOption[]
    })

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-950 pt-28 sm:pt-32 md:pt-36 pb-20 sm:pb-28">
      <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-12">


        {/* Worker Form wrapped in Suspense for search params */}
        <Suspense fallback={<div className="h-96 w-full max-w-2xl mx-auto animate-pulse bg-white rounded-3xl" />}>
          <WorkerRegistrationForm teamOptions={teamOptions} />
        </Suspense>
      </div>
    </div>
  )
}
