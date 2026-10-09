import { WorkerRegistrationForm } from '@/components/forms/WorkerRegistrationForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Worker Registration & CRM — ECCF',
  description:
    'Official workforce profile registration and update portal for Edo State University Christian Campus Fellowship.',
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-950 pt-28 sm:pt-32 md:pt-36 pb-20 sm:pb-28">
      <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#0077cc] font-mono block mb-2.5">
            FELLOWSHIP WORKFORCE &amp; EXCO
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-tight">
            Worker Registration
          </h1>
          <p className="mt-3.5 text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Welcome to the workforce! Register or refresh your fellowship profile, birthday picture,
            and operational team details.
          </p>
        </div>

        {/* Worker Form */}
        <WorkerRegistrationForm />
      </div>
    </div>
  )
}
