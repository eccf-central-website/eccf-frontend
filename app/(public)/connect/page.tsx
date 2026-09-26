import { Suspense } from 'react'
import ConnectHub from '@/components/connect/ConnectHub'

export default function ConnectPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-950 pt-28 sm:pt-32 md:pt-36 pb-20 sm:pb-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#0077cc] font-mono block mb-2.5">
            ECCF CONNECT &amp; SUPPORT
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-tight">
            Connect With Us
          </h1>
          <p className="mt-3.5 text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Whether you are joining us for the first time, in need of welfare support, or seeking prayers, our fellowship family is here for you.
          </p>
        </div>

        {/* Interactive Segmented Tabs Hub */}
        <Suspense fallback={<div className="h-96 w-full animate-pulse bg-white rounded-3xl" />}>
          <ConnectHub />
        </Suspense>
      </div>
    </div>
  )
}
