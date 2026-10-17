import { Metadata } from 'next'
import Link from 'next/link'
import {
  ShieldCheck,
  Heart,
  Lock,
  Home,
  Phone,
  Calendar,
  Sparkles,
  Users,
  CheckCircle2,
  Mail,
  ArrowLeft,
  UserCheck,
} from 'lucide-react'
import { getSanityClient } from '@/lib/sanity'
import { SITE_SETTINGS_QUERY } from '@/lib/queries'
import type { SiteSettingsData } from '@/components/home/HeroSection'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Privacy & Data Care | ECCF Edo State University Fellowship',
  description:
    'A friendly, plain-English explanation of how ECCF protects your personal information, room number, contact details, and prayers.',
}

export default async function PrivacyPage() {
  const client = getSanityClient(false)
  const settings = await client
    .fetch<SiteSettingsData>(SITE_SETTINGS_QUERY)
    .catch(() => null)

  const fellowshipEmail = settings?.fellowshipEmail || 'contact@eccf.org'

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-950 pt-28 sm:pt-32 md:pt-36 pb-20 sm:pb-28">
      <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#0077cc] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Homepage</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-[#0077cc] text-xs font-mono font-bold tracking-wider uppercase mb-4">
            <ShieldCheck className="h-4 w-4" />
            <span>DATA CARE &amp; TRUST</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-tight">
            How We Care For Your Information
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            We are a campus fellowship family, not a big tech corporation. We believe loving God and caring for each
            other means treating your personal information with absolute respect, confidentiality, and care.
          </p>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 1: THE SHORT VERSION (TL;DR)                                 */}
        {/* ==================================================================== */}
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-sky-50/80 via-white to-blue-50/50 border-2 border-sky-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0077cc] text-white shadow-xs">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-950">
                The Quick Summary (In Plain English)
              </h2>
              <span className="text-xs text-slate-500 font-mono">No confusing legal jargon. Here is our promise to you:</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-sm">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-sky-100 shadow-xs">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-slate-700 leading-snug">
                <strong>We never sell your data:</strong> Your details stay in ECCF and are never shared with outside companies or advertisers.
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-sky-100 shadow-xs">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-slate-700 leading-snug">
                <strong>Digital locks on private details:</strong> Sensitive items like your phone number and room number are encrypted.
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-sky-100 shadow-xs">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-slate-700 leading-snug">
                <strong>Strict need-to-know access:</strong> Leaders only see the specific slice of info needed to care for you in fellowship.
              </p>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-sky-100 shadow-xs">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-slate-700 leading-snug">
                <strong>You are in control:</strong> You can update your room number, phone, or request deletion anytime without hassle.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 2: WHAT WE ASK FOR & WHY                                     */}
        {/* ==================================================================== */}
        <div className="space-y-6 mb-12">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950">
              What We Collect &amp; Why We Need It
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Every detail we ask for has a clear pastoral or operational purpose on campus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Room & Hall */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0077cc]">
                <Home className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-950">
                Your Hall &amp; Room Number
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Campus hostels are busy and it’s easy to feel lost in the crowd. When you register or fill a connect card,
                our <strong>Hall Representatives</strong> use your room number to drop by for friendly visits, check on your
                welfare, bring exam-season care, or pray with you.
              </p>
              <div className="pt-1 text-xs text-slate-400 font-mono">
                🔒 Protected by AES-256 field-level encryption.
              </div>
            </div>

            {/* Card 2: Phone & Email */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-950">
                Your Phone Number &amp; Email
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                We use your phone number and email to keep you informed about service timings, special fellowship programmes,
                and prayer meetings. We do not blast you with spam or share your number with outsiders.
              </p>
              <div className="pt-1 text-xs text-slate-400 font-mono">
                🔒 Phone numbers are masked &amp; encrypted at rest.
              </div>
            </div>

            {/* Card 3: Birthday & Photo */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-950">
                Your Birthday &amp; Celebratory Photo
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                For workforce members, we celebrate you! We only ask for your <strong>birth month and day</strong> (we deliberately
                do not collect your birth year). Our Media Team uses your photo to design a special birthday flyer to honor you
                on your special day.
              </p>
              <div className="pt-1 text-xs text-slate-400 font-mono">
                🎂 Month &amp; Day only — no birth year collected.
              </div>
            </div>

            {/* Card 4: Welfare & Prayer */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-950">
                Welfare &amp; Prayer Requests
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                University life comes with academic, emotional, and physical demands. When you share a welfare need or prayer request,
                it is held in strict confidence. Only our appointed Welfare Secretary and Prayer Coordinator handle these matters.
              </p>
              <div className="pt-1 text-xs text-slate-400 font-mono">
                🕊️ Confidential pastoral care &amp; intercession.
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 3: WHO ACTUALLY SEES YOUR DETAILS?                           */}
        {/* ==================================================================== */}
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold tracking-wider uppercase mb-2">
              <Users className="h-3.5 w-3.5 text-[#0077cc]" />
              <span>ROLE-BASED ACCESS CONTROL</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950">
              Who Actually Sees Your Details?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              We don&apos;t allow just any executive or member to view everyone&apos;s personal records. Everything is strictly segmented:
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="font-serif font-black text-sm px-2.5 py-1 rounded-lg bg-blue-100 text-[#0077cc] shrink-0 mt-0.5">
                Hall Reps
              </span>
              <p className="text-slate-700 leading-relaxed">
                Can <strong>only</strong> see the workers and students residing in their specific hall (e.g. Hall 1 Reps only see Hall 1).
                They cannot see students in other halls.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="font-serif font-black text-sm px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                Team Leads
              </span>
              <p className="text-slate-700 leading-relaxed">
                Can <strong>only</strong> see workers who belong to or have applied to their operational unit (e.g. Choir Lead only sees Choir;
                Ushering Lead only sees Ushering).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="font-serif font-black text-sm px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 shrink-0 mt-0.5">
                Media Team
              </span>
              <p className="text-slate-700 leading-relaxed">
                Can see worker names, birthdays, and profile pictures for the sole purpose of designing celebratory birthday flyers.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="font-serif font-black text-sm px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 shrink-0 mt-0.5">
                CSGB Admin
              </span>
              <p className="text-slate-700 leading-relaxed">
                Central executive oversight to verify ministerial appointments, manage fellowship rosters, and resolve urgent escalations.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex items-start gap-3 text-rose-950 font-medium">
              <span className="font-serif font-black text-sm px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 shrink-0 mt-0.5">
                Public View
              </span>
              <p className="leading-relaxed">
                General members, students, and website visitors have <strong>zero access</strong> to your contact information, room numbers,
                or registration details.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 4: HOW WE KEEP IT SAFE (THE DIGITAL LOCKS)                  */}
        {/* ==================================================================== */}
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-slate-950">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                How We Protect It (The Digital Locks)
              </h2>
              <span className="text-xs text-sky-300 font-mono">Modern cryptography behind the scenes</span>
            </div>
          </div>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Whenever you submit your phone number or room number, our server immediately scrambles that text into an unreadable
            code before storing it in our database (using <strong>AES-256-GCM encryption</strong>).
          </p>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Even if an attacker somehow managed to inspect the database directly, your phone number and hostel room would look like
            random strings of scrambled gibberish. Only authorized fellowship leaders logging in with authenticated credentials can
            decrypt what they need to serve you.
          </p>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 5: YOU ARE IN CONTROL (YOUR RIGHTS)                          */}
        {/* ==================================================================== */}
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-950">
                You Are Always In Control
              </h2>
              <span className="text-xs text-slate-500 font-mono">Simple, student-friendly rights</span>
            </div>
          </div>

          <ul className="space-y-3 text-sm text-slate-700 leading-relaxed pt-2">
            <li className="flex items-start gap-2">
              <span className="text-[#0077cc] font-bold">•</span>
              <span>
                <strong>Moved to a new room or hall?</strong> Simply visit our registration page and enter your phone number.
                The system will automatically recognize you and let you update your hostel room and operational teams in seconds.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#0077cc] font-bold">•</span>
              <span>
                <strong>Want to pause notifications?</strong> You can opt out of fellowship email digests or SMS broadcasts at any time.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#0077cc] font-bold">•</span>
              <span>
                <strong>Need your record deleted?</strong> If you graduate, relocate, or wish to have your details completely erased from our
                database, just contact us and we will delete your record with no questions asked.
              </span>
            </li>
          </ul>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 6: QUESTIONS OR NEED HELP?                                  */}
        {/* ==================================================================== */}
        <div className="p-6 sm:p-8 rounded-3xl bg-sky-50 border border-sky-200 text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold text-slate-950">
            Have Questions or Concerns?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
            If you ever have a question about how your information is handled, or if you want to update your pastoral preferences,
            feel free to reach out to our General Secretary or any CSGB Executive.
          </p>

          <div className="pt-2">
            <a
              href={`mailto:${fellowshipEmail}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0077cc] hover:bg-[#0066b3] text-white text-sm font-bold shadow-sm transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>Contact Us: {fellowshipEmail}</span>
            </a>
          </div>

          <p className="text-xs text-slate-500 pt-2 font-mono">
            Edo State University Christian Campus Fellowship (ECCF) &bull; Iyamho, Edo State, Nigeria.
          </p>
        </div>
      </div>
    </div>
  )
}
