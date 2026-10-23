import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import { getSanityClient } from '@/lib/sanity'
import { SITE_SETTINGS_QUERY } from '@/lib/queries'
import type { SiteSettingsData } from '@/components/home/HeroSection'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Privacy & Data Care Charter | ECCF Edo State University Fellowship',
  description:
    'Official Charter on Personal Data Care, Privacy, and Student Trust for Edo State University Christian Campus Fellowship (ECCF).',
}

export default async function PrivacyPage() {
  const client = getSanityClient(false)
  const settings = await client
    .fetch<SiteSettingsData>(SITE_SETTINGS_QUERY)
    .catch(() => null)

  const fellowshipEmail = settings?.fellowshipEmail || 'contact@eccf.org'

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 pt-28 sm:pt-32 md:pt-36 pb-24 sm:pb-32">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#0077cc] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>Back to Fellowship Home</span>
          </Link>
        </div>

        {/* ==================================================================== */}
        {/* THE OFFICIAL DOCUMENT CONTAINER                                     */}
        {/* ==================================================================== */}
        <article className="bg-white border border-slate-200/90 shadow-sm rounded-2xl sm:rounded-3xl p-6 sm:p-12 md:p-16">
          {/* Document Header */}
          <header className="border-b border-slate-200 pb-8 sm:pb-10 mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0077cc] text-xs font-mono font-bold tracking-wider uppercase mb-4">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>OFFICIAL CHARTER &bull; DATA CARE</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-slate-950 tracking-tight leading-tight">
              Charter on Personal Data Care, Privacy &amp; Student Trust
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-sans">
              Edo State University Christian Campus Fellowship (ECCF) &mdash; Uzairue / Iyamho, Edo State, Nigeria.
            </p>

            {/* Document Metadata Table / Registry Details */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-500">
              <div>
                <span className="block text-slate-400 uppercase tracking-wider">Document Ref</span>
                <span className="font-semibold text-slate-800">ECCF-DCP-2026</span>
              </div>
              <div>
                <span className="block text-slate-400 uppercase tracking-wider">Status</span>
                <span className="font-semibold text-emerald-700">Active &amp; Enforced</span>
              </div>
              <div>
                <span className="block text-slate-400 uppercase tracking-wider">Scope</span>
                <span className="font-semibold text-slate-800">Campus-Wide</span>
              </div>
              <div>
                <span className="block text-slate-400 uppercase tracking-wider">Last Revised</span>
                <span className="font-semibold text-slate-800">October 2026</span>
              </div>
            </div>
          </header>

          {/* Document Body */}
          <div className="space-y-12 text-slate-700 text-base sm:text-[17px] leading-relaxed font-sans">
            {/* ---------------------------------------------------------------- */}
            {/* SECTION 1: PREAMBLE                                              */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                1. Preamble &amp; Pastoral Covenant
              </h2>
              <p>
                The Edo State University Christian Campus Fellowship (ECCF) is a covenant spiritual family dedicated to
                raising spiritual dynamites and academic giants. We operate as a body of Christ, not a commercial enterprise
                or data aggregator.
              </p>
              <p>
                We recognize that when students, campus workers, and visitors share their details with us, they are extending
                sacred trust. We believe that loving God and shepherding His people includes protecting their privacy with
                unwavering diligence, integrity, and biblical discretion.
              </p>
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border-l-4 border-[#0077cc] text-slate-800 text-sm sm:text-base italic">
                &ldquo;A talebearer reveals secrets, but he who is of a faithful spirit conceals a matter.&rdquo;
                <span className="block not-italic text-xs font-mono text-slate-500 mt-1 font-bold">
                  &mdash; Proverbs 11:13 (NKJV)
                </span>
              </div>
              <p>
                We hold a simple, non-negotiable standard: <strong>We never sell, rent, monetize, or trade your personal data.</strong> Your
                information stays strictly within the fellowship stewardship and is never distributed to third-party commercial vendors,
                advertisers, or external tracking services.
              </p>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 2: INFORMATION COLLECTED & PURPOSES                     */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                  2. Information We Collect and Why
                </h2>
                <p className="mt-2 text-slate-600">
                  Every piece of information requested across our web portal serves a clearly defined pastoral or operational purpose:
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                    2.1 Full Name and Identity
                  </h3>
                  <p className="mt-1">
                    We collect your first name, surname, and initials so that fellowship leaders, pastors, and unit heads can address you
                    personally with dignity. Your name is also used to maintain ministerial rosters and verify appointments across our 14
                    operational service units.
                  </p>
                </div>

                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                    2.2 Contact Coordinates (Phone Number and Email)
                  </h3>
                  <p className="mt-1">
                    Your phone number and email address allow us to send timely notices regarding worship services, spiritual conferences,
                    emergency welfare announcements, and audio sermon releases. We respect your schedule and do not send unsolicited promotional
                    spam.
                  </p>
                </div>

                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                    2.3 Hostel Residence and Room Coordinates
                  </h3>
                  <p className="mt-1">
                    University life in campus halls (Halls 1 through 8) can be rigorous and isolating. When you provide your hall and room
                    number, appointed Hall Pastors and Representatives use this coordinate solely to pay friendly pastoral visits, check on
                    your physical and academic well-being, provide comfort during illness, and pray with you prior to university examinations.
                  </p>
                </div>

                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                    2.4 Milestone Dates (Birth Month &amp; Day) and Celebratory Portraits
                  </h3>
                  <p className="mt-1">
                    We love to honor God&apos;s grace in our workers&apos; lives on their birthdays. To safeguard your privacy, we intentionally collect
                    <strong> only your birth month and day</strong> &mdash; we never collect, store, or display your birth year or chronological age.
                    Our Media Ministry uses this information, alongside your portrait photograph, exclusively to design celebratory birthday flyers.
                  </p>
                </div>

                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                    2.5 Pastoral Prayers and Welfare Submissions
                  </h3>
                  <p className="mt-1">
                    Requests submitted for academic intervention, financial aid, emotional counseling, or private intercessory prayer are treated
                    under strict pastoral confidence. They are routed directly to the Welfare Secretary, Prayer Coordinator, or Resident Pastor, and
                    are never made accessible to the wider student body.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 3: ROLE-BASED ACCESS CONTROL                             */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                  3. Role-Based Access: Who Sees Your Information
                </h2>
                <p className="mt-2 text-slate-600">
                  We enforce strict segmentation of records. Fellowship executives do not have unrestricted access to all worker files; each
                  leader&apos;s access is bounded strictly by their pastoral jurisdiction:
                </p>
              </div>

              <div className="space-y-4">
                <div className="pl-4 sm:pl-6 border-l-2 border-slate-200">
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Clause 3.1 &mdash; Hall Pastors &amp; Representatives
                  </h3>
                  <p className="mt-1 text-sm sm:text-base">
                    Hall Representatives are strictly restricted to members residing within their assigned hostel (for example, Hall 1
                    Representatives can only access Hall 1 residents). They cannot view students residing in other halls or opposite wings.
                  </p>
                </div>

                <div className="pl-4 sm:pl-6 border-l-2 border-slate-200">
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Clause 3.2 &mdash; Operational Unit &amp; Team Leaders
                  </h3>
                  <p className="mt-1 text-sm sm:text-base">
                    Team leads (such as Choir, Ushering, Protocol, or Academic Distinction) may only view workers who are active members of their
                    specific unit or applicants who have explicitly requested to join.
                  </p>
                </div>

                <div className="pl-4 sm:pl-6 border-l-2 border-slate-200">
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Clause 3.3 &mdash; Media &amp; Digital Production Team
                  </h3>
                  <p className="mt-1 text-sm sm:text-base">
                    Media personnel are granted read-only visibility into worker names, birth dates (month and day only), and profile photographs
                    strictly for the purpose of scheduling and designing celebratory birthday publications.
                  </p>
                </div>

                <div className="pl-4 sm:pl-6 border-l-2 border-slate-200">
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Clause 3.4 &mdash; Central Executive Body (CSGB Admin)
                  </h3>
                  <p className="mt-1 text-sm sm:text-base">
                    The Central Student Governing Body maintains administrative oversight to coordinate fellowship-wide rosters, verify
                    leadership appointments, and handle urgent pastoral escalations.
                  </p>
                </div>

                <div className="pl-4 sm:pl-6 border-l-2 border-rose-300">
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Clause 3.5 &mdash; General Public &amp; Website Visitors
                  </h3>
                  <p className="mt-1 text-sm sm:text-base">
                    Website visitors, non-executive students, search engines, and outside parties have <strong>zero access</strong> to personal contact
                    numbers, room locations, or fellowship membership files.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 4: TECHNICAL SAFEGUARDS & ENCRYPTION                     */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                4. Technical Safeguards and Cryptographic Locks
              </h2>
              <p>
                To provide genuine defense against data breaches or snooping, our digital infrastructure implements field-level
                cryptographic protection using <strong>AES-256-GCM encryption</strong>.
              </p>
              <p>
                In plain terms, when you submit your telephone number or hostel room on our registration portal, our application server
                scrambles that plain text into an unintelligible, mathematically encrypted cipher before it ever touches database storage.
              </p>
              <p>
                Even in the improbable scenario where an unauthorized individual gained raw access to our backend database, your telephone
                digits and room numbers would look like random strings of meaningless characters. Only authenticated fellowship leaders with
                valid, cryptographically verified session credentials can momentarily decrypt what is necessary to serve you.
              </p>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 5: STUDENT RIGHTS & CONTROL                              */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-5">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                5. Your Rights as a Student and Fellowship Member
              </h2>
              <p>
                You retain ultimate ownership and control over your personal records at all times. Specifically:
              </p>

              <ul className="space-y-4 pl-5 list-disc marker:text-[#0077cc]">
                <li>
                  <strong>The Right to Update Residence and Units:</strong> Moving to a new hostel or allocated a different room next semester?
                  You do not need to fill out endless paperwork. Simply re-enter your registered phone number on our intake portal; the system
                  will securely verify you and let you update your room or team preferences in seconds.
                </li>
                <li>
                  <strong>The Right to Notification Preferences:</strong> You can pause or opt out of broadcast emails, SMS updates, or birthday
                  flyer publication at any time by speaking to your unit lead or sending a short note to our secretariat.
                </li>
                <li>
                  <strong>The Right to Erasure (The &ldquo;Clean Slate&rdquo;):</strong> When you graduate, transfer institutions, or choose to step
                  aside, you may request that your details be permanently and irreversibly purged from our fellowship records. We honor all
                  deletion requests promptly without questioning.
                </li>
              </ul>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 6: GOVERNANCE & CONTACTS                                 */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                6. Inquiries, Corrections and Pastoral Care
              </h2>
              <p>
                If you have questions about how your personal details are being stewarded, wish to report an inaccuracy, or desire pastoral
                guidance regarding your privacy preferences, please reach out to the Central Secretariat:
              </p>

              <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-900">
                  Edo State University Christian Campus Fellowship (ECCF)
                </div>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>Central Student Governing Body (CSGB) &bull; Secretariat</p>
                  <p>Meeting Venue: Lecture Theatre 5 (NLT 5), Faculty of Law</p>
                  <p>Edo State University Uzairue, Iyamho, Edo State, Nigeria</p>
                </div>
                <div className="pt-2">
                  <a
                    href={`mailto:${fellowshipEmail}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#0077cc] hover:underline"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>Direct Inquiries: {fellowshipEmail}</span>
                  </a>
                </div>
              </div>

              <div className="pt-6 text-xs text-slate-400 font-mono text-center sm:text-left">
                Ratified by the Central Student Governing Body (CSGB) in consultation with the Pastoral Advisory Directorate.
              </div>
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}
