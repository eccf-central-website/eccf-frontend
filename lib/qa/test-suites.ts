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
  testedAt?: string
  notes?: string
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
}

export const QA_TEST_SUITES: { id: number; name: string }[] = [
  { id: 1, name: 'Public Facing Website (`(public)`)' },
  { id: 2, name: 'Intake Forms & Cryptography (`/connect` & `/register`)' },
  { id: 3, name: 'Exco Portal Authentication & PWA (`/dashboard/login`)' },
  { id: 4, name: 'Role-Based Access Control (RBAC) Matrix' },
  { id: 5, name: 'Dashboard Operational Modules' },
  { id: 6, name: 'Integrations & Background Services' },
]

export const QA_TEST_CASES: QATestCase[] = [
  // SUITE 1: Public Website
  {
    id: 'pub-nav-1',
    suiteId: 1,
    suiteName: 'Public Facing Website',
    section: 'Navigation & Layout',
    title: 'Desktop Header Navigation',
    description: 'Verify logo routes to /, all main links (Home, About, Sermons, Announcements, Connect, Give) route properly, active indicator matches current route, and portal icon routes to /dashboard/login.',
    tag: 'UI',
  },
  {
    id: 'pub-nav-2',
    suiteId: 1,
    suiteName: 'Public Facing Website',
    section: 'Navigation & Layout',
    title: 'Worker Registration Link Isolation',
    description: 'Confirm that /register is NOT visible in the public header menu or footer (restricted to internal WhatsApp sharing).',
    tag: 'Security',
  },
  {
    id: 'pub-nav-3',
    suiteId: 1,
    suiteName: 'Public Facing Website',
    section: 'Navigation & Layout',
    title: 'Mobile Navigation Drawer',
    description: 'Verify hamburger icon toggles mobile drawer cleanly, selecting any link navigates and closes the drawer, and backdrop tap closes it.',
    tag: 'Responsive',
  },
  {
    id: 'pub-nav-4',
    suiteId: 1,
    suiteName: 'Public Facing Website',
    section: 'Navigation & Layout',
    title: 'Global Footer & Social Links',
    description: 'Confirm church address, meeting schedules, social handles (with target="_blank" rel="noopener noreferrer"), and copyright year render correctly.',
    tag: 'UI',
  },
  {
    id: 'pub-home-1',
    suiteId: 1,
    suiteName: 'Public Facing Website',
    section: 'Home Page',
    title: 'Dynamic Hero Headline',
    description: 'Verify hero displays headline dynamically from Sanity siteSettings.heroHeadline with graceful fallback when empty.',
    tag: 'UI',
  },
  {
    id: 'pub-home-2',
    suiteId: 1,
    suiteName: 'Public Facing Website',
    section: 'Home Page',
    title: 'Interactive Weekly Services Schedule',
    description: 'Ensure service tabs span the section width, rotate automatically every 3 seconds, and allow manual tab selection seamlessly.',
    tag: 'UI',
  },
  {
    id: 'pub-home-3',
    suiteId: 1,
    suiteName: 'Public Facing Website',
    section: 'Home Page',
    title: 'Announcements Showcase / Carousel',
    description: 'Verify pinned & published announcements render on the homepage with working detail links.',
    tag: 'UI',
  },
  {
    id: 'pub-about-1',
    suiteId: 1,
    suiteName: 'Public Facing Website',
    section: 'About Page',
    title: 'Creed & Mission Typography',
    description: 'Verify mission creed displays with clean standard font hierarchy without unwanted serif accents.',
    tag: 'UI',
  },
  {
    id: 'pub-about-2',
    suiteId: 1,
    suiteName: 'Public Facing Website',
    section: 'About Page',
    title: 'Decluttered Leadership Cards',
    description: 'Confirm that cards show headshots and leader names only. Verify removal of top "Team Lead" badge, blue subtitle text, and bottom team labels.',
    tag: 'UI',
  },
  {
    id: 'pub-sermon-1',
    suiteId: 1,
    suiteName: 'Public Facing Website',
    section: 'Sermons Vault',
    title: 'Search & Topic Filtering',
    description: 'Verify real-time search input filters sermons by title, preacher, and passage. Topic dropdown narrows results.',
    tag: 'UI',
  },
  {
    id: 'pub-sermon-2',
    suiteId: 1,
    suiteName: 'Public Facing Website',
    section: 'Sermons Vault',
    title: 'Audio Player Playback',
    description: 'Confirm streaming audio plays, pauses, seeks, and adjusts volume across browsers without CORS or playback errors.',
    tag: 'UI',
  },
  {
    id: 'pub-ann-1',
    suiteId: 1,
    suiteName: 'Public Facing Website',
    section: 'Announcements',
    title: 'Newsletter Subscription Validation',
    description: 'Test email input validation on /announcements. Submitting adds subscriber to Sanity; duplicates show friendly message.',
    tag: 'UI',
  },
  {
    id: 'pub-give-1',
    suiteId: 1,
    suiteName: 'Public Facing Website',
    section: 'Giving Page',
    title: 'One-Click Bank Details Copy',
    description: 'Verify clicking "Copy Account Number" copies digits to clipboard and displays confirmation toast. Giving categories render clearly.',
    tag: 'UI',
  },

  // SUITE 2: Intake & Cryptography
  {
    id: 'sec-form-1',
    suiteId: 2,
    suiteName: 'Intake Forms & Cryptography',
    section: 'Connect Form',
    title: 'Connect Form Validation & Hall Assignment',
    description: 'Test /connect form submission for First-Timers. Verify phone format normalization (+234 / 0...) and mandatory hostel/hall selection.',
    tag: 'Intake',
  },
  {
    id: 'sec-form-2',
    suiteId: 2,
    suiteName: 'Intake Forms & Cryptography',
    section: 'Connect Form',
    title: 'First-Timer Field-Level Encryption',
    description: 'Verify in Sanity Studio that phoneNumber is stored as enc:v1:... (AES-256-GCM) and phoneBlindIndex as bidx:v1:... Raw numbers must never appear.',
    tag: 'Security',
  },
  {
    id: 'sec-form-3',
    suiteId: 2,
    suiteName: 'Intake Forms & Cryptography',
    section: 'Worker Registration',
    title: 'Worker Birthday Format Standardization',
    description: 'Confirm worker registration captures birthday strictly as MM-DD without birth year. Blind index stores corresponding HMAC.',
    tag: 'Security',
  },
  {
    id: 'sec-form-4',
    suiteId: 2,
    suiteName: 'Intake Forms & Cryptography',
    section: 'Worker Registration',
    title: 'Client Image Compression & Drive Upload',
    description: 'Upload a high-resolution photo on /register. Confirm client compresses below 500KB and transfers to Drive bridge or Sanity cleanly.',
    tag: 'UI',
  },
  {
    id: 'sec-form-5',
    suiteId: 2,
    suiteName: 'Intake Forms & Cryptography',
    section: 'Worker Registration',
    title: 'Double-Layer Password Storage',
    description: 'Verify submitted password is first hashed with bcrypt (cost 10) and the resulting bcrypt string is encrypted with AES-256-GCM into passwordHash.',
    tag: 'Security',
  },
  {
    id: 'sec-form-6',
    suiteId: 2,
    suiteName: 'Intake Forms & Cryptography',
    section: 'Worker Registration',
    title: 'Duplicate Registration Prevention',
    description: 'Attempt to register again with an already registered phone or email. System must reject registration and advise logging into the Exco Portal.',
    tag: 'Security',
  },

  // SUITE 3: Exco Portal Auth & PWA
  {
    id: 'auth-pwa-1',
    suiteId: 3,
    suiteName: 'Exco Portal Auth & PWA',
    section: 'Authentication',
    title: 'Valid Phone / Email & Password Login',
    description: 'Authenticate with 08168730661 or ransomakpan2021@gmail.com. Verify successful session establishment and redirect to /dashboard.',
    tag: 'RBAC',
  },
  {
    id: 'auth-pwa-2',
    suiteId: 3,
    suiteName: 'Exco Portal Auth & PWA',
    section: 'Authentication',
    title: 'Candidate Blind Index Matching',
    description: 'Verify that phone lookup succeeds across candidate encryption keys (local dev vs fallback production salt) seamlessly.',
    tag: 'Security',
  },
  {
    id: 'auth-pwa-3',
    suiteId: 3,
    suiteName: 'Exco Portal Auth & PWA',
    section: 'Password Recovery',
    title: 'Self-Service Password Setup Modal',
    description: 'Trigger password setup via "Set or reset password?" modal. Verify new password (8+ characters) encrypts and saves, allowing instant login.',
    tag: 'Recovery',
  },
  {
    id: 'auth-pwa-4',
    suiteId: 3,
    suiteName: 'Exco Portal Auth & PWA',
    section: 'Access Gating',
    title: 'Pending Exco Approval Gate',
    description: 'Attempt login with an account where isExcoApproved: false. Verify access is blocked with the approval message.',
    tag: 'RBAC',
  },
  {
    id: 'auth-pwa-5',
    suiteId: 3,
    suiteName: 'Exco Portal Auth & PWA',
    section: 'Route Guard',
    title: 'Middleware Route Protection',
    description: 'Directly navigate to /dashboard/workers in an incognito window. Ensure immediate redirection to /dashboard/login?callbackUrl=...',
    tag: 'Security',
  },
  {
    id: 'auth-pwa-6',
    suiteId: 3,
    suiteName: 'Exco Portal Auth & PWA',
    section: 'PWA Experience',
    title: 'PWA Web App Manifest & Install Prompt',
    description: 'Verify /manifest.json returns 200 with icons and standalone display mode. Test installation prompt on Chrome/Safari.',
    tag: 'PWA',
  },

  // SUITE 4: Role-Based Access Control
  {
    id: 'rbac-test-1',
    suiteId: 4,
    suiteName: 'RBAC Matrix',
    section: 'CSGB Admin',
    title: 'CSGB Administrator (admin)',
    description: 'Confirm complete visibility of all 8 modules (Workers, First-Timers, Attendance, Finance, Welfare, Prayer, Announcements). Full edit/approval permissions.',
    tag: 'RBAC',
  },
  {
    id: 'rbac-test-2',
    suiteId: 4,
    suiteName: 'RBAC Matrix',
    section: 'Team Leader',
    title: 'Outreach Team Leader Follow-Up Access',
    description: 'Log in as Outreach Team Leader. Verify /dashboard/first-timers is present and displays ALL campus connect submissions for follow-up coordination.',
    tag: 'RBAC',
  },
  {
    id: 'rbac-test-3',
    suiteId: 4,
    suiteName: 'RBAC Matrix',
    section: 'Hall Representative',
    title: 'Hall Representative Scoped Visibility',
    description: 'Log in as Hall 2 Rep. In /dashboard/workers and /dashboard/first-timers, confirm only Hall 2 records appear. Records from other halls must be filtered out.',
    tag: 'RBAC',
  },
  {
    id: 'rbac-test-4',
    suiteId: 4,
    suiteName: 'RBAC Matrix',
    section: 'Finance Secretary',
    title: 'Finance Secretary Isolation',
    description: 'Log in as Finance. Confirm sidebar shows only Overview & Finance Ledger. Attempting to visit /dashboard/workers or first-timers returns 403 Forbidden.',
    tag: 'RBAC',
  },

  // SUITE 5: Operational Modules
  {
    id: 'mod-work-1',
    suiteId: 5,
    suiteName: 'Dashboard Modules',
    section: 'Workers',
    title: 'Worker Decryption in UI',
    description: 'Verify phone numbers, birthdays, and room numbers display cleanly decrypted. Ensure no [Encrypted Data] or raw ciphertext appears.',
    tag: 'UI',
  },
  {
    id: 'mod-work-2',
    suiteId: 5,
    suiteName: 'Dashboard Modules',
    section: 'Workers',
    title: 'Worker Approval / Decline Flow',
    description: 'Approve a pending worker as Admin. Confirm badge switches to "Verified" and user can now sign in. Declining sets status to "Rejected".',
    tag: 'RBAC',
  },
  {
    id: 'mod-ft-1',
    suiteId: 5,
    suiteName: 'Dashboard Modules',
    section: 'First-Timers',
    title: 'First-Timer Native Call & WhatsApp Triggers',
    description: 'Click "Call" on a first-timer row to test tel: link. Click "WhatsApp" to test pre-filled WhatsApp greeting on mobile.',
    tag: 'UI',
  },
  {
    id: 'mod-att-1',
    suiteId: 5,
    suiteName: 'Dashboard Modules',
    section: 'Attendance',
    title: 'Attendance Submission & Breakdown',
    description: 'Record a fellowship service attendance (Total, Males, Females, Children, Visitors). Verify new record in Sanity and chart refresh.',
    tag: 'UI',
  },
  {
    id: 'mod-fin-1',
    suiteId: 5,
    suiteName: 'Dashboard Modules',
    section: 'Finance',
    title: 'Finance Transaction Entry',
    description: 'Record Income (Tithe/Offering) and Expense transactions. Verify amount formatting (₦) and balance computation.',
    tag: 'UI',
  },

  // SUITE 6: Integrations
  {
    id: 'int-drive-1',
    suiteId: 6,
    suiteName: 'Integrations',
    section: 'External APIs',
    title: 'Google Drive Apps Script Bridge',
    description: 'Upload worker headshot and verify Apps Script web app endpoint returns valid public Google Drive thumbnail/view link.',
    tag: 'UI',
  },
  {
    id: 'int-resend-1',
    suiteId: 6,
    suiteName: 'Integrations',
    section: 'External APIs',
    title: 'Email Delivery Service (Resend)',
    description: 'Trigger announcement broadcast to subscribers and confirm email delivery with functional unsubscribe links.',
    tag: 'UI',
  },
]
