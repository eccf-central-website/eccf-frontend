/**
 * Online Giving Page — /give
 *
 * Dedicated global giving portal supporting Tithes, Offerings, Building Projects,
 * Smile Projects, and Welfare contributions with Flutterwave SSL security.
 */

'use client'

import GivingHubSection from '@/components/home/GivingHubSection'

export default function GivePage() {
  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <GivingHubSection />
    </div>
  )
}
