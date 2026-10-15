import { Suspense } from 'react'
import { WorkerRegistrationForm } from '@/components/forms/WorkerRegistrationForm'
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

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-950 pt-28 sm:pt-32 md:pt-36 pb-20 sm:pb-28">
      <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-12">


        {/* Worker Form wrapped in Suspense for search params */}
        <Suspense fallback={<div className="h-96 w-full max-w-2xl mx-auto animate-pulse bg-white rounded-3xl" />}>
          <WorkerRegistrationForm />
        </Suspense>
      </div>
    </div>
  )
}
