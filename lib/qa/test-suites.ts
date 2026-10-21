export interface QATestCase {
  id: string
  suiteId: number
  suiteName: string
  section: string
  title: string
  description: string
  tag?: 'UI' | 'Security' | 'Responsive' | 'RBAC' | 'PWA' | 'Intake' | 'Recovery'
}

export interface QATestItemState {
  checked: boolean
  testerName?: string
  testerId?: string
  testerTokenHash?: string
  testedAt?: string
  notes?: string
}

export interface QATesterPublic {
  id: string
  name: string
  createdAt?: string
  lastActiveAt?: string
}

export interface QADefect {
  _key: string
  title: string
  module: string
  severity: 'Blocker' | 'High' | 'Med' | 'Low'
  status: 'Open' | 'In Progress' | 'Resolved'
  reportedBy: string
  reportedAt: string
  notes?: string
}

export interface QAChecklistDoc {
  _id: string
  _type: string
  title: string
  updatedAt?: string
  updatedBy?: string
  testItems: Record<string, QATestItemState>
  defects: QADefect[]
  testers?: QATesterPublic[]
}

export const QA_TEST_SUITES: { id: number; name: string }[] = [
  { id: 1, name: 'Public Facing Website & Media (`(public)`)' },
  { id: 2, name: 'Intake Forms, Verification & Cryptography (`/connect` & `/register`)' },
  { id: 3, name: 'Clerk Authentication & Portal Access (`/login`)' },
  { id: 4, name: 'Role-Based Access Control (RBAC) & Governance Matrix' },
  { id: 5, name: 'Dashboard Operational Modules & Workflows' },
  { id: 6, name: 'Integrations, Background Services & Datastore Security' },
]

export const QA_TEST_CASES: QATestCase[] = [
  // =========================================================================
  // SUITE 1: Public Facing Website & Media
  // =========================================================================
  {
    id: 'pub-nav-1',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Navigation & Layout',
    title: 'Desktop Header & Active Navigation',
    description: 'Verify brand logo routes to /, all main links (Home, About, Sermons, Announcements, Connect, Give) route properly, active indicator matches current route, and portal lock icon routes to /login.',
    tag: 'UI',
  },
  {
    id: 'pub-nav-2',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Navigation & Layout',
    title: 'Worker Registration Link Isolation',
    description: 'Confirm that /register is NOT visible in the public header menu or footer, remaining restricted to internal fellowship distribution and WhatsApp broadcasts.',
    tag: 'Security',
  },
  {
    id: 'pub-nav-3',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Navigation & Layout',
    title: 'Mobile Navigation Drawer & Gestures',
    description: 'Verify hamburger icon toggles mobile drawer cleanly, selecting any navigation destination closes the drawer, and backdrop tap dismisses it smoothly.',
    tag: 'Responsive',
  },
  {
    id: 'pub-hero-1',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Home Page',
    title: 'Formula 4 Split Collage & Dynamic Hero',
    description: 'Verify hero displays master headline dynamically from Sanity siteSettings.heroHeadline, displays fellowship credo ("JESUS IN OUR HEARTS, LETTERS IN OUR HEADS"), and showcases the 5-photo split collage grid (Academics, Prayer, Choir, Worship, Community).',
    tag: 'UI',
  },
  {
    id: 'pub-hero-2',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Home Page',
    title: 'Next Service Live Status Pill',
    description: 'Confirm the "Next Up" status badge displays dynamic upcoming service information (e.g. "NEXT UP • Sunday 08:00 AM • NLT 5 Law Auditorium") from Sanity siteSettings.liveStatusText.',
    tag: 'UI',
  },
  {
    id: 'pub-hero-3',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Home Page',
    title: 'Persistent Floating Quick Launcher (FAB)',
    description: 'Verify the floating launcher button in the bottom-right expands to show 1-click shortcuts (Podcast/Audio, Visit/Map, Giving, Announcements, Exco Portal) and smoothly navigates or triggers modal dialogues.',
    tag: 'UI',
  },
  {
    id: 'pub-sched-1',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Home Page',
    title: 'Interactive Weekly Services Schedule',
    description: 'Test weekly schedule component (Sunday Worship, Wednesday Word, Friday Academic/Prayer). Confirm tabs auto-rotate every few seconds, manual tab selection switches immediately, and highlight tags (e.g. "Interactive Q&A Session") render accurately.',
    tag: 'UI',
  },
  {
    id: 'pub-sermon-1',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Sermons Vault',
    title: 'ADR-002 3-Way Platform Media Toggle',
    description: 'On sermon cards and detail views, verify the 3 platform options: "Listen on Spotify" (deep link/embed), "Listen on YouTube Music" (background audio stream), and "Watch on YouTube" (video player). Confirm graceful degradation when specific links are not populated.',
    tag: 'UI',
  },
  {
    id: 'pub-sermon-2',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Sermons Vault',
    title: 'Real-Time Sermon Search & Topic Filtering',
    description: 'Verify real-time search input filters sermons by title, preacher name, and scripture passage. Topic tags and dropdown narrow results dynamically with instant feedback.',
    tag: 'UI',
  },
  {
    id: 'pub-ann-1',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Announcements',
    title: 'Announcements Showcase & Category Tabs',
    description: 'Verify live announcements display pinned notices at the top, show clear category tags (WEEKLY SERVICES, ACADEMIC & EXAMS, BIBLE STUDY, EXCO UPDATES, GENERAL), event date badges, and service venues.',
    tag: 'UI',
  },
  {
    id: 'pub-ann-2',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Announcements',
    title: 'Public Bulletin Newsletter Subscription',
    description: 'Test email subscription on /announcements and the footer. Submitting adds subscriber to Sanity; duplicates show friendly feedback without errors.',
    tag: 'UI',
  },
  {
    id: 'pub-give-1',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Giving Page',
    title: 'Direct Bank Transfer Giving & Copy Flow',
    description: 'Verify giving page dynamically pulls bank details from Sanity siteSettings (givingBankName, givingAccountName, givingAccountNumber, givingInstructions). Confirm clicking "Copy Account Number" copies digits to clipboard with confirmation toast, and unconfigured accounts prompt visitors gracefully.',
    tag: 'UI',
  },
  {
    id: 'pub-visit-1',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Plan a Visit',
    title: 'Plan a Visit & Direct Coordinator Contact',
    description: 'Verify Plan a Visit section renders weekly service timetable, venue location, Google Maps directions embed, and direct WhatsApp click-to-chat to the assigned coordinator (visitContactPerson, visitWhatsAppNumber).',
    tag: 'UI',
  },
  {
    id: 'pub-about-1',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'About Page',
    title: 'Heritage, Creed & Core 3 Pillars',
    description: 'Verify /about presents the fellowship heritage narrative, chronological expansion milestones, and the 3 foundational pillars (Spiritual Dynamites, Academic Giants, Kingdom Community) with scripture anchors.',
    tag: 'UI',
  },
  {
    id: 'pub-about-2',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'About Page',
    title: '14 Operational Teams Showcase',
    description: 'Confirm the 14 operational teams (Choir, Drama, Ushering, Media, Welfare, etc.) render with representative photos, ministry badges, descriptions, and real-time category filtering.',
    tag: 'UI',
  },
  {
    id: 'pub-about-3',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'About Page',
    title: 'Decoupled Public Leadership Cards (publicLeader)',
    description: 'Verify that About page leadership cards (Patrons, Pastoral Council, CSGB, Hall Pastors, Directors) source data strictly from publicLeader documents, verifying that private worker contact details (phone, room, email) are nowhere in DOM or API responses.',
    tag: 'Security',
  },
  {
    id: 'pub-gallery-1',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Photo Gallery',
    title: 'Campus Moments Gallery & Hotspot Cropping',
    description: 'Verify photo gallery grid displays authentic worship and campus pictures, supports category filtering, renders hotspot focal-point crops accurately, and expands into a full-screen view.',
    tag: 'UI',
  },
  {
    id: 'pub-footer-1',
    suiteId: 1,
    suiteName: 'Public Facing Website & Media',
    section: 'Footer Directory',
    title: 'Multi-Column Footer Directory & Badges',
    description: 'Verify global footer renders configured directory columns (footerNavColumns), official email, social media handles, meeting venue badge, residence halls ministry badge, and automatic current year copyright line.',
    tag: 'UI',
  },

  // =========================================================================
  // SUITE 2: Intake Forms, Verification & Cryptography
  // =========================================================================
  {
    id: 'sec-connect-1',
    suiteId: 2,
    suiteName: 'Intake Forms, Verification & Cryptography',
    section: 'Connect Form',
    title: 'First-Timer Connect Form Validation',
    description: 'Test /connect intake for new visitors. Confirm phone number normalization (+234 / 0...), mandatory residence hall dropdown (Hall 1–8), department, level, and Cloudflare Turnstile verification.',
    tag: 'Intake',
  },
  {
    id: 'sec-connect-2',
    suiteId: 2,
    suiteName: 'Intake Forms, Verification & Cryptography',
    section: 'Connect Form',
    title: 'Field-Level AES-256-GCM Encryption on Intake',
    description: 'Verify in Sanity Studio that submitted First-Timer phoneNumber and roomNumber are stored strictly as enc:v1:... ciphertext. Raw numbers or unencrypted PII must never reach the datastore.',
    tag: 'Security',
  },
  {
    id: 'sec-connect-3',
    suiteId: 2,
    suiteName: 'Intake Forms, Verification & Cryptography',
    section: 'Connect Form',
    title: 'Intake Deterministic Blind Indexing',
    description: 'Confirm phoneBlindIndex is computed via HMAC-SHA256 (bidx:v1:...) enabling deterministic lookup and deduplication without exposing decrypted phone numbers.',
    tag: 'Security',
  },
  {
    id: 'sec-welf-intake-1',
    suiteId: 2,
    suiteName: 'Intake Forms, Verification & Cryptography',
    section: 'Welfare Desk',
    title: 'Emergency Student Welfare Desk Intake',
    description: 'Submit student welfare request. Verify encrypted student contact number, problem description capture, and automatic initialization to Pending status.',
    tag: 'Intake',
  },
  {
    id: 'sec-prayer-intake-1',
    suiteId: 2,
    suiteName: 'Intake Forms, Verification & Cryptography',
    section: 'Prayer Ministry',
    title: 'Intercessory Prayer Request Submission',
    description: 'Test confidential prayer request intake with optional name. Verify successful submission toast, database timestamping, and anonymous display fallback.',
    tag: 'Intake',
  },
  {
    id: 'sec-reg-1',
    suiteId: 2,
    suiteName: 'Intake Forms, Verification & Cryptography',
    section: 'Worker Registration',
    title: 'Unified Passwordless Worker Registration',
    description: 'Test onboarding at /register. Confirm passwords have been completely abolished in favor of passwordless verification. Step sequence captures personal, residential, and workforce details smoothly.',
    tag: 'UI',
  },
  {
    id: 'sec-reg-2',
    suiteId: 2,
    suiteName: 'Intake Forms, Verification & Cryptography',
    section: 'Worker Registration',
    title: 'Worker Multi-Team Selection (teams[])',
    description: 'Confirm worker registration enables selecting multiple operational teams (teams[]), allowing volunteers to participate across ministries (e.g. Choir and Academic Teams) with primary team identification.',
    tag: 'Intake',
  },
  {
    id: 'sec-reg-3',
    suiteId: 2,
    suiteName: 'Intake Forms, Verification & Cryptography',
    section: 'Worker Registration',
    title: 'Residence Hall & Birthday Privacy Standardization',
    description: 'Confirm worker hostel is strictly selected from Hall 1 through Hall 8, and birthday is captured solely as MM-DD (without birth year) to safeguard student age privacy, accompanied by birthdayBlindIndex.',
    tag: 'Security',
  },
  {
    id: 'sec-reg-4',
    suiteId: 2,
    suiteName: 'Intake Forms, Verification & Cryptography',
    section: 'Worker Registration',
    title: 'Executive Designation Application Flow',
    description: 'In Step 8 of registration, toggle Exco designation. Test selecting CSGB Office (President, VP Admin, VP Evangelism, General Secretary), Hall Pastor (Lead/Assistant), or Team Lead (Lead/Assistant), noting that Finance access is strictly granted through Finance Lead/Assistant appointment.',
    tag: 'Intake',
  },
  {
    id: 'sec-reg-5',
    suiteId: 2,
    suiteName: 'Intake Forms, Verification & Cryptography',
    section: 'Worker Registration',
    title: 'Client-Side Image Compression & Signed Upload Grant',
    description: 'Upload high-resolution photo on /register. Confirm client compresses image to <500KB and routes via Google Apps Script with signed HMAC upload grant, returning public Google Drive URL.',
    tag: 'Security',
  },
  {
    id: 'sec-reg-6',
    suiteId: 2,
    suiteName: 'Intake Forms, Verification & Cryptography',
    section: 'Worker Registration',
    title: 'Cloudflare Turnstile Bot Defense Enforcement',
    description: 'Submit intake forms without completing Turnstile check or with invalid token. Confirm Server Action fails closed with user-friendly error message, preventing automated bot submissions.',
    tag: 'Security',
  },
  {
    id: 'sec-reg-7',
    suiteId: 2,
    suiteName: 'Intake Forms, Verification & Cryptography',
    section: 'Status Tracking',
    title: 'Worker Registration Status Tracking (/register/status)',
    description: 'Visit /register/status. Look up registration by phone, email, or authenticated Clerk user. Confirm live status cards display pending/verified operational team memberships and presidential executive application status.',
    tag: 'UI',
  },
  {
    id: 'sec-reg-8',
    suiteId: 2,
    suiteName: 'Intake Forms, Verification & Cryptography',
    section: 'Self-Service',
    title: 'Returning Worker Self-Service Profile Unlock',
    description: 'On registration form, enter registered phone/email in returning worker drawer. Confirm system delivers a 6-digit OTP code via Resend email. Entering valid OTP unlocks profile fields in place for updates.',
    tag: 'Recovery',
  },

  // =========================================================================
  // SUITE 3: Clerk Authentication & Portal Access
  // =========================================================================
  {
    id: 'auth-clerk-1',
    suiteId: 3,
    suiteName: 'Clerk Authentication & Portal Access',
    section: 'Authentication',
    title: 'Clerk Passwordless Authentication Flow',
    description: 'Navigate to /login. Test Clerk email code / magic link sign-in. Verify seamless authentication without traditional passwords, establishing valid session.',
    tag: 'RBAC',
  },
  {
    id: 'auth-clerk-2',
    suiteId: 3,
    suiteName: 'Clerk Authentication & Portal Access',
    section: 'Authentication',
    title: 'Automatic Clerk User ID Linking',
    description: 'Upon successful Clerk sign-in, verify the backend matches the worker document by verified email and permanently associates clerkUserId on the Sanity worker record.',
    tag: 'Security',
  },
  {
    id: 'auth-clerk-3',
    suiteId: 3,
    suiteName: 'Clerk Authentication & Portal Access',
    section: 'Route Guard',
    title: 'Middleware Route Guard & Redirection',
    description: 'Navigate directly to /dashboard/workers in an unauthenticated incognito session. Verify middleware intercepts and redirects to /login?callbackUrl=/dashboard/workers.',
    tag: 'Security',
  },
  {
    id: 'auth-clerk-4',
    suiteId: 3,
    suiteName: 'Clerk Authentication & Portal Access',
    section: 'Route Guard',
    title: 'Legacy /dashboard/login Redirect Bridge',
    description: 'Attempt to visit /dashboard/login. Confirm middleware cleanly redirects to /login, preserving query parameters and preventing callbackUrl redirect loops.',
    tag: 'Security',
  },
  {
    id: 'auth-clerk-5',
    suiteId: 3,
    suiteName: 'Clerk Authentication & Portal Access',
    section: 'Development Tools',
    title: 'Dev Mock Authentication & Role Switcher',
    description: 'Outside production, test DASHBOARD_MOCK_AUTH=1 pass-through and verify the eccf-dev-role cookie enables switching active identity between Admin, Team Lead, Hall Rep, and Finance.',
    tag: 'RBAC',
  },
  {
    id: 'auth-pwa-1',
    suiteId: 3,
    suiteName: 'Clerk Authentication & Portal Access',
    section: 'PWA Standards',
    title: 'PWA Manifest & Standalone App Capabilities',
    description: 'Verify /manifest.webmanifest returns HTTP 200 with complete app icons, theme colors, and standalone display mode. Verify mobile Add to Home Screen prompt.',
    tag: 'PWA',
  },

  // =========================================================================
  // SUITE 4: Role-Based Access Control (RBAC) & Governance Matrix
  // =========================================================================
  {
    id: 'rbac-pres-1',
    suiteId: 4,
    suiteName: 'Role-Based Access Control (RBAC) & Governance Matrix',
    section: 'Presidential Governance',
    title: 'Fellowship President Supreme Authority (isPresident)',
    description: 'Authenticate as Fellowship President. Verify /dashboard/executives appears in sidebar, executive applications queue is accessible, and presidential 1-tap approval/rejection permissions are granted.',
    tag: 'RBAC',
  },
  {
    id: 'rbac-pres-2',
    suiteId: 4,
    suiteName: 'Role-Based Access Control (RBAC) & Governance Matrix',
    section: 'Presidential Governance',
    title: 'President Universal Workforce Verification Fallback',
    description: 'Confirm the Fellowship President possesses universal fallback authority to verify workforce memberships across ANY operational team in /dashboard/workers.',
    tag: 'RBAC',
  },
  {
    id: 'rbac-csgb-1',
    suiteId: 4,
    suiteName: 'Role-Based Access Control (RBAC) & Governance Matrix',
    section: 'CSGB Admin',
    title: 'CSGB Administrator Full Module Governance',
    description: 'Log in as CSGB Executive Admin. Verify complete visibility across all operational modules (Workers, First-Timers, Attendance, Finance, Welfare, Prayer, Announcements, Sermons) with full write/manage permissions.',
    tag: 'RBAC',
  },
  {
    id: 'rbac-lead-1',
    suiteId: 4,
    suiteName: 'Role-Based Access Control (RBAC) & Governance Matrix',
    section: 'Team Leadership',
    title: 'Team Leader Scoped Workforce Verification',
    description: 'Log in as a Ministry Team Leader (e.g. Media or Choir). In /dashboard/workers, confirm only workers applying to or serving on their team appear. Attempting to verify another team\'s worker returns permission denied.',
    tag: 'RBAC',
  },
  {
    id: 'rbac-hall-1',
    suiteId: 4,
    suiteName: 'Role-Based Access Control (RBAC) & Governance Matrix',
    section: 'Hall Representation',
    title: 'Hall Representative Scoped Hall Isolation',
    description: 'Log in as Hall 2 Representative. Verify /dashboard/workers and /dashboard/first-timers filter strictly to residents of Hall 2. Records from other halls must be completely withheld.',
    tag: 'RBAC',
  },
  {
    id: 'rbac-fin-1',
    suiteId: 4,
    suiteName: 'Role-Based Access Control (RBAC) & Governance Matrix',
    section: 'Finance Treasury',
    title: 'Financial Secretary Isolation',
    description: 'Log in as Finance Secretary. Confirm sidebar navigation shows strictly Overview and /dashboard/finance. Attempting direct navigation to /dashboard/workers or /dashboard/executives redirects with access-denied state (?denied=...).',
    tag: 'RBAC',
  },
  {
    id: 'rbac-welf-1',
    suiteId: 4,
    suiteName: 'Role-Based Access Control (RBAC) & Governance Matrix',
    section: 'Welfare Ministry',
    title: 'Welfare Coordinator Access',
    description: 'Log in as Welfare Coordinator. Verify access to /dashboard/welfare and people statistics on the Overview dashboard.',
    tag: 'RBAC',
  },
  {
    id: 'rbac-media-1',
    suiteId: 4,
    suiteName: 'Role-Based Access Control (RBAC) & Governance Matrix',
    section: 'Media Ministry',
    title: 'Media Coordinator Permissions',
    description: 'Log in as Media Coordinator. Confirm full access to /dashboard/sermons with manual sync button, announcement subscriber broadcasts, and fellowship-wide worker birthday directory.',
    tag: 'RBAC',
  },

  // =========================================================================
  // SUITE 5: Dashboard Operational Modules & Workflows
  // =========================================================================
  {
    id: 'mod-exec-1',
    suiteId: 5,
    suiteName: 'Dashboard Operational Modules & Workflows',
    section: 'Executive Console',
    title: 'Presidential Executive Application Queue',
    description: 'In /dashboard/executives, verify pending applications group by category tabs (CSGB Offices, Hall Pastors, Ministry Team Leads) showing applicant details, hall, office, and date.',
    tag: 'UI',
  },
  {
    id: 'mod-exec-2',
    suiteId: 5,
    suiteName: 'Dashboard Operational Modules & Workflows',
    section: 'Executive Console',
    title: '1-Tap Executive Approval & Auto-Team Verification',
    description: 'As President, click "Approve" on an executive application. Confirm position status updates to approved, audit log writes to updateLog, and if it is a Ministry Team Lead, their operational team membership is automatically verified.',
    tag: 'RBAC',
  },
  {
    id: 'mod-work-1',
    suiteId: 5,
    suiteName: 'Dashboard Operational Modules & Workflows',
    section: 'Workforce CRM',
    title: 'Worker Workforce CRM Table & Decryption',
    description: 'In /dashboard/workers, confirm phone numbers, room numbers, and birthdays display cleanly decrypted with zero raw ciphertext. Multi-team badges and executive position tags render clearly.',
    tag: 'UI',
  },
  {
    id: 'mod-work-2',
    suiteId: 5,
    suiteName: 'Dashboard Operational Modules & Workflows',
    section: 'Workforce CRM',
    title: 'Worker Workforce Verification Action',
    description: 'As authorized Team Lead or President, verify or decline a pending worker. Confirm status badge updates in real time and audit trail registers in Sanity updateLog.',
    tag: 'RBAC',
  },
  {
    id: 'mod-work-3',
    suiteId: 5,
    suiteName: 'Dashboard Operational Modules & Workflows',
    section: 'Workforce CRM',
    title: 'Worker Communication & Email Dispatch',
    description: 'Click "Send Email" on a worker record. Verify modal opens with sender info, subject, message input, and executes transactional email via Resend cleanly.',
    tag: 'UI',
  },
  {
    id: 'mod-att-1',
    suiteId: 5,
    suiteName: 'Dashboard Operational Modules & Workflows',
    section: 'Attendance Ledger',
    title: 'Dual-Mode Attendance Tracking Submission',
    description: 'In /dashboard/attendance, test recording a gathering. Verify both Quick Headcount mode and Full Worker Roster Checklist mode. Confirm records link weak references to workers and update analytics charts.',
    tag: 'UI',
  },
  {
    id: 'mod-fin-1',
    suiteId: 5,
    suiteName: 'Dashboard Operational Modules & Workflows',
    section: 'Finance Ledger',
    title: 'Finance Transaction Accounting & CSV Export',
    description: 'In /dashboard/finance, record Income (Tithe/Offering/Online Giving) and Expense transactions. Verify amount formatting (₦), balance calculations, and test one-click CSV ledger export.',
    tag: 'UI',
  },
  {
    id: 'mod-welf-1',
    suiteId: 5,
    suiteName: 'Dashboard Operational Modules & Workflows',
    section: 'Welfare Desk',
    title: 'Welfare Case Resolution Workflow',
    description: 'In /dashboard/welfare, review open student welfare requests. Click "Call" to test student tel: link. Click "Mark Resolved" to toggle status to Resolved with live table update.',
    tag: 'UI',
  },
  {
    id: 'mod-ft-1',
    suiteId: 5,
    suiteName: 'Dashboard Operational Modules & Workflows',
    section: 'First-Timers Desk',
    title: 'First-Timers Pastoral Wing Follow-Up',
    description: 'In /dashboard/first-timers, verify hall-based filtering. Test clicking "WhatsApp" to launch mobile WhatsApp chat with pre-populated pastoral welcome greeting.',
    tag: 'UI',
  },
  {
    id: 'mod-ann-1',
    suiteId: 5,
    suiteName: 'Dashboard Operational Modules & Workflows',
    section: 'Announcements Manager',
    title: 'Announcements Publisher & Email Broadcast',
    description: 'In /dashboard/announcements, draft a new announcement with rich text, pin toggle, category, and event date. When "Broadcast on publish" is checked, verify transactional email dispatches to all active subscribers.',
    tag: 'UI',
  },
  {
    id: 'mod-sermon-1',
    suiteId: 5,
    suiteName: 'Dashboard Operational Modules & Workflows',
    section: 'Sermon Vault',
    title: 'Sermons Manager & Manual RSS Sync Trigger',
    description: 'In /dashboard/sermons, view sermon catalog with platform links. Click "Sync Sermons Now" in Exco topbar. Verify Server Action dispatches Bearer CRON_SECRET and displays sync status toast.',
    tag: 'UI',
  },

  // =========================================================================
  // SUITE 6: Integrations, Background Services & Datastore Security
  // =========================================================================
  {
    id: 'int-draft-1',
    suiteId: 6,
    suiteName: 'Integrations, Background Services & Datastore Security',
    section: 'Sanity Datastore',
    title: 'Operational Records Private Drafts Isolation',
    description: 'Run an anonymous GROQ query against the live Sanity production endpoint for worker, attendanceLedger, financeLedger, welfareRequest, firstTimer. Confirm exactly 0 records are exposed, proving all operational records are sealed in private drafts (drafts.<id>).',
    tag: 'Security',
  },
  {
    id: 'int-rss-1',
    suiteId: 6,
    suiteName: 'Integrations, Background Services & Datastore Security',
    section: 'Podcast Engine',
    title: 'Idempotent RSS Auto-Sync Route (/api/sync-sermons)',
    description: 'Trigger /api/sync-sermons with Bearer CRON_SECRET. Verify XML parser ingests Spotify and YouTube feeds, matches existing episodes without creating duplicates, and maps video IDs to YouTube Music URLs.',
    tag: 'Security',
  },
  {
    id: 'int-resend-1',
    suiteId: 6,
    suiteName: 'Integrations, Background Services & Datastore Security',
    section: 'Email Delivery',
    title: 'Transactional Email Delivery (Resend API)',
    description: 'Verify end-to-end email delivery for 6-digit worker verification OTPs, self-service profile unlock links, and announcement broadcasts, with working unsubscribe mechanisms.',
    tag: 'Security',
  },
  {
    id: 'int-drive-1',
    suiteId: 6,
    suiteName: 'Integrations, Background Services & Datastore Security',
    section: 'Media Pipeline',
    title: 'Stateless Google Apps Script Drive Bridge',
    description: 'Verify base64 image upload checks 2MB size ceiling, validates image headers, verifies signed upload grant (uploadGrantHash), and saves into the designated Google Drive folder.',
    tag: 'Security',
  },
  {
    id: 'int-preview-1',
    suiteId: 6,
    suiteName: 'Integrations, Background Services & Datastore Security',
    section: 'Sanity Studio',
    title: 'Sanity Studio Live Web Preview & Draft Mode',
    description: 'Inside Sanity Studio, open split Live Web Preview pane for an announcement or sermon. Confirm iframe activates Next.js Draft Mode (/api/preview) for instant visual feedback.',
    tag: 'UI',
  },
]
