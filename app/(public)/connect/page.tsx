import { FirstTimerForm } from '@/components/forms/FirstTimerForm'
import { WelfareForm } from '@/components/forms/WelfareForm'
import { PrayerRequestForm } from '@/components/forms/PrayerRequestForm'

export default function ConnectPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-950 pt-28 sm:pt-32 md:pt-36 pb-20 sm:pb-28">
      <div className="w-full px-6 sm:px-8 lg:px-12">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#0077cc] font-mono block mb-3">
            ECCF CONNECT &amp; SUPPORT
          </span>
          <h1 className="font-serif font-bold text-3xl sm:text-5xl lg:text-6xl text-slate-950 tracking-tight leading-tight">
            Connect With Us
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-700 font-normal leading-relaxed">
            Whether you are joining us for the first time, in need of welfare support, or seeking prayers, our fellowship family is here for you.
          </p>
        </div>

        {/* Form Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          <div className="flex flex-col">
            <div className="mb-4 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc] block font-mono">
                FIRST TIMERS
              </span>
              <h3 className="font-serif font-bold text-2xl text-slate-950 mt-1">New Here?</h3>
              <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">We&apos;d love to get to know you!</p>
            </div>
            <FirstTimerForm />
          </div>

          <div className="flex flex-col">
            <div className="mb-4 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc] block font-mono">
                STUDENT CARE
              </span>
              <h3 className="font-serif font-bold text-2xl text-slate-950 mt-1">Need Support?</h3>
              <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">Let the welfare team assist you.</p>
            </div>
            <WelfareForm />
          </div>

          <div className="flex flex-col">
            <div className="mb-4 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0077cc] block font-mono">
                INTERCESSION
              </span>
              <h3 className="font-serif font-bold text-2xl text-slate-950 mt-1">Need Prayer?</h3>
              <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">We will join our faith with yours.</p>
            </div>
            <PrayerRequestForm />
          </div>
        </div>
      </div>
    </div>
  )
}
