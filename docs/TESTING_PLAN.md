# ECCF Website & Platform — Developer Functional Testing Plan

> **Version:** 1.0 (Production Candidate)  
> **Target Environment:** Local Dev (`http://localhost:3000`) & Staging / Production  
> **Stack:** Next.js 14 App Router, Sanity Studio v3, NextAuth.js, Tailwind CSS, Resend, Google Drive Apps Script Bridge  
> **Security Baseline:** AES-256-GCM Field-Level Encryption + HMAC-SHA256 Blind Indexing + Bcrypt  

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
  - [ ] All primary links (`Home`, `About`, `Sermons`, `Announcements`, `Connect`, `Give`) route to their respective pages.
  - [ ] Active route indicator correctly highlights the current page.
  - [ ] Exco Portal / Portal Login icon or link correctly routes to `/dashboard/login`.
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

### 1.4 Sermons Vault (`/sermons`)
- [ ] **Search & Filtering**
  - [ ] Search input filters sermons in real-time by title, preacher, or scripture passage.
  - [ ] Topic / Series dropdown accurately narrows sermon list.
  - [ ] Empty state message renders when no sermons match filter criteria.
- [ ] **Audio & Media Playback**
  - [ ] Audio player controls (Play, Pause, Progress Seek, Volume) function without audio distortion.
  - [ ] Stream links resolve correctly from Cloud Storage / Google Drive.
  - [ ] Preacher name, date preached, and sermon notes link (if available) render accurately.

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
  - [ ] Submitted record creates a `firstTimer` document in Sanity.
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
  - [ ] Email: strictly validates email format.
  - [ ] Phone Number: validated and checked against Sanity blind indexes.
  - [ ] Hostel & Room: Hall dropdown lists all campus hostels (e.g., Hall 1, Hall 2, Hall 3, Hall 4, NDDC, etc.) + room number.
  - [ ] Department / Teams: Multi-select allows primary and secondary unit selections.
  - [ ] Birthday: Formatted strictly as `MM-DD` (no birth year requested for privacy).
  - [ ] Exco Designation: Option to specify requested Exco role (Admin, Team Lead, Hall Rep, Finance).
  - [ ] Password: Requires minimum 8 characters with strength validation.
- [ ] **Passport / Headshot Image Handling**
  - [ ] Uploading high-res image triggers client-side image compression (`sharp` / canvas) under 500KB.
  - [ ] Image upload safely sends to Google Drive via Apps Script bridge or direct Sanity asset upload.
  - [ ] File type restriction prevents non-image uploads (rejects PDFs, EXEs).
- [ ] **Duplicate Prevention & Security Storage**
  - [ ] Attempting to register with an existing phone number or email rejects with a clean error message and points to the Exco Login portal.
  - [ ] Record created in Sanity with `verificationStatus: "pending"` and `isExcoApproved: false`.
  - [ ] Double-Layer Password Security: Password is first hashed with `bcryptjs` (salt rounds: 10), and the resulting bcrypt hash is encrypted with AES-256-GCM before saving into `passwordHash`.

---

## 3. Exco Portal Authentication & PWA (`/dashboard/login`)

### 3.1 Authentication & Credential Verification
- [ ] **Valid Sign-in**
  - [ ] Exco enters valid phone number (`08168730661` or `+2348168730661`) or email + password.
  - [ ] System derives candidate blind indexes, locates the worker document, decrypts `passwordHash`, and validates bcrypt.
  - [ ] Authenticated user is redirected to `/dashboard`.
- [ ] **Invalid Credentials**
  - [ ] Incorrect password returns *"Invalid phone number/email or password."*
  - [ ] Unregistered phone/email returns error without leaking user existence.
- [ ] **Unapproved / Pending Exco Gate**
  - [ ] Account with `verificationStatus: "pending"` or `isExcoApproved: false` is blocked with:  
    *"Your account is awaiting Executive Council approval. Please contact the General Secretary."*
- [ ] **Missing Password Self-Service Recovery**
  - [ ] Account verified in Sanity but lacking `passwordHash` displays error banner with clickable:  
    **"Set up your dashboard password now →"**
  - [ ] Clicking opens the **Set/Reset Password Dialog**.
  - [ ] Submitting phone/email + new 8+ character password successfully writes encrypted bcrypt hash to Sanity.
  - [ ] User can immediately sign in with the new password.

### 3.2 Session & Route Protection (Middleware)
- [ ] Unauthenticated visitor navigating to `/dashboard/*` is redirected to `/dashboard/login?callbackUrl=...`.
- [ ] Session persists across browser refreshes and tab closures.
- [ ] Clicking **Sign Out** in the user profile menu clears NextAuth session cookie and redirects to `/dashboard/login`.

### 3.3 Progressive Web App (PWA) Functionality
- [ ] **Manifest & Service Worker**
  - [ ] `/manifest.json` responds with `200 OK` and valid JSON structure.
  - [ ] Icons (192x192, 512x512) load without 404s.
  - [ ] Standalone display mode functions properly (hides browser URL bar on mobile).
- [ ] **Install Prompt Banner**
  - [ ] On supported mobile browsers, the PWA installation banner/prompt appears.
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
| **Welfare** (`/dashboard/welfare`) | Global | View & Resolve | Own Hall Only | Restricted (403) |
| **Prayer Requests** (`/dashboard/prayer-requests`) | Global | View & Assign | Own Hall Only | Restricted (403) |
| **Announcements** (`/dashboard/announcements`) | Full Access | Restricted (403) | Restricted (403) | Restricted (403) |

### 4.1 CSGB Admin Testing
- [ ] Admin navigation sidebar displays all 8 modules.
- [ ] Directly accessing any `/dashboard/*` route succeeds with status 200.
- [ ] Full create, update, and resolve permissions active.

### 4.2 Outreach Team Leader Testing
- [ ] Log in with a worker account having `role: "team_lead"` and team containing `"Outreach"` or `"Follow"`.
- [ ] **First-Timers & Connect Intake** (`/dashboard/first-timers`) appears in sidebar.
- [ ] Page header shows *"Outreach & Follow-Up Portal"*.
- [ ] Can view all connect form submissions across campus for pastoral follow-up.
- [ ] Attempting to access `/dashboard/finance` directly redirects or returns 403 Forbidden.

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
  - [ ] Clicking **Approve** updates Sanity document to `verificationStatus: "verified"` and `isExcoApproved: true`.
  - [ ] Clicking **Decline** updates status to `verificationStatus: "rejected"`.
  - [ ] Roster table updates optimistically or revalidates immediately.
- [ ] **Birthday Calendar / Filter**
  - [ ] Upcoming birthdays for the current week/month filter accurately based on `birthdayBlindIndex` / decrypted MM-DD.

### 5.2 First-Timers & Connect Portal (`/dashboard/first-timers`)
- [ ] **Intake Grid & Follow-Up Actions**
  - [ ] Shows visitor name, phone number, hostel, date visited, and prayer requests.
  - [ ] "Call" button launches native device dialer (`tel:08168730661`).
  - [ ] "WhatsApp" button opens direct chat with pre-filled greeting (`https://wa.me/2348168730661?text=...`).
  - [ ] Follow-up status dropdown (Pending Contact, Contacted, Welcomed, Established) persists update to Sanity.

### 5.3 Attendance Ledger (`/dashboard/attendance`)
- [ ] **Record Intake**
  - [ ] "Record Attendance" modal collects: Service Date, Service Type (Sunday Service, Midweek, Workers Meeting), Total Count, Males, Females, Children, and First Timers.
  - [ ] Validation ensures sum of breakdowns aligns with total count or warns on mismatch.
  - [ ] Successful submission creates `attendanceLedger` document in Sanity and updates recent attendance charts.

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
  - [ ] Publishing triggers optional email broadcast to verified subscribers via Resend API.
  - [ ] Announcement updates live on the public `/announcements` page immediately via Next.js on-demand ISR revalidation.

---

## 6. Integrations & Background Services

### 6.1 Google Drive Apps Script Bridge (`/api/upload-drive`)
- [ ] Submitting large worker headshots triggers Apps Script web app endpoint.
- [ ] Verifies script returns valid public Google Drive thumbnail/view link.
- [ ] Link persists properly on the worker document `headshotDriveUrl` field.

### 6.2 Sermon Sync Service (`/api/sync-sermons`)
- [ ] Triggering manual sync from dashboard validates secret bearer token.
- [ ] Scans designated Google Drive / Audio folder, extracts metadata, and upserts `sermonVault` records.
- [ ] Avoids creating duplicate sermon entries for identical file IDs.

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
- [ ] **Security & Cryptography Verified**: No unencrypted PII or passwords present in Sanity Studio.
- [ ] **PWA & Mobile Install Verified**: Standalone manifest and offline handling confirmed.
- [ ] **QA Lead / Dev Lead Approval**: ___________________________ Date: ____________
