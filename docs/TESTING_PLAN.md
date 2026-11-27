# ECCF Website & Platform — Developer Functional Testing Plan

> **Version:** 1.1 (Production Candidate)  
> **Target Environment:** Local Dev (`http://localhost:3000`) & Staging / Production  
> **Stack:** Next.js 14 App Router, Sanity Studio v3, Clerk (`@clerk/nextjs`), Tailwind CSS, Resend, Google Drive Apps Script Bridge  
> **Security Baseline:** Clerk Passwordless Auth (Google OAuth + Emailed OTP) + AES-256-GCM Field-Level Encryption + HMAC-SHA256 Blind Indexing + Cloudflare Turnstile  

---

## How to Use This Testing Plan
- Execute each test case in sequence or by module.
- Check the box `[x]` upon verifying expected behavior.
- Document any regressions or unexpected edge cases in the **Findings & Notes** section at the bottom.
- Ensure testing covers both **Desktop** (Chrome/Firefox/Edge) and **Mobile** (iOS Safari / Android Chrome) viewports.

---

## 1. Public Facing Website (`(public)`)

### 1.1 Global Layout, Header & Navigation
- [ ] **Desktop Navigation Bar**
  - [ ] Logo displays clearly and routes back to `/` when clicked.
  - [ ] Primary links (`Sermons`, `Giving`, `About`, `Updates`, `Connect`, plus primary CTA `Plan a Visit`) display cleanly and route to `/sermons`, `/#giving`, `/about`, `/announcements`, `/connect`, and `/#visit`.
  - [ ] Active route indicator correctly highlights the current page (including `Updates` when on `/announcements`).
  - [ ] Worker registration link (`/register`) is **not** present in the public header menu (per security mandate).
- [ ] **Mobile Navigation Drawer**
  - [ ] Hamburger menu button toggles drawer smoothly with animation.
  - [ ] Clicking backdrop or pressing `Esc` closes the drawer.
  - [ ] Selecting any link navigates and closes the drawer.
- [ ] **Global Footer**
  - [ ] Fellowship service schedule & location information displays correctly.
  - [ ] Social media links open corresponding ECCF profiles in new tabs (`target="_blank" rel="noopener noreferrer"`).
  - [ ] Quick links navigate to correct pages.
  - [ ] Copyright notice reflects the current year.

---

### 1.2 Home Page (`/`)
- [ ] **Hero Section**
  - [ ] Headline renders dynamic content from Sanity `siteSettings.heroHeadline` (fallback gracefully if unset).
  - [ ] Primary CTA ("Connect with Us" / "Plan Your Visit") scrolls smoothly or routes to `/connect`.
  - [ ] Secondary CTA ("Listen to Sermons" / "Learn More") routes appropriately.
- [ ] **Interactive Weekly Services Showcase**
  - [ ] Displays all scheduled fellowship meetings (e.g., Sunday Service, Bible Study, Prayer Revival).
  - [ ] Tab switching is smooth and spans the intended width of the section.
  - [ ] Auto-advance timer (every 3 seconds) transitions between tabs continuously.
  - [ ] Interacting manually (clicking/hovering) pauses or respects user interaction.
- [ ] **Pillars & Feature Cards**
  - [ ] Discipleship, Academic Excellence, and Fellowship pillars render without layout shifts.
- [ ] **Announcements Banner / Carousel**
  - [ ] Shows latest published & pinned announcements fetched from Sanity.
  - [ ] Clicking an announcement routes to its detail page.

---

### 1.3 About Page (`/about`)
- [ ] **Mission, Vision & Creed**
  - [ ] "Raising Spiritual Dynamites & Academic Giants" creed renders with correct typography (no unwanted serif accent fonts).
  - [ ] History & About narrative blocks render accurately.
- [ ] **Leadership Cards**
  - [ ] Cards display clean headshots and leader names only.
  - [ ] Verified that cluttered elements (top "Team Lead" oval badges, blue "Discipleship..." subtitle text, and bottom team labels) have been removed.
  - [ ] Images load responsively with fallback avatars if a headshot is not provided.

---

### 1.4 Sermons Vault (`/sermons`) & Sermon Detail (`/sermons/[slug]`)
- [ ] **Hero Copy & Layout**
  - [ ] Short hero subtitle renders directly below *"Listen & Watch Inspired Teachings"*, and changes saved in Sanity Studio (`Homepage & Site Settings → Sermons Page`) appear on refresh.
- [ ] **AI Message Finder (Inline & Floating `<dialog>` Modal)**
  - [ ] Typing into the inline search input does **not** reshuffle the starter prompt chips or alter card height.
  - [ ] Submitting a spiritual/life query returns matched sermons with transcript excerpts and non-`0:00` timestamps when transcript segments exist (or `Play full message` / `Play message` when `startSeconds === 0`).
  - [ ] Crisis queries trigger the care & support banner (`Emergency: 112`, ECCF contact links).
  - [ ] Clicking **Browse all sermons** returns to exact-word catalog search; scrolling past the inline card reveals the floating **AI Search** button, and pressing `Esc` closes the `<dialog>` modal.
- [ ] **Catalog Search & Paginated Topic Filtering**
  - [ ] Search input filters sermons by title, preacher, series, topic, or scripture reference.
  - [ ] Duplicate topic casings (e.g. `Academics` and `academics`) collapse into a single pill, and the toolbar shows `All` plus at most 5 topics per page (max 6 topic pills at once) with `< 1/N >` pagination controls when more than 5 topics exist.
- [ ] **Media Playback & Deep Links**
  - [ ] Clicking an AI suggestion opens `/sermons/[slug]?t=<seconds>&autoplay=1`, passing `start=<seconds>` and `autoplay=1` to the YouTube `youtube-nocookie.com` embed.
  - [ ] Spotify episodes hosted on `creators.spotify.com` / `podcasters.spotify.com` / `anchor.fm` render via `creators.spotify.com/pod/profile/<show>/embed/episodes/<slug>`, while standard 22-char `open.spotify.com` IDs render via `open.spotify.com/embed/episode/<id>` (never *Page not available*).

---

### 1.5 Announcements Hub (`/announcements`)
- [ ] **Listing & Detail**
  - [ ] Pinned announcements appear prominently at the top.
  - [ ] Published announcements list displays event dates and publication dates properly.
  - [ ] Draft / unpublished announcements do **not** appear on the public page.
  - [ ] Individual announcement detail page (`/announcements/[slug]`) loads rich text content, dates, and media.
- [ ] **Newsletter Subscription Form**
  - [ ] Email input validates RFC-5322 format.
  - [ ] Submitting valid email writes subscriber to Sanity with `isSubscribed: true`.
  - [ ] Submitting an already subscribed email displays a friendly "Already subscribed" notification.

---

### 1.6 Giving Page (`/give`)
- [ ] **Account Information & Category Cards**
  - [ ] Verified church bank details (Bank Name, Account Name, Account Number) render clearly.
  - [ ] "Copy Account Number" button copies digits to clipboard and triggers a toast notification ("Copied!").
  - [ ] Distinct cards for Tithe, Offering, Welfare, and Projects render instructions for payment narrations.

---

## 2. Public Intake Forms & Security (`components/forms`)

### 2.1 Connect / First-Timer Form (`/connect`)
- [ ] **Validation & Submission**
  - [ ] Required fields (`fullName`, `phoneNumber`, `hall`, `status`) enforce validation.
  - [ ] Phone number normalizes leading `0`, `+234`, and spaces properly.
  - [ ] Submission triggers loading state on button ("Submitting...").
  - [ ] Success card renders with a warm confirmation message and next steps.
- [ ] **Encryption & Storage Verification**
  - [ ] Submitted record creates a `firstTimer` document in Sanity as an unpublished draft.
  - [ ] Sensitive fields (`phoneNumber`) are stored as AES-256-GCM ciphertexts (`enc:v1:...`).
  - [ ] Searchable blind index `phoneBlindIndex` is generated as HMAC-SHA256 (`bidx:v1:...`).
  - [ ] Document does **not** store raw unencrypted phone numbers.

### 2.2 Prayer Request & Welfare Intake Forms
- [ ] **Prayer Request Submission**
  - [ ] Optional anonymity checkbox toggles name/phone requirement.
  - [ ] Request successfully registers as `prayerRequest` in Sanity with status `pending`.
- [ ] **Welfare Form Submission**
  - [ ] Hall and room number capture appropriately.
  - [ ] Emergency assistance indicator flags high-priority entries.

---

### 2.3 Worker Registration Form (`/register`)
- [ ] **Page Isolation & Accessibility**
  - [ ] Route is accessible directly via direct link (e.g. shared in official WhatsApp groups).
  - [ ] Page header is clean (no duplicate titles, no emoji clutter).
- [ ] **Form Validation Steps**
  - [ ] Name fields: `firstName`, `middleName` (optional), `lastName`.
  - [ ] Email & Ownership OTP: strictly validates email format and verifies email ownership via a 6-digit emailed OTP code (10-minute expiry, 60 s resend cooldown, ≤5 attempts) unless already signed in with Clerk.
  - [ ] Phone Number & Turnstile: validated and checked against Sanity blind indexes (`bidx:v1:...`); Cloudflare Turnstile runs once at Step 1 (skipped when signed in with Clerk).
  - [ ] Hostel & Room: Hall dropdown lists campus hostels from `hallResidence` (with `Hall 1`–`Hall 8` fallback) + room number.
  - [ ] Department / Teams: Multi-select allows primary and secondary unit selections.
  - [ ] Birthday: Formatted strictly as `MM-DD` (no birth year requested for privacy).
  - [ ] Exco Designation: Option to specify requested Exco role (`Admin` / CSGB, `Team Lead`, `Hall Rep`, `Finance`).
  - [ ] Passwordless Onboarding: **No password field** is presented anywhere in registration; authentication uses Clerk passwordless auth (Google OAuth or emailed OTP codes).
- [ ] **Passport / Headshot Image Handling**
  - [ ] Uploading high-res image triggers client-side compression (`compressImage`) and Sanity asset upload (≤2 MB stored).
  - [ ] Optional Google Drive backup runs via `/api/upload-drive` (Apps Script HMAC bridge; non-fatal if unavailable).
  - [ ] File type restriction prevents non-image uploads (rejects PDFs, EXEs).
- [ ] **Duplicate Prevention & Security Storage**
  - [ ] Attempting to register with an existing phone number triggers the returning-worker verification flow (emailed OTP/magic-link or Clerk-authenticated profile refresh) rather than creating a duplicate record.
  - [ ] Record created in Sanity as an unpublished draft (`drafts.<id>`) with `verificationStatus: "pending"` and `isExcoApproved: false` (unless claiming a reserved `executiveAppointment`).
  - [ ] Field-Level Encryption & Blind Indexing: Sensitive fields (`phoneNumber`, `roomNumber`) are encrypted with AES-256-GCM (`enc:v1:...`) and searchable lookup indexes (`phoneBlindIndex`, `birthdayBlindIndex`) are stored as HMAC-SHA256 (`bidx:v1:...`); no passwords or plaintext PII are stored.

---

## 3. Exco Portal Authentication & PWA (`/login`)

### 3.1 Clerk Passwordless Authentication & Approval Gate
- [ ] **Valid Sign-in (Google OAuth or Emailed OTP)**
  - [ ] Exco signs in at `/login` via Clerk (`Google OAuth` or emailed verification OTP code — **no passwords**).
  - [ ] System resolves the worker record in Sanity by `clerkUserId` or Clerk-verified email (auto-patching `clerkUserId` onto the worker profile on first verified email match) and derives RBAC `access`.
  - [ ] Approved executive is redirected to `/dashboard`.
- [ ] **Unverified / Unlinked Accounts**
  - [ ] Unverified Clerk emails are never auto-linked to worker profiles.
  - [ ] Registered workers having trouble accessing their account with Google can expand **"Trouble accessing your account with Google?"** on `/login` and submit their registered email via **Sync Account Access**.
- [ ] **Unapproved / Non-Executive Gate**
  - [ ] Signed-in Clerk user without an approved executive appointment (`isExecutive === false`), or an archived/rejected worker, is denied a dashboard session and redirected to `/login?denied=approval_pending`, displaying the *"Executive Approval Required"* notice.

### 3.2 Session & Route Protection (Middleware)
- [ ] Unauthenticated visitor navigating to `/dashboard/*` is protected by `clerkMiddleware` (`auth().protect()`) and redirected to `/login` (unless `DASHBOARD_MOCK_AUTH=1` in non-production local dev).
- [ ] Legacy routes `/dashboard/login` and `/dashboard/sign-up` redirect to `/login` and `/sign-up` respectively while preserving query parameters.
- [ ] Session persists across browser refreshes and tab closures.
- [ ] Clicking **Sign Out** in the user profile menu clears the Clerk session and redirects to `/login`.

### 3.3 Progressive Web App (PWA) Functionality
- [ ] **Manifest & Service Worker**
  - [ ] `/manifest.json` responds with `200 OK` and valid JSON structure.
  - [ ] Icons (192x192, 512x512) load without 404s.
  - [ ] Standalone display mode functions properly (hides browser URL bar on mobile).
- [ ] **Install Prompt Banner**
  - [ ] On supported mobile browsers, the PWA installation banner/prompt appears inside the dashboard.
  - [ ] Installing places the ECCF Portal icon on the device home screen.
- [ ] **Offline Handling**
  - [ ] Disconnecting network displays an offline fallback state rather than browser generic error.

---

## 4. Role-Based Access Control (RBAC) Verification

Verify each role logs in and sees **only** their permitted sections in navigation and page views:

| Section | CSGB Admin (`admin`) | Team Leader (`team_lead`) | Hall Rep (`hall_rep`) | Finance Secretary (`finance`) |
| :--- | :---: | :---: | :---: | :---: |
| **Overview** (`/dashboard`) | Full Metrics | People / Units | Hall Metrics | Financial Metrics |
| **Workers Roster** (`/dashboard/workers`) | All Workers (Approve/Decline) | All Workers (Read) | Own Hall Only | Restricted (403) |
| **First-Timers** (`/dashboard/first-timers`) | All Visitors | Outreach Lead Only | Own Hall Only | Restricted (403) |
| **Attendance** (`/dashboard/attendance`) | Full Access | Submit & View Team | Submit & View Hall | Restricted (403) |
| **Finance Ledger** (`/dashboard/finance`) | Full Access | Restricted (403) | Restricted (403) | Full Access |
| **Welfare** (`/dashboard/welfare`) | Global | Welfare Team Only | Restricted (403) | Restricted (403) |
| **Prayer Requests** (`/dashboard/prayer-requests`) | Global | Prayer Team Only | Restricted (403) | Restricted (403) |
| **Announcements** (`/dashboard/announcements`) | Full Access | CSGB Positions Only | Restricted (403) | Restricted (403) |
| **Meeting Minutes** (`/dashboard/minutes`) | Full Read/Write + Drafts | Read-Only (Posted Only) | Read-Only (Posted Only) | Read-Only (Posted Only) |
| **Sermons** (`/dashboard/sermons`) | Media Position Only | Media Team Only | Restricted (403) | Restricted (403) |
| **Settings** (`/dashboard/settings`) | Full Admin Tools | Restricted (Redirect) | Restricted (Redirect) | Restricted (Redirect) |

### 4.1 CSGB Admin Testing
- [ ] Admin navigation sidebar displays all permitted modules (plus pinned Settings for President/VP Admin/authorized approvers).
- [ ] Directly accessing any `/dashboard/*` route succeeds with status 200.
- [ ] Strictly 5 board positions (`President`, two `Vice Presidents`, `General Secretary`, `Prayer Coordinator`) carry CSGB scope; **Assistant Prayer Coordinator** or assistant CSGB roles are scoped to Prayer Team rather than full CSGB access.
- [ ] Full create, update, and resolve permissions active.

### 4.2 Outreach Team Leader Testing
- [ ] Log in with a worker account having `role: "team_lead"` and team containing `"Outreach"` or `"Follow"`.
- [ ] **First-Timers & Connect Intake** (`/dashboard/first-timers`) appears in sidebar.
- [ ] Page header shows *"Outreach & Follow-Up Portal"*.
- [ ] Can view all connect form submissions across campus for pastoral follow-up.
- [ ] Attempting to access `/dashboard/finance` directly redirects or displays restricted access feedback.

### 4.3 Hall Representative Testing
- [ ] Log in with a worker account having `role: "hall_rep"` and assigned `hall: "Hall 2"`.
- [ ] **Workers Roster** (`/dashboard/workers`): Only displays workers residing in "Hall 2". Workers from other hostels are hidden.
- [ ] **First-Timers** (`/dashboard/first-timers`): Only displays visitors who selected "Hall 2" in their connect form.
- [ ] Page header shows *"Hall 2 First-Timers"*.
- [ ] Attempting to access `/dashboard/finance` or `/dashboard/announcements` is blocked.

### 4.4 Finance Secretary Testing
- [ ] Log in with a worker account having `role: "finance"`.
- [ ] Navigation sidebar displays only **Overview** and **Finance Ledger**.
- [ ] Sensitive people rosters (`workers`, `first-timers`, `welfare`, `prayer-requests`) are hidden and restricted.
- [ ] Can view income/expense ledgers and record financial entries.

---

## 5. Dashboard Operational Modules

### 5.1 Workers Management (`/dashboard/workers`)
- [ ] **Roster Display & Decryption**
  - [ ] Worker cards/table decrypt and display `phoneNumber`, `roomNumber`, and `birthDate` correctly.
  - [ ] No `[Encrypted Data]` or raw `enc:v1:...` strings leak in the UI.
- [ ] **Verification & Approval Workflow (Admin)**
  - [ ] Pending worker displays **Approve** and **Decline** action buttons.
  - [ ] Clicking **Approve** updates Sanity document to `verificationStatus: "verified"` and `isExcoApproved: true` (when executive positions are approved).
  - [ ] Clicking **Decline** updates status to `verificationStatus: "rejected"`.
  - [ ] Roster table updates optimistically or revalidates immediately.
- [ ] **Birthday Calendar / Filter**
  - [ ] Upcoming birthdays for the current week/month filter accurately based on `birthdayBlindIndex` / decrypted MM-DD.

### 5.2 First-Timers & Connect Portal (`/dashboard/first-timers`)
- [ ] **Intake Grid & Follow-Up Actions**
  - [ ] Shows visitor name, phone number, hostel, date visited, and prayer requests.
  - [ ] "Call" button launches native device dialer (`tel:08168730661`).
  - [ ] "WhatsApp" button opens direct chat with pre-filled greeting (`https://wa.me/2348168730661?text=...`).
  - [ ] Follow-up status / toggle persists updates to Sanity.

### 5.3 Attendance Ledger (`/dashboard/attendance`)
- [ ] **Record Intake (`RecordAttendanceSheet`)**
  - [ ] General Headcount collects Service Date (Lagos quick chips), Service Type, optional Meeting/Programme Title, and Total Count (`+10`/`+50`/`+100` helpers).
  - [ ] Detailed breakdown records Students (`menCount` / `womenCount`), **University Staff** (`staffCount` / `staffMenCount` / `staffWomenCount`), Children, and optional **First-Timers** count (`firstTimersCount`, not added to total headcount).
  - [ ] Team Rosters view logs team attendees + guest count for scoped teams.
  - [ ] Successful submission creates an `attendanceLedger` draft document in Sanity with `loggedByName` and refreshes recent attendance metrics.

### 5.4 Finance Ledger (`/dashboard/finance`)
- [ ] **Transaction Entry**
  - [ ] Form collects: Transaction Type (`Income` vs `Expense`), Category (Tithe, Sunday Offering, Honorarium, Equipment, Welfare, Logistics), Amount in Naira (₦), Date, and Notes.
  - [ ] Amount input formats with thousand separators (`₦ 150,000`).
  - [ ] Submitting updates `financeLedger` and refreshes total balance and monthly income/expense metrics.

### 5.5 Welfare & Pastoral Care (`/dashboard/welfare`)
- [ ] Welfare request cards display student distress level (Urgent, Moderate, Standard).
- [ ] "Mark as Resolved" action updates record status and logs resolver identity.

### 5.6 Announcements & Broadcast Management (`/dashboard/announcements`)
- [ ] **Creation & Publishing**
  - [ ] Admin creates announcement with Title, Event Date, Body, and Pin toggle.
  - [ ] Publishing triggers optional email broadcast to verified subscribers via Resend API (`<ConfirmDialog>` naming title and active subscriber count).
  - [ ] Announcement updates live on the public `/announcements` page immediately via Next.js on-demand ISR revalidation.

### 5.7 Meeting Minutes & Secretariat Archive (`/dashboard/minutes`)
- [ ] **CSGB Read & Write Workflow (`admin` / CSGB member)**
  - [ ] Page displays `CSGB Read & Write` badge and `"New minute"` CTA.
  - [ ] Writing a minute saves as `CSGB Draft` (`isPostedToExcos: false`) by default; draft appears under `CSGB Drafts` / `All` tabs.
  - [ ] Organization controls filter accurately by **Folder / Session** pills, **Meeting Type** (`CSGB`, `General EXCO`, `Emergency`, `Retreat & Planning`, `Committee`), **Visibility Status**, and search keywords.
  - [ ] **Post to EXCOs** toggles visibility (`Posted to EXCOs`); pinning moves the minute to the top; toggling action items updates completion progress; archiving/deleting requires confirmation and persists.
- [ ] **EXCO Read-Only Visibility (`team_lead`, `hall_rep`, `finance`)**
  - [ ] Page displays `EXCO Read-Only` badge and hides `"New minute"`, `"CSGB Drafts"` tab, edit/post/pin/archive/delete controls, and internal draft records.
  - [ ] Only non-archived minutes with `isPostedToExcos: true` appear in UI and server responses; clicking **Open** opens the read-only detail sheet with Markdown copy & Print.
  - [ ] Calling any mutation action (`createMeetingMinute`, `updateMeetingMinute`, `deleteMeetingMinute`, etc.) as a non-CSGB EXCO fails with an authorization error.

### 5.8 Sermons, Transcripts & AI Search Desk (`/dashboard/sermons`)
- [ ] Media Team users see **Sermons**, **Transcripts**, and **AI Search** tabs; non-Media admins without a Media position are denied access.
- [ ] Unavailable sermon captions display a disabled CC icon badge (`CaptionsOff`) with accessible screen-reader text instead of raw placeholder text.
- [ ] **Transcripts** tab lists `Ready`, `Waiting`, and `Unavailable` KPI counts and **Check for captions now** indexes YouTube captions into `sermonSegment` documents.
- [ ] **AI Search** tab manages public prompts/limits, **Encrypted Key Override** (write-only `password` input stored in `drafts.aiSearchSecret`), and **Saved Searches Cache** clearing.
- [ ] Automated suite `npx playwright test tests/e2e/sermon-ai-search.spec.ts --workers=1` passes on mobile (`390x844`) and desktop (`1440x900`) viewports without horizontal overflow.

---

## 6. Integrations & Background Services

### 6.1 Google Drive Apps Script Bridge (`/api/upload-drive`)
- [ ] Submitting large worker headshots triggers Apps Script web app endpoint.
- [ ] Verifies script returns valid public Google Drive thumbnail/view link.
- [ ] Link persists properly on the worker document `headshotDriveUrl` field.

### 6.2 Sermon Sync Service (`/api/sync-sermons`)
- [ ] Triggering manual sync from dashboard validates secret bearer token.
- [ ] Scans designated RSS / YouTube / Spotify feeds, extracts metadata, and upserts `sermonVault` records.
- [ ] Avoids creating duplicate sermon entries for identical source IDs.

### 6.3 Email Delivery Service (Resend)
- [ ] Triggering announcement broadcast sends emails via Resend.
- [ ] Email arrives with correct ECCF branding, sender address, and functional unsubscribe link.
- [ ] API errors (e.g. rate limit, bad API key) are caught gracefully without crashing the UI.

---

## 7. Performance, Accessibility & Cross-Browser Testing

### 7.1 Performance & Core Web Vitals
- [ ] **Lighthouse Performance Score** ≥ 85 on desktop and mobile.
- [ ] **Largest Contentful Paint (LCP)** ≤ 2.5s on 4G network emulation.
- [ ] **Cumulative Layout Shift (CLS)** ≤ 0.1 (no jarring shifts as fonts/images load).
- [ ] Images utilize Next.js `next/image` with WebP/AVIF compression and defined aspect ratios.

### 7.2 Cross-Browser & Device Compatibility
- [ ] **Desktop Browsers**: Google Chrome, Mozilla Firefox, Microsoft Edge, Safari (macOS).
- [ ] **Mobile Devices**: Android Chrome (Pixel/Samsung), iOS Safari (iPhone).
- [ ] Viewport responsiveness verified at:
  - [ ] Mobile: 375px (iPhone SE)
  - [ ] Standard Mobile: 412px (Android)
  - [ ] Tablet: 768px (iPad portrait)
  - [ ] Laptop/Desktop: 1280px / 1440px / 1920px

### 7.3 Accessibility (a11y)
- [ ] Color contrast ratio meets WCAG AA (≥ 4.5:1 for standard text).
- [ ] Form fields have explicit `<label>` tags with matching `htmlFor` / `id`.
- [ ] Modal dialogs trap keyboard focus and dismiss on `Esc` key press.
- [ ] Screen readers announce validation errors and toast alerts (`aria-live="polite"`).

---

## 8. Defect Logging & Sign-Off Matrix

### Findings & Bug Tracker
| # | Module / Route | Description of Issue | Severity (Low/Med/High/Blocker) | Assigned To | Status |
| :- | :--- | :--- | :---: | :---: | :---: |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

---

### Final Release Sign-Off
- [ ] **Public Website Testing Completed**: All links, forms, schedules, and media tested.
- [ ] **Exco Portal RBAC Verified**: All 4 roles tested with positive and negative permission boundary tests.
- [ ] **Security & Cryptography Verified**: No unencrypted PII (`enc:v1:` / `bidx:v1:` enforced) or legacy password fields present in Sanity Studio.
- [ ] **PWA & Mobile Install Verified**: Standalone manifest and offline handling confirmed.
- [ ] **QA Lead / Dev Lead Approval**: ___________________________ Date: ____________
