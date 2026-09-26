'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { FirstTimerForm } from '@/components/forms/FirstTimerForm'
import { WelfareForm } from '@/components/forms/WelfareForm'
import { PrayerRequestForm } from '@/components/forms/PrayerRequestForm'

type TabType = 'first-timer' | 'welfare' | 'prayer'

const TABS: {
  id: TabType
  label: string
  badge: string
  title: string
  description: string
}[] = [
  {
    id: 'first-timer',
    label: 'New Here?',
    badge: 'FIRST TIMERS & FRESHERS',
    title: 'Welcome to ECCF',
    description: 'Stepping into fellowship for the first time? We would love to connect and welcome you to campus!',
  },
  {
    id: 'welfare',
    label: 'Need Support?',
    badge: 'STUDENT CARE & WELFARE',
    title: 'We Are Here For You',
    description: 'In need of academic, welfare, or material support? Let our welfare team assist you in complete confidence.',
  },
  {
    id: 'prayer',
    label: 'Need Prayer?',
    badge: 'INTERCESSORY PRAYER',
    title: 'Stand in Agreement',
    description: 'Whatever burden or desire is on your heart, our dedicated intercessory team will join their faith with yours.',
  },
]

export default function ConnectHub() {
  const searchParams = useSearchParams()
  const initialParam = searchParams.get('tab') as TabType | null
  const defaultTab: TabType =
    initialParam && ['first-timer', 'welfare', 'prayer'].includes(initialParam)
      ? initialParam
      : 'first-timer'

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab)

  const currentTabInfo = TABS.find((t) => t.id === activeTab) || TABS[0]

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Interactive Segmented Control Tabs */}
      <div className="flex justify-center mb-8 sm:mb-12">
        <div className="inline-flex items-center p-1.5 rounded-full bg-stone-200/70 border border-stone-300/60 backdrop-blur-sm gap-1 sm:gap-1.5 shadow-inner">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-2.5 sm:px-7 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeConnectTab"
                    className="absolute inset-0 rounded-full bg-slate-950"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Form Card with Smooth Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          {/* Context Header for the active category */}
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#0077cc] block font-mono">
              {currentTabInfo.badge}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-slate-950 tracking-tight">
              {currentTabInfo.title}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto font-normal leading-relaxed">
              {currentTabInfo.description}
            </p>
          </div>

          {/* Form */}
          <div className="w-full">
            {activeTab === 'first-timer' && <FirstTimerForm />}
            {activeTab === 'welfare' && <WelfareForm />}
            {activeTab === 'prayer' && <PrayerRequestForm />}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
