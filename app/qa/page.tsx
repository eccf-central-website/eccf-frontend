import { Metadata } from 'next'
import { getQAChecklist } from '@/app/actions/qa-actions'
import QAPortal from '@/components/qa/QAPortal'

export const metadata: Metadata = {
  title: 'QA Testing Portal | ECCF Platform Verification',
  description: 'Centralized functional testing checklist and live defect tracking for the ECCF Testing Department.',
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'

export default async function QAPage() {
  const initialData = await getQAChecklist()

  return <QAPortal initialData={initialData} />
}
