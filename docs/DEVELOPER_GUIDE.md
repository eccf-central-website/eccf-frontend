# ECCF Frontend — Developer Code Guide

> **Audience:** developers joining or returning to this codebase. This is the technical companion to `docs/OPERATIONAL_MANUAL.md` (operations & user flows), `docs/TESTING_PLAN.md` (manual QA), `docs/operational-data-privacy.md`, and `docs/ENCRYPTION_KEY_UNIFICATION.md`.
>
> **Snapshot of record:** November 2026 — Dashboard UI modernization wave + Meeting Minutes module (against `eccf-backend` + `meetingMinute` schema).

---

## 1. Monorepo Context

| Repo | Role | Where it runs |
| :--- | :--- | :--- |
| `eccf-frontend` | Next.js 14 (App Router) site, Exco dashboard, server actions, API routes | Vercel (Hobby tier) |
| `eccf-backend` | Sanity Studio v3 + schema definitions | Studio at `https://eccf-backend.sanity.studio` |

- Sanity project **`ynnot4j0`**, dataset **`production`**, access mode **private**. Anonymous API access is denied **even for published content**; every read authenticates with `SANITY_READ_TOKEN` (see `lib/sanity.ts` — `useCdn: false` everywhere, no public CDN).
- Content types (`eccf-backend/schemaTypes`): `siteSettings`, `serviceSchedule`, `aboutPage`, `sermonVault`, `announcement`, **`meetingMinute`** (CSGB Read/Write + EXCO Read-Only when `isPostedToExcos == true`), `galleryItem`, `teamUnit`, `publicLeader`, `subscriber`, `qaChecklist`, the operational set `worker`, `attendanceLedger`, `financeLedger`, `welfareLedger`, `firstTimer`, `welfareRequest`, `prayerRequest`, the **`executiveAppointment`** reservation doc (`pending_claim` → `claimed`, `guidanceEmailSentAt` idempotency), plus **published reference tables** `hallResidence` (Halls of Residence) and `csgbRole` (CSGB offices) that intake forms and access checks read dynamically.
- Schema alignment across `dfff7fe` → `8cd342f`: `teamUnit` gained optional `meetingDay`/`meetingTime`/`meetingVenue`; `firstTimer` gained follow-up attribution (`followedUp`, `followedUpAt`, `followedBy`, `followUpNotes`); `worker` gained `welcomeEmailSent`, `profileImageUrl`, `isExcoApproved`, per-position `csgbRole`/`hallRef` references (`csgbTitle: csgbRole.title`, `hallName: hallRef.name`), `teamName` fallback, `submittedAt`, and string audit fields (`decidedBy`, `decidedById`, `decidedByRole`); `attendanceLedger` entries carry a denormalised `loggedByName`; `csgbRole` documents carry `canApproveExecutives`/`isExecutiveShepherd`; `executiveAppointment` documents carry `registrationStatus`, `claimedBy`/`claimedAt`, `importedBy*`/`decidedBy*`/`decidedAt` audit strings, and `invitationEmailSentAt`/`guidanceEmailSentAt` timestamps (all committed in backend `8cd342f`).

---

## 2. Stack Snapshot (`package.json`)

| Concern | Choice |
| :--- | :--- |
| Framework | Next.js `14.2.35` (App Router), React 18, TypeScript 5, `server-only` |
| Sanity | `@sanity/client` 7 + `@sanity/image-url` (headless client only — no embed) |
| Auth | `@clerk/nextjs` 5 (Google OAuth + emailed codes; **no passwords anywhere**) |
| Email | `resend` 6, sender resolved by `lib/email/from.ts` |
| UI | Tailwind 3.4 + Radix primitives + `class-variance-authority` + `components.json` (shadcn-style kit in `components/ui`) |
| State/data viz | React Hook Form + Zod 4, TanStack Table 8, sonner (toasts), framer-motion 12 |
| Media | `sharp` (photo compression), `xlsx` (exports), `xlsx.d.ts` shim |
| Tests | Playwright `1.64` (`tests/mobile-smoke.spec.ts`) + runtime QA portal at `/qa` |

Three Tailwind configs exist: `tailwind.config.ts` (public site palette), `tailwind.dashboard.config.ts` (dashboard design tokens), `tailwind.postcss.cjs`. Know which one you're touching.

---

## 3. Directory Map

```
eccf-frontend/
├─ middleware.ts                     # Clerk guard, legacy-route redirects, x-pathname/x-preview-mode headers
├─ app/
│  ├─ (public)/                      # /, /about, /sermons, /announcements, /connect, /give,
│  │                                 # /privacy, /terms, /register  (layout forces dynamic + maintenance gate)
│  ├─ (dashboard)/
│  │  ├─ dashboard/…                 # Role-scoped Exco sections (see §7)
│  │  ├─ login/[[…rest]]/page.tsx    # Clerk <SignIn> + "Activate Login" — URL is /login
│  │  └─ sign-up/[[…rest]]/page.tsx  # Clerk <SignUp> — URL is /sign-up
│  ├─ qa/                            # /qa runtime QA portal (6 suites / 61 checks; PIN, not Clerk)
│  ├─ actions/                       # ALL server actions — the only mutation surface (§8)
│  └─ api/                           # auth, preview, exit-preview, sync-sermons (cron),
│                                    # upload-drive (Drive bridge), webhooks/announcement
├─ components/
│  ├─ dashboard/…                    # overview/, shell/, pwa/, states/, ui/, minutes/,
│  │                                 # executives/, workers/, attendance/, finance/, welfare/,
│  │                                 # first-timers/, prayer/, announcements/, sermons/, settings/
│  ├─ forms/                         # WorkerRegistrationForm, Welfare/FirstTimer/Prayer, TurnstileWidget
│  ├─ about/ home/ sermons/ announcements/ connect/ layout/ common/ qa/
│  └─ ui/                            # shadcn-style primitives + tokens
├─ lib/
│  ├─ sanity.ts                      # the ONLY Sanity client configuration (4 clients, §6)
│  ├─ queries.ts                     # central GROQ (SITE_SETTINGS_QUERY, TEAMS_QUERY, GALLERY_QUERY, …)
│  ├─ encryption.ts                  # AES-256-GCM fields + HMAC blind indexes (§10)
│  ├─ csgb-roles.ts                  # dynamic CSGB offices from Sanity csgbRole + baseline fallback
│  ├─ halls.ts                       # dynamic Halls of Residence from Sanity hallResidence + Hall 1–8 fallback
│  ├─ executive-matching.ts          # honorific cleaning + tokenized name keys for appointment matching
│  ├─ executive-positions.ts         # signature-based position merge (no duplicate roles)
│  ├─ maintenance.ts, email/ (from.ts sender, layout.ts shared design system, executive-appointment.ts
│  │  appointment-guidance email), security/, teams.ts, sermonSync.ts, image-compression.ts
│  └─ dashboard/                     # access, auth, rbac (≈640-line matrix), action-result, queries, format,
│                                    # toast, dev-actions, shell.ts, attendance-constants + data/ and mock/
├─ scripts/                          # ops scripts — only tracked files; unchecked _*.mjs are gitignored
├─ tests/e2e/                        # Playwright suites (dashboard-shell, executives, settings, minutes, mobile-smoke)
└─ docs/                             # OPERATIONAL_MANUAL, this guide, TESTING_PLAN, privacy & crypto notes
```

Route-group subtlety: route groups don't affect URLs. `/login` is served by `app/(dashboard)/login/…` even though middleware **redirects `/dashboard/login` → `/login`** (and `/dashboard/sign-up` → `/sign-up`), each preserving query params; `app/not-found.tsx` soft-redirects unknown URLs to `/`.

---

## 4. Request Lifecycle

1. **`middleware.ts`** runs first for every request:
   - `clerkMiddleware` protects `/dashboard(.*)` (`auth().protect()`), skipped when `DASHBOARD_MOCK_AUTH=1` **and not production**.
   - Sets `x-pathname` on proxied headers so server components can evaluate **maintenance mode** without a client hop; sets `x-preview-mode` when `?preview=true` or preview cookies exist.
   - Legacy redirects: `/dashboard/login` → `/login` (preserving `callbackUrl`), `/dashboard/sign-up` → `/register`.
2. **`app/(public)/layout.tsx`** (`force-dynamic`): picks `getSanityClient(preview)`; when preview/draft is active it renders the draft content with a preview banner; otherwise it checks `isUnderMaintenance(pathname, settings.maintenancePages)` (Sanity **Site Settings → Maintenance Mode**, nested routes included) and renders `PageMaintenance` (noindex) instead of the page. PWA prompts are suppressed on public pages — installs happen only inside the dashboard.
3. Pages are **server-rendered per request** (`useCdn: false`, dynamic rendering); Sanity Studio edits appear on next load without a deploy. Keep new pages consistent with this (no `force-static`).

---

## 5. Auth & Session Model

- **Clerk is the only identity provider.** Google OAuth and emailed verification codes; no passwords. `NEXTAUTH_*` env vars are obsolete.
- The Clerk user ↔ worker-profile bridge lives in `lib/dashboard/auth.ts` (`getDashboardSession`): resolves the worker by `clerkUserId`; falls back to matching a **Clerk-verified email** and auto-patches `clerkUserId` onto the profile. Unverified-email fallbacks are not trusted. A matching Google account works the same way, so approved executives can sign in with Google directly.
- **Only executives get a dashboard session** (Oct 26 tightening): after the bridge resolves a profile, `deriveAccess()` runs and gates on the `isExecutive` capability. A worker whose memberships are all `Pending` gets `null` from `getSession()`, and `requireSession()`/`requireSection()` redirect to `/login?denied=approval_pending` — the login page renders the "approval pending" notice. Executive feeds like the logged-in registration status still work without a dashboard session.
- **Reserved appointments claim at registration:** `commitExecutiveImport` writes unmatched leaders as `executiveAppointment` docs (`pending_claim`). On registration (`worker-registration.ts`), `claimPendingExecutiveAppointmentsForWorker()` matches by email/normalised name, appends positions via `mergeExecutivePositions`, sets `worker.isExcoApproved`, and dispatches the one-time guidance email. `reconcileRegisteredExecutives()` (triggered from the import dialog) re-sweeps registered workers.
- "Activate Login" (`/login`, below the Clerk card) links an existing worker email to a fresh Clerk account.
- The session carries the derived `access` block (§6), the official working position (`excoPosition`), hall/team memberships, and `profileImageUrl` for the shell avatar.
- **Local mock auth:** `DASHBOARD_MOCK_AUTH=1` (ignored in production) creates a mock session from the `eccf-dev-role` cookie; `DASHBOARD_DATA_SOURCE=mock|sanity` swaps data (fixtures in `lib/dashboard/mock`); `DASHBOARD_MOCK_STATE=empty|error|slow` exercises loading states — plus the `/dashboard/dev/ui-states` gallery and `DevSwitcher` in the shell.

---

## 6. RBAC (source of truth: `lib/dashboard/access.ts` + `rbac.ts`)

- Permissions derive from **approved Sanity positions/memberships — never form-typed titles**: `deriveAccess()` produces `role` (`admin | team_lead | finance | hall_rep`) + flags `isPresident`, `isVP`, `isChaplain`, `isPrayerCoordinator`, `isCSGB`, `isFinance`, `isWelfare`, `isMedia`, `isOutreachLeader`, `isUsheringTeam`, and `isExecutive` + memberships. Positions may carry **`csgbRole` references** (dynamic Sanity offices) and **`hallRef` references** (Halls table) alongside legacy `hall`/`office` text.
- `rbac.ts` (~530 lines) is the single matrix, and `canAccessSection()` is now **session-aware**: `workers`, `firstTimers`, `welfare`, `prayerRequests`, and `settings` honour the derived session, not just the role list. Notable helpers: `isPrayerTeamAdmin`, `isWelfareTeamMember` (Welfare team ⇒ CSGB ⇒ Chaplain), `isOutreachLeader`, `isRegularTeamLeader`, `isHallScoped`, and `canDeleteWorkers`.
- Grants to know by heart:
  - `executives` — CSGB + the **Chaplain** (President/VP/Chaplain/admin pass; the import pipeline re-verifies President/VP/Chaplain/admin inside `executive-suggestion-actions.ts`).
  - `welfare` / requester-phone visibility — **Welfare & Medical team, CSGB, Chaplain** (identical set).
  - `prayerRequests` — `isPrayerTeamAdmin` only (hall reps and outreach leads are out).
  - `finance` — `admin`/`finance` **roles** plus legacy financial positions; a CSGB flag alone no longer grants it.
  - `settings` — `admin`, `isPresident`, `isCSGB`, or `canDeleteWorkers` (the Chaplain reaches it with delete-offboarding tools; import is gated separately by `canImport`).
  - `sermons` — media positions only; `announcements` — CSGB members; `meetingMinutes` — all EXCOs (`minutes:view`) for posted, non-archived records, with `minutes:manage` (write/drafts/organize/post/archive/delete) restricted exclusively to CSGB (`isCSGBMember`); `firstTimers` — admin/hall_rep, or outreach-leading team-lead.
- `PERMISSIONS` adds `minutes:view`, `minutes:manage`, and `workers:delete` (delegates to `canDeleteWorkers`) beside `attendance:create`, `finance:create`, `welfare:create`, `welfare:resolve`. `requirePermission()` re-checks server-side on every action.
- `SECTION_PATHS` maps sections to routes; UI adds `ROLE_LABELS` (admin→"CSGB Executive", team_lead→"Team Leader", hall_rep→"Hall Pastor") and `getLeaderPostTitle()` resolves the office from the approved position — including `csgbRole.title` ("President", "Hall Pastor (Hall 3)", "CSGB Executive" fallback); the cockpit greeting consumes it.
- CSGB offices and Halls are **dynamic data**: `lib/csgb-roles.ts` + `lib/halls.ts` cache-read `csgbRole`/`hallResidence` documents with published fallbacks (baseline office list; Halls 1–8). Changing them in the Studio changes labels, dropdowns, filters, and capabilities without a code change.

---

## 7. Dashboard Sections (`app/(dashboard)/dashboard`)

`overview` (Executive Cockpit: date eyebrow + greeting, `AttentionQueue` fed live by `getLiveAttentionItems()` in `lib/dashboard/data/overview.ts`, 4-metric pulse strip, 4-row activity lists), `executives` (Executive Council & Leadership Roster: read, bulk CSV/XLSX import with canonical position resolver, per-role `deleteExecutivePosition` transaction cleanup), `workers` (segmented `Directory`, `Approvals`, and `Email` tabs + `RecordSheet` profile drawer), `attendance` (headcount & team rosters + `RecordAttendanceSheet`), `finance` (ledger + Month filter + `RecordSheet`), `first-timers` (status tabs + follow-up sheet/attribution), `welfare` (Welfare Hub: Purse Ledger + Care Requests `Open case` confirmation sheet), `prayer-requests` (2-signal strip + `Open` drawer), `announcements` (desktop table + broadcast confirmation), **`minutes`** (Meeting Minutes archive: folders, types, action items, CSGB drafts vs posted read-only EXCO view), `sermons` (media leads, desktop table default), `settings` (CSV roster import / verified offboarding / directory sync), `dev/ui-states`.

Shell components in `components/dashboard/shell/`: `AppSidebar`, `TopBar`, `MobileNav` (includes `ThemeToggle` + `InstallPwaButton`), `BottomNav` (4 role-prioritised tabs + `All` sheet), `UserMenu` (`ThemeToggle` + `InstallPwaButton`), `DeniedToast`, and `InstallPwaButton` (`components/dashboard/pwa/`). Shared dashboard primitives live in `components/dashboard/ui/` (`PageHeader`, `KpiStrip`, `DataToolbar`, `StatusBadge`, `RecordSheet`, `ConfirmDialog`). PWA scope/start URL is `/dashboard`, manifest name "ECCF Exco Dashboard", with section shortcuts. Nav data lives in `shell/nav-items.ts` (sidebar order, filtered by `canAccessSection()` server-side).

---

## 8. Server Actions (`app/actions/`)

This is the **only** mutation surface — no client-side Sanity calls exist. Every action re-resolves the session server-side before writing, validates input, and returns the `action-result.ts` contract (`lib/dashboard/action-result.ts`); caller revalidation uses `revalidatePath`.

| File | Purpose |
| :--- | :--- |
| `worker-registration.ts` | 8-step intake: `checkWorkerPhoneAndInitiateVerification` (OTP + magic-link), email-ownership OTP for first-timers, profile refresh, submission; `sendWorkerWelcomeEmail()` helper (sent once on first membership verification, gated by `worker.welcomeEmailSent`) |
| `worker-actions.ts`, `worker-email-actions.ts` | Worker CRM — verification approvals, `toggleExcoApproval`, profile photo update (`updateDashboardProfilePhotoAction`), verified offboarding (`deleteApprovedWorkerAction`), CSV roster import (`importWorkerRosterCsvAction`) — plus workforce mail |
| `executive-suggestion-actions.ts` | Leadership spreadsheet import pipeline: `previewExecutiveSpreadsheet` (canonical `csgbRole`/`hallResidence`/`teamUnit` resolver + worker name matching) and `commitExecutiveImport` — batched writes with per-row retry, `claimed` appointments for matched workers, **reservations** (`pending_claim`) for unregistered leaders when "Include unregistered EXCOs" is on, one-time guidance email per leader (`guidanceEmailSentAt` guard); also `claimPendingExecutiveAppointmentsForWorker` / `reconcileRegisteredExecutives`; auth = President/VP/Chaplain/admin |
| `executive-actions.ts` | `decideExecutivePosition`, `deleteExecutivePosition` (removes a worker role + linked `executiveAppointment` placeholders in one Sanity transaction so deleted roles cannot auto-reclaim; wired into `ExecutivesClient`), `relieveExecutivePosition` (`@deprecated` wrapper delegating to `deleteExecutivePosition`), and `updateExecutiveRank` |
| `first-timer-actions.ts` | Follow-up toggle + remarks (`toggleFirstTimerFollowUpAction`), leader attribution & timestamps |
| `welfare-ledger-actions.ts` | Welfare Purse Ledger entries — record (`recordWelfareLedgerEntry`) / delete, with running balance |
| `finance-actions.ts`, `attendance-actions.ts` | Ledgers & rosters (operational drafts); attendance rows carry denormalised `loggedByName` |
| `announcement-actions.ts`, `announcement-broadcast-actions.ts` | Publishing + Resend broadcasts to subscribers |
| `meeting-minutes-actions.ts` | CSGB-only create, update, `toggleMeetingMinuteVisibility` (`isPostedToExcos`), pin, archive, action-item toggle, and delete |
| `intake-actions.ts` | First-timer / welfare / prayer forms (Turnstile + NDPR consent) |
| `sermon-management-actions.ts`, `sermon-sync-actions.ts` | Sermon Vault sync |
| `subscriber-actions.ts`, `qa-actions.ts` | Newsletter subs; QA portal progress (PIN-hashed in `qaChecklist`) |

**Security stack on intake forms:** Cloudflare Turnstile (`lib/security/turnstile.ts` verifies tokens server-side, single-use, **fails closed in production when keys are missing**; returns true only outside production when unset) + `lib/encryption.ts` field encryption for phone/room + NDPR consent for worker intake. Worker registration presents Turnstile **once at step 1** (`components/forms/WorkerRegistrationForm.tsx`); the verified state persists across steps and the recovery path; Clerk-signed-in users skip it. First-time email verification OTP: 6 digits, 10-minute expiry, 60 s resend cooldown (≤5 attempts).

---

## 9. Email

`lib/email/from.ts` → `resolveResendFrom()`: `RESEND_FROM_EMAIL` → `EMAIL_FROM` → development fallback `onboarding@resend.dev`. A configured bare domain (`example.org`) is auto-corrected to `team@example.org` with a logged warning; the fallback only delivers to the Resend account owner, so production requires a verified Resend domain. In production, rejected sends surface the real error to the user instead of silently simulating.

All dashboard/worker mail renders through the shared design system **`lib/email/layout.ts`** (eyebrow + title + card body composition; hosted assets/links resolve `NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_APP_URL` → the production default). The official worker welcome email (`sendWorkerWelcomeEmail`, defined in `worker-registration.ts`) is dispatched by first membership verification in `worker-actions.ts` and is send-once via the `welcomeEmailSent` profile flag. The appointment-guidance email (`lib/email/executive-appointment.ts` → `sendExecutiveAppointmentEmail`) likewise fires once per leader — guarded by `executiveAppointment.guidanceEmailSentAt` so re-imports never duplicate it.

---

## 10. Data Layer Rules

1. **Four Sanity clients in `lib/sanity.ts` only:**
   - `sanityClient` — public pages, token-authenticated, `perspective: 'published'`.
   - `sanityPreviewClient` — draft mode/Studio preview, `perspective: 'drafts'`.
   - `sanityWriteClient` — mutations, **server actions only**.
   - `sanityPrivateClient` — dashboard/operational views with drafts visibility.
2. **Private-dataset mindset:** unauthenticated queries return nothing at all. "Publishing" still matters — public pages see only published docs, so operational records must never be published. Keep `worker`, `attendanceLedger`, `financeLedger`, `welfareLedger`, `firstTimer`, `welfareRequest`, `prayerRequest` as unpublished drafts (`createPrivateDocument`, `patchPrivateDocument`). The only deliberate exceptions are the published **reference tables** `hallResidence` and `csgbRole`, consumed by `lib/halls.ts` / `lib/csgb-roles.ts`.
3. **Encryption before storage** (`lib/encryption.ts`): `encrypt()`/`decrypt()` (AES-256-GCM, `enc:v1:` prefix) for phone & room; `createBlindIndex()`/`getCandidateBlindIndexes()` (`bidx:v1:`) for phone lookup/dedup; birthday blind indexes for the same. Verify health with `npm run check:encryption` after any key work. `ENCRYPTION_KEY`/`HMAC_PEPPER` must match local↔production; rotations go through `ENCRYPTION_LEGACY_KEYS`/`HMAC_LEGACY_PEPPERS` first.
4. **GROQ lives centrally** in `lib/queries.ts`. Notables: `SITE_SETTINGS_QUERY` carries `maintenancePages/…Eta` + `socialBanner*`; `GALLERY_QUERY` returns only `featured == true` items ordered by `displayOrder`; `TEAMS_QUERY`/`EXCOS_QUERY` omit lead fields (leaders come from `publicLeader`/positions).
5. **Photo pipeline:** client-side compression (`lib/image-compression.ts`) → Sanity upload (≤2 MB stored) → optional Drive backup via `/api/upload-drive` (HMAC-verified Apps Script bridge; files named `FullName_Teams`, `Workforce` fallback; sync failures are logged, not fatal).
6. Sermon sync: `lib/sermonSync.ts` + vercel cron `0 6 * * *` → `/api/sync-sermons` (`CRON_SECRET`), plus announcement webhook (`SANITY_WEBHOOK_SECRET`).

---

## 11. Conventions & Ground Rules

- `server-only` on every module holding tokens or secrets; **never** prefix a secret with `NEXT_PUBLIC_`.
- Mutations only in Server Actions/API routes with the write client. Components stay presentational/anemic; heavy logic lives in `lib/`.
- Design tokens over hardcoded colours (`bg-card`, `text-muted-foreground`, tone chips like `bg-success/10`). Two known hardcoded-hex offenders remain (see §13) — don't add more.
- Toasts via sonner (`lib/dashboard/toast.ts`); forbidden-section UX is the `DeniedToast` pattern, not silent hiding.
- No `TODO/FIXME` markers live in the sources (grep-verified); open work is tracked in docs (§13) — keep it that way.
- Commit style: conventional-ish prefixes, `feat|fix|docs(chore)(scope): short summary`, direct to `main`.
- **If code changes invalidate `docs/OPERATIONAL_MANUAL.md`, update the manual in the same change.**

---

## 12. Local Dev & Verification

```bash
npm install
cp .env.example .env.local      # fill tokens (see below); NEVER commit .env.local
npm run dev                     # http://localhost:3000, mock dashboard enabled by default

# Type & lint gates
npx tsc --noEmit                # full type-check (not an npm script)
npm run lint

# Ops scripts
npm run check:encryption        # zero unreadable encrypted fields required
node scripts/verify-unauthenticated.mjs   # must FAIL (private dataset rejects anon reads)
# …plus test-decryption.mjs, encrypt-existing-data.mjs,
#  migrate-operational-records-to-drafts.mjs, remove-legacy-worker-fields.mjs

# E2E
npx playwright install          # first run
npx playwright test             # tests/mobile-smoke.spec.ts → test-results/
```

Manual test suites: `/qa` (public, noindex — six suites / 61 checks, 4-digit PIN) and `docs/TESTING_PLAN.md` (updated for Clerk passwordless auth, `/login`, and AES-256-GCM + HMAC-SHA256 field encryption).

**Env essentials** (full table: `docs/OPERATIONAL_MANUAL.md` §12.1): `SANITY_READ_TOKEN` (**required for every read** — private dataset), `SANITY_WRITE_TOKEN`, `ENCRYPTION_KEY` + `HMAC_PEPPER`, Clerk keys (note `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register`), `RESEND_API_KEY` + `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`, `CRON_SECRET`, `SANITY_WEBHOOK_SECRET`, `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` + `…_SECRET`, sermon RSS URLs.
Secret-handling and operational data privacy guidance lives in `docs/operational-data-privacy.md` (referenced by `.env.example`).

---

## 13. Modernization Wave & Current Baseline

**Landed in the Oct 29 – Nov 25 waves (after `8cef8e9` → `7be32ec`, backend `8cd342f` + `meetingMinute`):**

- **Backend schema alignment (`8cd342f` + `meetingMinute`):** Committed `executiveAppointment` schema fields (`registrationStatus`, `claimedBy`/`claimedAt`, `importedBy*`/`decidedBy*`/`decidedAt` string audit fields, `invitationEmailSentAt`, `guidanceEmailSentAt`), `worker` updates (`isExcoApproved`, position `submittedAt`/`teamName`, string `decidedBy*` audit fields), and the new `meetingMinute` document schema (`isPostedToExcos`, folders, attendees/absentees, agenda, decisions, action items, pin/archive).
- **Executive role deletion & matching (`8e5fd8a`, `fd3c561`, `d8461e3`):** Replaced the old Relieve workflow with `deleteExecutivePosition` in `app/actions/executive-actions.ts` and `ExecutivesClient.tsx`, deleting linked `executiveAppointment` placeholders in the same Sanity transaction so deleted roles cannot auto-reclaim (`relieveExecutivePosition` kept only as a `@deprecated` wrapper). Short-name vs full-name appointment matching and position titles landed alongside worker approval persistence.
- **Cross-tab `navigationAttention` badges (`8e5fd8a`, `7be32ec`):** `getNavigationAttention()` computes role- and scope-filtered pending counts (`executives`, `workers`, `firstTimers`, `welfare`, `prayerRequests`, `announcements`, and `overview`), rendered across `AppSidebar`, `NavLinks`, `MobileNav`, `TopBar`, and `BottomNav`.
- **Dashboard UI Modernization Wave:** Adopted tokenized semantic design system (`PageHeader`, `KpiStrip`, `DataToolbar`, `StatusBadge`, `RecordSheet`, `ConfirmDialog`), reserved Belleza strictly for `<h1>` titles (`Work Sans` `tabular-nums` for figures/currency), unified responsive `>= 44px` mobile / `>= 40px` desktop targets, added `ThemeToggle` + `InstallPwaButton` into `MobileNav`/`BottomNav`/`UserMenu`, cleaned legacy midnight hexes on `/login`/`/sign-up`, upgraded skeletons/states (`AccessDeniedState`, `EmptyState`, `ErrorState`, `StatCardSkeleton`), and verified WCAG 2.2 AA accessibility gates.
- **Meeting Minutes Module (`/dashboard/minutes`):** Added CSGB Read/Write secretariat authoring & folder organization (`app/actions/meeting-minutes-actions.ts`, `components/dashboard/minutes/`) paired with strict server- and UI-enforced EXCO Read-Only visibility (`isPostedToExcos == true && archived != true`).

**Low-priority compatibility exports retained:**
- `app/actions/executive-actions.ts` retains `relieveExecutivePosition` (`@deprecated` wrapper delegating to `deleteExecutivePosition`) and `updateExecutiveRank` for backward compatibility.

---

*Prepared against the code as committed; where this guide and the code disagree, the code wins — then update this file with the same change.*
