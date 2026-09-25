import { FirstTimerForm } from '@/components/forms/FirstTimerForm'
import { WelfareForm } from '@/components/forms/WelfareForm'
import { PrayerRequestForm } from '@/components/forms/PrayerRequestForm'

export default function ConnectPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Connect With Us</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Whether you are joining us for the first time, in need of welfare support, or seeking prayers, we are here for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <div className="mb-4 text-center">
              <h3 className="text-xl font-bold text-sky-400">New Here?</h3>
              <p className="text-sm text-slate-400">We&apos;d love to get to know you!</p>
            </div>
            <FirstTimerForm />
          </div>

          <div>
            <div className="mb-4 text-center">
              <h3 className="text-xl font-bold text-sky-400">Need Support?</h3>
              <p className="text-sm text-slate-400">Let the welfare team assist you.</p>
            </div>
            <WelfareForm />
          </div>

          <div>
            <div className="mb-4 text-center">
              <h3 className="text-xl font-bold text-sky-400">Need Prayer?</h3>
              <p className="text-sm text-slate-400">We will join our faith with yours.</p>
            </div>
            <PrayerRequestForm />
          </div>
        </div>
      </div>
    </div>
  )
}
