import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  User,
  ArrowRight,
  RotateCcw,
  LogIn,
  ExternalLink,
  Crown,
  Home,
  Users,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Layers,
} from 'lucide-react'
import { getRegistrationStatus } from '@/app/actions/worker-registration'

export const metadata: Metadata = {
  title: 'Workforce Registration & Application Status — ECCF',
  description:
    'Track your operational team memberships and executive designations live verification status in the Edo State University Christian Campus Fellowship.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function RegistrationStatusPage() {
  const statusResult = await getRegistrationStatus()

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-950 pt-28 sm:pt-32 md:pt-36 pb-20 sm:pb-28">
      <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#0077cc] font-mono block">
            WORKFORCE CRM PORTAL
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-slate-950 font-bold tracking-tight">
            Registration &amp; Application Status
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Live verification tracking for fellowship operational team memberships and presidential executive appointments.
          </p>
        </div>

        {/* CASE A: Not Signed In — Enforce Identity Verification to Prevent PII Harvesting */}
        {!statusResult.signedIn ? (
          <div className="w-full max-w-xl mx-auto space-y-6">
            <div className="rounded-3xl border-2 border-slate-200 bg-white p-8 sm:p-10 text-center space-y-6 shadow-sm">
              <div className="mx-auto flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-50 border border-sky-200 text-[#0077cc]">
                <ShieldCheck className="h-8 w-8 shrink-0" />
              </div>

              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-bold text-slate-950">
                  Authentication Required
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                  To protect fellowship member privacy and hostel room information, you must sign in with your verified email or Google account to view your registration status.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-sm"
                >
                  <LogIn className="h-4 w-4 shrink-0" />
                  <span>Sign In with Clerk</span>
                </Link>

                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-6 text-sm font-bold text-white hover:brightness-105 transition-all shadow-md shadow-sky-600/20"
                >
                  <span>Complete Worker Registration</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </div>
            </div>
          </div>
        ) : !statusResult.worker ? (
          /* CASE B: Signed In but no worker record linked */
          <div className="w-full max-w-xl mx-auto space-y-6">
            <div className="rounded-3xl border-2 border-slate-200 bg-white p-8 sm:p-10 text-center space-y-6 shadow-sm">
              <div className="mx-auto flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600">
                <AlertTriangle className="h-8 w-8 shrink-0" />
              </div>

              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-bold text-slate-950">
                  No Registration Linked
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                  You are signed in as <span className="font-semibold text-slate-900">{statusResult.clerkEmail}</span>, but no workforce intake registration was found under this account yet.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-6 text-sm font-bold text-white hover:brightness-105 transition-all shadow-md shadow-sky-600/20"
                >
                  <span>Complete Worker Registration</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* CASE C: Profile Found — Display Status Board for the Verified User */
          <div className="space-y-6 sm:space-y-8">
            {/* 1. Applicant Profile Card */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                  {statusResult.worker.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={statusResult.worker.profileImageUrl}
                      alt={statusResult.worker.fullName}
                      className="h-14 w-14 sm:h-18 sm:w-18 shrink-0 rounded-2xl object-cover border-2 border-slate-200 shadow-2xs"
                    />
                  ) : (
                    <div className="h-14 w-14 sm:h-18 sm:w-18 shrink-0 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0077cc]">
                      <User className="h-7 w-7 shrink-0" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-950 break-words leading-tight">
                        {statusResult.worker.fullName}
                      </h2>
                      {statusResult.worker.clerkUserId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" /> Clerk Linked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                          <Clock className="h-3 w-3 shrink-0 text-amber-600" /> Pending Clerk Linking
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 min-w-0">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="break-all">{statusResult.worker.email}</span>
                    </p>
                    {statusResult.worker.phoneNumber && (
                      <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span>{statusResult.worker.phoneNumber}</span>
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  href="/register"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-center shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                  <span>Update Profile</span>
                </Link>
              </div>

              {/* Profile Details Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-slate-500 block font-medium text-[11px]">Campus Residence</span>
                    <span className="font-bold text-slate-900 block mt-0.5 truncate">
                      {statusResult.worker.hall}, Room {statusResult.worker.roomNumber || '—'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-slate-500 block font-medium text-[11px]">Birthday (Celebration)</span>
                    <span className="font-bold text-slate-900 block mt-0.5 truncate">
                      {statusResult.worker.birthDate || 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <Layers className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-slate-500 block font-medium text-[11px]">Active Teams</span>
                    <span className="font-bold text-slate-900 block mt-0.5 truncate">
                      {statusResult.worker.memberships.length} Team{statusResult.worker.memberships.length !== 1 ? 's' : ''} Selected
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Operational Team Memberships Section */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-950 flex items-center gap-2">
                  <Users className="h-5 w-5 shrink-0 text-[#0077cc]" />
                  <span>Operational Team Memberships</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Operational service teams verified by their respective Team Leads.
                </p>
              </div>

              {statusResult.worker.memberships.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">
                  No operational teams on file. <Link href="/register" className="text-[#0077cc] underline font-semibold">Select teams to join &rarr;</Link>
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {statusResult.worker.memberships.map((membership) => {
                    const status = membership.status
                    return (
                      <div
                        key={membership.key}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 ${
                          status === 'verified'
                            ? 'border-emerald-200 bg-emerald-50/50'
                            : status === 'rejected'
                              ? 'border-rose-200 bg-rose-50/50'
                              : 'border-amber-200/90 bg-amber-50/40'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="font-bold text-sm sm:text-base text-slate-950 truncate">{membership.teamName}</h4>
                          <p className="text-[11px] text-slate-500">
                            {status === 'verified'
                              ? 'Roster verified by Department Head.'
                              : status === 'rejected'
                                ? 'Not verified for this team session.'
                                : 'Awaiting Team Lead confirmation.'}
                          </p>
                        </div>

                        {/* Live Badges */}
                        <div className="shrink-0 self-start sm:self-center">
                          {status === 'verified' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-700" />
                              <span>Verified Worker</span>
                            </span>
                          )}
                          {status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                              <XCircle className="h-3 w-3 shrink-0 text-rose-700" />
                              <span>Declined</span>
                            </span>
                          )}
                          {status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                              <Clock className="h-3 w-3 shrink-0 text-amber-700 animate-pulse" />
                              <span>Pending Review</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 3. Executive Appointments & Designations Section */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 md:p-8 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-950 flex items-center gap-2">
                  <Crown className="h-5 w-5 shrink-0 text-amber-600" />
                  <span>Executive Leadership Designations</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Appointments to executive governance and pastorate. Approved exclusively by the Fellowship President.
                </p>
              </div>

              {statusResult.worker.positions.length === 0 ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-xs sm:text-sm">
                    <User className="h-4 w-4 shrink-0 text-slate-500" />
                    <span>Registered as Volunteer Worker</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Executive positions are appointed by the Fellowship President. Contact the President or Technical Administrator if you believe a position is missing.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {statusResult.worker.positions.map((pos) => {
                    const status = pos.status
                    return (
                      <div
                        key={pos.key}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 ${
                          status === 'approved'
                            ? 'border-emerald-200 bg-emerald-50/60'
                            : status === 'rejected'
                              ? 'border-rose-200 bg-rose-50/60'
                              : 'border-amber-200 bg-amber-50/50'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            {pos.kind === 'csgb' && <Crown className="h-4 w-4 shrink-0 text-amber-600" />}
                            {pos.kind === 'hall' && <Home className="h-4 w-4 shrink-0 text-[#0077cc]" />}
                            {pos.kind === 'team' && <Users className="h-4 w-4 shrink-0 text-indigo-600" />}
                            <h4 className="font-bold text-sm sm:text-base text-slate-950 truncate">{pos.title}</h4>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            {pos.kind === 'csgb' && 'Christian Student Governing Board & Executive Council.'}
                            {pos.kind === 'hall' && `Hostel ministry shepherd for ${pos.hall || 'hall'}.`}
                            {pos.kind === 'team' && `Ministry coordinator for ${pos.teamName || 'team'}.`}
                          </p>
                        </div>

                        {/* Live Badges */}
                        <div className="shrink-0 self-start sm:self-center">
                          {status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-600 text-white shadow-2xs">
                              <ShieldCheck className="h-3 w-3 shrink-0" />
                              <span>Approved</span>
                            </span>
                          )}
                          {status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-600 text-white shadow-2xs">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>Declined</span>
                            </span>
                          )}
                          {status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500 text-white shadow-2xs animate-pulse">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>Pending Approval</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 4. Bottom Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              {statusResult.worker.positions.some((p) => p.status === 'approved') ? (
                <Link
                  href="/dashboard"
                  className="flex h-12 sm:h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0077cc] to-[#0095ff] px-6 sm:px-8 text-sm sm:text-base font-bold text-white hover:brightness-105 transition-all shadow-md shadow-sky-600/25 w-full sm:w-auto"
                >
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span>Access Exco Dashboard</span>
                  <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                </Link>
              ) : null}

              <Link
                href="/register"
                className="flex h-12 sm:h-14 items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-white px-6 sm:px-8 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs w-full sm:w-auto"
              >
                <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Update Worker Record</span>
              </Link>

              <Link
                href="/"
                className="flex h-12 sm:h-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 sm:px-6 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-200 transition-all w-full sm:w-auto"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
