import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileText, Mail } from 'lucide-react'
import { getSanityClient } from '@/lib/sanity'
import { SITE_SETTINGS_QUERY } from '@/lib/queries'
import type { SiteSettingsData } from '@/components/home/HeroSection'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Terms of Use | ECCF Edo State University Fellowship',
  description:
    'Terms of use and acceptable conduct for the ECCF website and Exco Portal, including account registration, Google sign-in, member data stewardship, and content usage.',
}

export default async function TermsPage() {
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
              <FileText className="h-4 w-4 shrink-0" />
              <span>OFFICIAL CHARTER &bull; TERMS OF USE</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-slate-950 tracking-tight leading-tight">
              Terms of Use &amp; Acceptable Conduct
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-sans">
              Edo State University Christian Campus Fellowship (ECCF) &mdash; ESUI, Edo State, Nigeria.
            </p>

            {/* Document Metadata Table / Registry Details */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-500">
              <div>
                <span className="block text-slate-400 uppercase tracking-wider">Document Ref</span>
                <span className="font-semibold text-slate-800">ECCF-TOU-2026</span>
              </div>
              <div>
                <span className="block text-slate-400 uppercase tracking-wider">Status</span>
                <span className="font-semibold text-emerald-700">Active &amp; Enforced</span>
              </div>
              <div>
                <span className="block text-slate-400 uppercase tracking-wider">Scope</span>
                <span className="font-semibold text-slate-800">Website &amp; Exco Portal</span>
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
            {/* SECTION 1: ACCEPTANCE                                            */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                1. Acceptance of These Terms
              </h2>
              <p>
                These Terms of Use govern your access to the ECCF public website at{' '}
                <strong>eccffamily.org</strong>, the Exco / worker portal, and any related forms, tools, or
                services we provide (together, the &ldquo;Services&rdquo;).
              </p>
              <p>
                By browsing the website, submitting a form, creating an account, or signing in to the portal, you
                agree to these Terms and to our{' '}
                <Link href="/privacy" className="font-semibold text-[#0077cc] hover:underline">
                  Privacy &amp; Data Care Charter
                </Link>
                . If you do not agree, please do not use the Services.
              </p>
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border-l-4 border-[#0077cc] text-slate-800 text-sm sm:text-base italic">
                &ldquo;Whatever you do, work at it with all your heart, as working for the Lord, not for human
                masters.&rdquo;
                <span className="block not-italic text-xs font-mono text-slate-500 mt-1 font-bold">
                  &mdash; Colossians 3:23 (NIV)
                </span>
              </div>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 2: ABOUT THE SERVICES                                    */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                2. About ECCF and the Portal
              </h2>
              <p>
                Edo State University Christian Campus Fellowship (ECCF) is a campus fellowship committed to raising
                spiritual dynamites and academic giants. The public website shares information about our worship,
                sermons, bulletins, and events.
              </p>
              <p>
                The Exco Portal is a private, role-based workspace for registered fellowship workers, unit leaders,
                and executives. It supports ministry administration such as worker records, unit rosters, attendance,
                welfare follow-up, and event coordination.
              </p>
              <p>
                The Services are provided for fellowship and ministry purposes. They are not a commercial service,
                a public social network, or a substitute for professional legal, medical, financial, or academic
                advice.
              </p>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 3: ACCOUNTS                                              */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                  3. Eligibility, Registration and Account Security
                </h2>
                <p className="mt-2 text-slate-600">
                  Portal access is a stewardship responsibility, not a public right. The following conditions apply:
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                    3.1 Authorised Workers Only
                  </h3>
                  <p className="mt-1">
                    Accounts are intended for registered workers and leaders whose details have been verified by the
                    Christian Student Governing Board (CSGB) or an authorised unit head. Submitting a registration form
                    does not automatically grant portal access.
                  </p>
                </div>

                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                    3.2 Accurate Information
                  </h3>
                  <p className="mt-1">
                    You agree to provide truthful, current, and complete information when registering or updating your
                    profile. Impersonating another person, using a false identity, or registering on behalf of someone
                    without their consent is prohibited.
                  </p>
                </div>

                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                    3.3 One Account Per Person
                  </h3>
                  <p className="mt-1">
                    You may not create multiple accounts to bypass access controls, evade a suspension, or manipulate
                    records. Accounts are personal and may not be shared, sold, or transferred.
                  </p>
                </div>

                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                    3.4 Safeguarding Your Login
                  </h3>
                  <p className="mt-1">
                    You are responsible for activity carried out under your account. Keep your email account and any
                    sign-in credentials secure, do not share verification codes, and notify the Secretariat promptly
                    if you suspect unauthorised access.
                  </p>
                </div>

                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                    3.5 Suspension and Revocation
                  </h3>
                  <p className="mt-1">
                    We may suspend, restrict, or revoke access where these Terms are violated, where a role or
                    appointment ends, or where continued access would compromise member privacy or fellowship
                    operations.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 4: GOOGLE SIGN-IN                                        */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                4. Signing In with Google
              </h2>
              <p>
                The portal uses a managed authentication provider (Clerk) and supports signing in with a Google
                account. When you choose &ldquo;Continue with Google&rdquo;, Google authenticates you and shares the
                basic profile information permitted by your Google settings.
              </p>
              <p>
                We receive only the information needed to identify and verify your account &mdash; typically your
                name, email address, and profile photograph. We do <strong>not</strong> receive your Google password,
                and we do <strong>not</strong> request access to Gmail, Google Drive, Calendar, Contacts, or other
                Google services as part of sign-in.
              </p>
              <p>
                Your use of a Google account is also governed by Google&apos;s own terms and privacy policy. You are
                responsible for maintaining the security of your Google account. If you sign in with Google using an
                email that matches a registered worker record, the accounts may be linked so that you can access the
                portal.
              </p>
              <p>
                If you prefer not to use Google sign-in, you may use the email-based sign-in option where it is
                available, or contact the Secretariat for help with your account.
              </p>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 5: ACCEPTABLE USE                                        */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-5">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                5. Acceptable Use
              </h2>
              <p>
                You agree to use the Services in a manner consistent with the fellowship&apos;s values, the laws of
                the Federal Republic of Nigeria, and the privacy of others. You must not:
              </p>
              <ul className="space-y-4 pl-5 list-disc marker:text-[#0077cc]">
                <li>
                  <strong>Access without authorisation:</strong> attempt to view, copy, or modify records, pages, or
                  roles that have not been granted to you, or probe, scan, or bypass access controls.
                </li>
                <li>
                  <strong>Harvest or scrape data:</strong> use bots, crawlers, or automated tools to extract member
                  information, or copy portal data for commercial, political, or unrelated purposes.
                </li>
                <li>
                  <strong>Misuse member information:</strong> share, publish, or use another member&apos;s personal
                  details, hostel information, contact details, photographs, or welfare submissions outside an
                  authorised ministry purpose.
                </li>
                <li>
                  <strong>Upload harmful content:</strong> transmit malware, phishing links, unlawful material,
                  abusive content, or files designed to disrupt the Services.
                </li>
                <li>
                  <strong>Harass or impersonate:</strong> threaten, demean, or impersonate any person, or submit
                  content that violates another person&apos;s dignity or privacy.
                </li>
                <li>
                  <strong>Interfere with the Services:</strong> overload, disrupt, reverse engineer, or attempt to
                  gain unauthorised access to the servers, databases, or third-party integrations that support the
                  Services.
                </li>
                <li>
                  <strong>Use content commercially:</strong> reproduce, sell, or redistribute ECCF media, sermons,
                  designs, or member data without written permission.
                </li>
              </ul>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 6: MEMBER DATA                                           */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                6. Member Data and Confidentiality
              </h2>
              <p>
                The portal contains personal information entrusted to the fellowship by students and workers. Access
                is segmented by role, and you may only use member data for the ministry purpose for which it was
                shared with you.
              </p>
              <p>
                Do not screenshot, export, forward, or store member records outside approved fellowship systems
                unless you have a legitimate operational need and the appropriate permission. Welfare, prayer, and
                counselling submissions are especially sensitive and must be handled with pastoral discretion.
              </p>
              <p>
                Our{' '}
                <Link href="/privacy" className="font-semibold text-[#0077cc] hover:underline">
                  Privacy &amp; Data Care Charter
                </Link>{' '}
                explains what we collect, why we collect it, who can see it, and how to request corrections or
                deletion. It forms part of these Terms.
              </p>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 7: CONTENT AND IP                                        */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                7. Content, Media and Intellectual Property
              </h2>
              <p>
                The ECCF name, logo, website design, sermon recordings, flyers, photographs, documents, and other
                content made available through the Services are owned by ECCF or used with permission. You may view
                and share this content for personal encouragement and non-commercial ministry purposes, provided you
                do not remove attribution or imply endorsement.
              </p>
              <p>
                When you submit content &mdash; such as a profile photograph, testimony, event details, or unit
                update &mdash; you confirm that you have the right to share it. You grant ECCF a non-exclusive,
                royalty-free licence to store, reproduce, and display that content as needed to operate the
                fellowship and its ministries, consistent with the Privacy &amp; Data Care Charter.
              </p>
              <p>
                If you believe content on the Services infringes your rights, contact the Secretariat with enough
                detail for us to review the matter.
              </p>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 8: THIRD PARTIES                                         */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                8. Third-Party Services
              </h2>
              <p>
                The Services rely on trusted third-party providers, including authentication and Google sign-in
                (Clerk and Google), content management (Sanity), hosting and delivery (Vercel), email delivery, and
                optional Google Drive storage for approved media uploads.
              </p>
              <p>
                These providers operate under their own terms and privacy policies. We choose them with care, but we
                do not control their systems and are not responsible for outages, policy changes, or acts beyond our
                reasonable control. Links to external websites are provided for convenience and do not imply
                endorsement.
              </p>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 9: AVAILABILITY AND CHANGES                              */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                9. Availability, Changes and Termination
              </h2>
              <p>
                The Services are provided on an &ldquo;as available&rdquo; basis. We may add, modify, suspend, or
                discontinue features at any time, including during maintenance, security incidents, or changes to
                fellowship operations. We do not guarantee uninterrupted or error-free availability.
              </p>
              <p>
                We may update these Terms to reflect changes in the Services, our practices, or applicable law. The
                revised version will be posted on this page with a new revision date. Continued use after a revision
                means you accept the updated Terms.
              </p>
              <p>
                You may stop using the Services at any time. We may suspend or terminate access as described in
                Section 3.5. Where access ends, personal data will be handled in accordance with the Privacy &amp;
                Data Care Charter and any applicable record-retention needs.
              </p>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 10: DISCLAIMERS                                           */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                10. Disclaimers and Limitation of Liability
              </h2>
              <p>
                The Services are provided for fellowship and ministry administration. While we work to keep
                information accurate and systems secure, we do not warrant that every record is complete, current, or
                error-free, or that the Services will meet every individual expectation.
              </p>
              <p>
                To the maximum extent permitted by Nigerian law, ECCF, its CSGB, unit leaders, volunteers, and
                service providers will not be liable for indirect, incidental, special, or consequential loss,
                including loss of data, loss of opportunity, or reputational harm arising from the use of, or
                inability to use, the Services.
              </p>
              <p>
                Nothing in these Terms limits any liability that cannot lawfully be limited, or excludes rights you
                may have under applicable law.
              </p>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 11: GOVERNING LAW                                        */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                11. Governing Law and Dispute Resolution
              </h2>
              <p>
                These Terms are governed by the laws of the Federal Republic of Nigeria. Any dispute arising from
                the use of the Services will first be referred to the Secretariat for an amicable resolution in the
                spirit of fellowship. If resolution is not reached, the courts of Edo State, Nigeria, will have
                jurisdiction.
              </p>
            </section>

            <hr className="border-t border-slate-200" />

            {/* ---------------------------------------------------------------- */}
            {/* SECTION 12: CONTACT                                              */}
            {/* ---------------------------------------------------------------- */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                12. Questions and Contact
              </h2>
              <p>
                If you have questions about these Terms, need help with your account, or wish to report misuse of the
                Services or member data, please contact the Central Secretariat:
              </p>

              <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-900">
                  Edo State University Christian Campus Fellowship (ECCF)
                </div>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>Christian Student Governing Board (CSGB) &bull; Secretariat</p>
                  <p>Meeting Venue: Lecture Theatre 5 (NLT 5), Faculty of Law</p>
                  <p>Edo State University Iyamho (ESUI), Edo State, Nigeria</p>
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
                Ratified by the Christian Student Governing Board (CSGB) in consultation with the Pastoral Advisory
                Directorate. Read together with the{' '}
                <Link href="/privacy" className="underline hover:text-slate-600">
                  Privacy &amp; Data Care Charter
                </Link>
                .
              </div>
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}
