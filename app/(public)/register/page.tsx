import { WorkerRegistrationForm } from '@/components/forms/WorkerRegistrationForm'
import {
  getSignedInUserContext,
  getPendingWorkerOtpChallenge,
} from '@/app/actions/worker-registration'
import { getTeamUnitOptions } from '@/lib/teams'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Worker Registration & CRM — ECCF',
  description:
    'Official workforce profile registration and update portal for Edo State University Christian Campus Fellowship.',
  robots: {
    index: false,
    follow: false,
  },
}

interface RegisterPageProps {
  searchParams?: {
    selfServiceToken?: string
  }
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const [userContext, teamOptions, pendingChallenge] = await Promise.all([
    getSignedInUserContext(),
    getTeamUnitOptions(),
    getPendingWorkerOtpChallenge(),
  ])

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-950 pt-28 sm:pt-32 md:pt-36 pb-20 sm:pb-28">
      <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-12">
        <WorkerRegistrationForm
          initialEmail={userContext.email || ''}
          initialFirstName={userContext.firstName || ''}
          initialLastName={userContext.lastName || ''}
          clerkUserId={userContext.clerkUserId}
          isClerkSignedIn={userContext.isSignedIn}
          emailVerified={userContext.emailVerified}
          signedInWorker={userContext.worker}
          signedInNeedsVerification={userContext.needsVerification}
          teamOptions={teamOptions}
          selfServiceToken={searchParams?.selfServiceToken || ''}
          initialPendingChallenge={pendingChallenge}
        />
      </div>
    </div>
  )
}
