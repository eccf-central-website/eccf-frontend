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
  { id: 1, name: '1. Public Website & Media' },
  { id: 2, name: '2. Forms & Applications (Connect & Register)' },
  { id: 3, name: '3. Sign In & Mobile App Experience' },
  { id: 4, name: '4. Roles & Permissions (Who Can See What)' },
  { id: 5, name: '5. Leader Dashboard & Daily Tasks' },
  { id: 6, name: '6. External Services, Emails & Safety' },
]

export const QA_TEST_CASES: QATestCase[] = [
  // =========================================================================
  // SUITE 1: Public Website & Media
  // =========================================================================
  {
    id: 'pub-nav-1',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Navigation & Header',
    title: 'Header Menu Links & Logo',
    description: `Make sure all main navigation links work smoothly and take you to the correct pages.

How to test:
1. Click the ECCF logo at the top left — confirm it returns to the Home page.
2. Click each link in order: About, Sermons, Bulletins, Connect, and Give.
3. Confirm that each page loads without errors and the blue indicator line highlights the page you are on.
4. Click the small lock icon on the far right — confirm it opens the Sign In page (/login).`,
    tag: 'UI',
  },
  {
    id: 'pub-nav-2',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Navigation & Header',
    title: 'Secret Worker Registration Link',
    description: `The volunteer worker registration page (/register) is for internal fellowship members and should never appear in public menus.

How to test:
1. Check the top header menu and the bottom website footer.
2. Confirm there is NO public button or link that says "Register as Worker".
3. (Members access this registration form only through private fellowship WhatsApp announcements).`,
    tag: 'Security',
  },
  {
    id: 'pub-nav-3',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Mobile Navigation',
    title: 'Mobile Menu & Drawer',
    description: `Check that the website menu works easily on mobile phones.

How to test:
1. Open the website on a phone (or shrink your desktop browser window).
2. Tap the 3-line hamburger menu icon at the top right to open the drawer.
3. Tap any page link (e.g. "Sermons") — verify it opens that page and closes the menu automatically.
4. Open the menu again and tap the dark background outside the menu — verify it closes smoothly.`,
    tag: 'Responsive',
  },
  {
    id: 'pub-hero-1',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Home Page',
    title: 'Homepage Hero Headline & Photo Collage',
    description: `The top of the home page should show the fellowship motto, headline, and a 5-photo collage grid.

How to test:
1. Go to the Home page (/).
2. Look at the top hero section: check that the big headline and motto ("JESUS IN OUR HEARTS, LETTERS IN OUR HEADS") appear clearly.
3. Check the photo grid on the right: confirm all 5 campus photos (Academics, Prayer, Choir, Worship, and Community) load cleanly with rounded corners.`,
    tag: 'UI',
  },
  {
    id: 'pub-hero-2',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Home Page',
    title: 'Next Service Live Status Pill',
    description: `A blue banner pill above the main headline tells visitors when the very next gathering is taking place.

How to test:
1. Look above the main headline on the Home page.
2. Find the pill badge that says "NEXT UP • Sunday 08:00 AM • NLT 5 Law Auditorium" (or the next scheduled gathering).
3. Confirm the text is clear, centered, and easy to read.`,
    tag: 'UI',
  },
  {
    id: 'pub-hero-3',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Home Page',
    title: 'Floating Quick Launcher Button (FAB)',
    description: `A circular blue button stays pinned at the bottom-right of your screen for fast 1-tap shortcuts.

How to test:
1. Look at the bottom-right corner of the screen on any page.
2. Click or tap the floating blue circular button.
3. Confirm a menu opens with 5 quick shortcuts: Listen to Sermons, Plan a Visit, Give, Announcements, and Leader Portal.
4. Tap any shortcut to verify it takes you right to that section.`,
    tag: 'UI',
  },
  {
    id: 'pub-sched-1',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Home Page',
    title: 'Weekly Fellowship Service Timetable',
    description: `The weekly schedule shows when ECCF meets on Sunday, Wednesday, and Friday.

How to test:
1. Scroll down the Home page to the "Weekly Encounters" section.
2. Notice that the tabs (Sunday Service, Wednesday Bible Study, Friday Academic Challenge) auto-switch every few seconds.
3. Click on "Wednesday Bible Study" manually — confirm the time (04:50 PM), venue (NLT 5), and topic tags appear immediately.`,
    tag: 'UI',
  },
  {
    id: 'pub-sermon-1',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Sermons Vault',
    title: 'Listen on Spotify, YouTube Music, or YouTube Video',
    description: `Every sermon gives listeners 3 convenient ways to enjoy the message.

How to test:
1. Go to the Sermons page (/sermons) and click on any sermon card.
2. Check the 3 buttons: "Listen on Spotify", "Listen on YouTube Music", and "Watch on YouTube".
3. Click each option:
   - Spotify opens the audio player.
   - YouTube Music opens the background music track.
   - YouTube opens the video recording.
4. If a sermon is missing one of the links, that button hides gracefully without breaking the layout.`,
    tag: 'UI',
  },
  {
    id: 'pub-sermon-2',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Sermons Vault',
    title: 'Search Sermons & Topic Filter',
    description: `Members should be able to quickly find messages by preacher, scripture, or topic.

How to test:
1. Go to the Sermons page (/sermons).
2. Type a preacher's name (e.g. "Adebayo") or Bible book into the search box.
3. Confirm the list immediately filters to match what you typed.
4. Click on a topic pill (like "Faith" or "Academics") — confirm only sermons tagged with that topic remain.`,
    tag: 'UI',
  },
  {
    id: 'pub-ann-1',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Announcements',
    title: 'Announcements & Service Notices',
    description: `Church bulletins and urgent notices should be sorted with important announcements pinned to the top.

How to test:
1. Go to the Announcements page (/announcements).
2. Verify that pinned announcements with a pin badge appear at the very top.
3. Check that category tags (Weekly Services, Bible Study, Exams, etc.), event dates, and venues show clearly.`,
    tag: 'UI',
  },
  {
    id: 'pub-ann-2',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Announcements',
    title: 'Subscribe for Sunday Bulletins by Email',
    description: `Students and visitors can enter their email to receive bulletins and event updates.

How to test:
1. Scroll to the subscription box on the Announcements page or in the footer.
2. Enter an invalid email (like "test@") and click Subscribe — confirm a warning asks for a valid email.
3. Enter a valid email and submit — confirm you see a green success message thanking you for subscribing.
4. Try submitting the exact same email again — confirm it politely tells you that you are already subscribed.`,
    tag: 'UI',
  },
  {
    id: 'pub-give-1',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Giving Page',
    title: 'Copy Bank Account Number with One Click',
    description: `The Giving page provides fellowship bank transfer details with an instant copy button.

How to test:
1. Go to the Giving page (/give).
2. Check that the bank name, account name, and 10-digit account number are displayed clearly.
3. Click the "Copy Account Number" button.
4. Look for the green pop-up message saying "Account number copied to clipboard!".
5. Paste (Ctrl+V) into any text box to confirm the copied 10 digits match the account number on screen.`,
    tag: 'UI',
  },
  {
    id: 'pub-visit-1',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Plan a Visit',
    title: 'Plan a Visit & Message on WhatsApp',
    description: `First-time visitors can view directions and message a fellowship representative on WhatsApp.

How to test:
1. Scroll to the "Plan a Visit" section on the Home page (or click "Visit" in the launcher).
2. Check the meeting hall name (NLT 5, Law Faculty, EDSU) and the service times.
3. Click the "Directions" link — confirm it opens Google Maps showing EDSU campus.
4. Click "Chat on WhatsApp" — confirm it opens a WhatsApp chat with a friendly pre-written greeting to the visitor coordinator.`,
    tag: 'UI',
  },
  {
    id: 'pub-about-1',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'About Page',
    title: 'About Page Heritage, Creed & 3 Pillars',
    description: `The About page tells the history of ECCF and introduces its 3 core pillars.

How to test:
1. Go to the About page (/about).
2. Read the history section and confirm the chronological milestone cards (e.g. Genesis, Expansion) load in order.
3. Check the 3 Pillars section: confirm Pillar 1 (Spiritual Dynamites), Pillar 2 (Academic Giants), and Pillar 3 (Kingdom Community) each have title, description, and Bible verses.`,
    tag: 'UI',
  },
  {
    id: 'pub-about-2',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'About Page',
    title: 'Browse All 14 Operational Teams',
    description: `Visitors and new students can explore all 14 ministry teams (Choir, Drama, Ushering, Welfare, etc.).

How to test:
1. Scroll down to the "Operational Teams" section on the About page.
2. Verify that teams have photos, short descriptions, and colored ministry tags.
3. Type "Choir" or "Usher" in the search box — confirm it filters to matching teams instantly.`,
    tag: 'UI',
  },
  {
    id: 'pub-about-3',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'About Page',
    title: 'Public Leadership Cards (No Private Phone/Room Leak)',
    description: `Leaders (Patrons, Pastor, CSGB, Hall Pastors) should be shown proudly without exposing their personal room numbers or phone numbers.

How to test:
1. Scroll to the "Servant Leaders" section on the About page (/about).
2. Confirm leader portraits, names, offices, and short bios display cleanly.
3. Verify there are NO personal phone numbers, hostel room numbers, or personal emails anywhere on these cards.`,
    tag: 'Security',
  },
  {
    id: 'pub-gallery-1',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Photo Gallery',
    title: 'Photo Gallery & Full-Screen Zoom',
    description: `The photo gallery shows real moments of student prayer, worship, and academic fellowship.

How to test:
1. Go to the photo gallery on the Home page or About page.
2. Click on category filter buttons (e.g. "Sunday Service", "Student Life", "Prayer Night").
3. Click any photo — confirm it opens in a large, clear full-screen preview with its caption. Click outside or tap X to close.`,
    tag: 'UI',
  },
  {
    id: 'pub-footer-1',
    suiteId: 1,
    suiteName: '1. Public Website & Media',
    section: 'Footer Directory',
    title: 'Website Footer Links & Badges',
    description: `The bottom of every page provides helpful directory links, meeting badges, and contact details.

How to test:
1. Scroll to the bottom of any page.
2. Check that the official contact email (edsuchristiancampusfellowship@gmail.com) and social media icons (YouTube, Instagram, Facebook, TikTok, Telegram) are present.
3. Confirm the copyright line displays the current year automatically.`,
    tag: 'UI',
  },

  // =========================================================================
  // SUITE 2: Forms & Applications (Connect & Register)
  // =========================================================================
  {
    id: 'sec-connect-1',
    suiteId: 2,
    suiteName: '2. Forms & Applications (Connect & Register)',
    section: 'Connect Form',
    title: 'First-Timer Visitor Form Validation',
    description: `Ensure new visitors can easily submit their contact and campus details on /connect.

How to test:
1. Go to the Connect page (/connect).
2. Try submitting with an empty form — confirm it stops you and highlights required fields.
3. Fill in your name, valid phone number (080...), select your residence hall (Hall 1–8), department, and study level.
4. Complete the security bot check (Turnstile checkbox) and submit.
5. Confirm a warm success message welcomes you to the fellowship.`,
    tag: 'Intake',
  },
  {
    id: 'sec-connect-2',
    suiteId: 2,
    suiteName: '2. Forms & Applications (Connect & Register)',
    section: 'Connect Form',
    title: 'Visitor Phone & Room Privacy (Encryption)',
    description: `Visitor contact numbers and hostel rooms must be scrambled in the database so private info cannot be read by anyone unauthorized.

How to test:
1. Submit a test visitor entry on /connect.
2. Open the Sanity Studio (or check with the database team).
3. Confirm that the phone number and room number appear as scrambled code (e.g. "enc:v1:...") and NEVER as plain readable text.`,
    tag: 'Security',
  },
  {
    id: 'sec-connect-3',
    suiteId: 2,
    suiteName: '2. Forms & Applications (Connect & Register)',
    section: 'Connect Form',
    title: 'Intake Duplicate Matching (Blind Index)',
    description: `The system recognizes returning visitors by their phone number without decrypting the entire database.

How to test:
1. Submit a visitor form with a test phone number.
2. In the database record, verify a secret "phoneBlindIndex" field was created (e.g. "bidx:v1:...").
3. This allows the fellowship team to connect follow-up records securely.`,
    tag: 'Security',
  },
  {
    id: 'sec-welf-intake-1',
    suiteId: 2,
    suiteName: '2. Forms & Applications (Connect & Register)',
    section: 'Welfare Desk',
    title: 'Student Welfare Assistance Request',
    description: `Students facing financial, academic, or medical hardship can confidentially ask for fellowship support.

How to test:
1. Open the Welfare Request form on /connect.
2. Fill in your name, phone number, and a brief description of the need.
3. Submit the form — verify you get a reassuring confirmation message that the Welfare & Medical team will reach out privately.`,
    tag: 'Intake',
  },
  {
    id: 'sec-prayer-intake-1',
    suiteId: 2,
    suiteName: '2. Forms & Applications (Connect & Register)',
    section: 'Prayer Ministry',
    title: 'Confidential Prayer Request Submission',
    description: `Students can submit personal prayer points to the Intercessory team with or without their name.

How to test:
1. Open the Prayer Request tab on /connect.
2. Enter a prayer request, leave the name blank (or type "Anonymous"), and submit.
3. Verify the confirmation message confirms your prayer request has been received by the intercessors.`,
    tag: 'Intake',
  },
  {
    id: 'sec-reg-1',
    suiteId: 2,
    suiteName: '2. Forms & Applications (Connect & Register)',
    section: 'Worker Registration',
    title: 'Passwordless Worker Registration (Step-by-Step)',
    description: `Volunteer workforce registration has NO passwords. It guides new volunteers through simple, friendly steps.

How to test:
1. Open the registration page (/register).
2. Verify there are NO password fields on the form.
3. Walk through the steps: Step 1 (Phone number), Step 2 (Name & Email), Step 3 (Select Teams), Step 4 (Hall & Room), Step 5 (Birthday).
4. Confirm the progress bar advances smoothly on each step.`,
    tag: 'UI',
  },
  {
    id: 'sec-reg-2',
    suiteId: 2,
    suiteName: '2. Forms & Applications (Connect & Register)',
    section: 'Worker Registration',
    title: 'Join Multiple Ministry Teams (teams[])',
    description: `Volunteers can join more than one team (e.g. singing in the Choir and helping with Ushering).

How to test:
1. On /register, proceed to the "Select Your Teams" step.
2. Select "Choir Team" and also select "Ushering Team".
3. Confirm both team badges light up in blue.
4. Verify that you can select which of the two is your Primary Team.`,
    tag: 'Intake',
  },
  {
    id: 'sec-reg-3',
    suiteId: 2,
    suiteName: '2. Forms & Applications (Connect & Register)',
    section: 'Worker Registration',
    title: 'Birthday Privacy (Month & Day Only — No Birth Year)',
    description: `To protect student privacy and avoid age discrimination, the fellowship only asks for birth month and day (no birth year).

How to test:
1. On /register, reach the Birthday step.
2. Verify the form asks ONLY for Month (e.g. "May") and Day (e.g. "18").
3. Confirm there is NO field asking for birth year or age.
4. Verify you can only pick valid days (e.g. February only allows up to 29).`,
    tag: 'Security',
  },
  {
    id: 'sec-reg-4',
    suiteId: 2,
    suiteName: '2. Forms & Applications (Connect & Register)',
    section: 'Worker Registration',
    title: 'Apply for an Executive Position (Exco Toggle)',
    description: `Appointed leaders (CSGB officers, Hall Pastors, Team Leads) can apply for their official office during registration.

How to test:
1. On /register, reach the Leadership Designation step.
2. Switch the "Are you an Executive Leader?" toggle to YES.
3. Verify the 3 leadership options appear:
   - CSGB Central Office (President, VP Admin, VP Evangelism, General Secretary)
   - Hall Pastor (choose Hall 1–8 and Lead or Assistant)
   - Team Leader (choose Ministry Team and Lead or Assistant)
4. Note the reminder: Finance access is granted only by being appointed Finance Lead or Assistant.`,
    tag: 'Intake',
  },
  {
    id: 'sec-reg-5',
    suiteId: 2,
    suiteName: '2. Forms & Applications (Connect & Register)',
    section: 'Worker Registration',
    title: 'Upload Birthday Profile Photo with Automatic Resize',
    description: `Upload a birthday portrait. The site automatically shrinks large photos so they upload fast even on slow campus Wi-Fi/data.

How to test:
1. On the photo upload step of /register, select a high-resolution photo from your phone or computer.
2. Confirm an instant circular photo preview appears on screen.
3. Submit the registration — verify the photo uploads smoothly without error or freezing.`,
    tag: 'Security',
  },
  {
    id: 'sec-reg-6',
    suiteId: 2,
    suiteName: '2. Forms & Applications (Connect & Register)',
    section: 'Worker Registration',
    title: 'Security Bot Check (Cloudflare Turnstile)',
    description: `Prevents spam robots from flooding the fellowship database with fake registrations.

How to test:
1. At the final review step of /register, observe the security check box.
2. If you try to submit without passing the check, verify a friendly message prompts you to complete the security check first.`,
    tag: 'Security',
  },
  {
    id: 'sec-reg-7',
    suiteId: 2,
    suiteName: '2. Forms & Applications (Connect & Register)',
    section: 'Status Tracking',
    title: 'Check Application & Approval Status Live (/register/status)',
    description: `Volunteers can track whether their team membership or executive appointment has been approved.

How to test:
1. Go to the Status page (/register/status).
2. Type your registered phone number or email and click the Search magnifying glass.
3. Verify your profile card appears showing:
   - Your operational teams and their status ("Pending Verification" or "Verified").
   - Your leadership office and its status ("Pending Presidential Approval" or "Approved").`,
    tag: 'UI',
  },
  {
    id: 'sec-reg-8',
    suiteId: 2,
    suiteName: '2. Forms & Applications (Connect & Register)',
    section: 'Self-Service',
    title: 'Returning Worker Profile Unlock (6-Digit Email Code)',
    description: `Already registered workers can unlock and edit their hostel room or phone number using a quick 6-digit code sent to their email.

How to test:
1. Go to /register and click "Already registered? Update your profile".
2. Enter your registered email address and click "Send Verification Code".
3. Check your email inbox for the 6-digit code.
4. Enter the code on screen — confirm your existing profile unlocks with your information filled in, ready for updates.`,
    tag: 'Recovery',
  },

  // =========================================================================
  // SUITE 3: Sign In & Mobile App Experience
  // =========================================================================
  {
    id: 'auth-clerk-1',
    suiteId: 3,
    suiteName: '3. Sign In & Mobile App Experience',
    section: 'Authentication',
    title: 'Passwordless Leader Sign In (/login)',
    description: `Fellowship leaders sign in using their verified email address without memorizing passwords.

How to test:
1. Go to the Leader Login page (/login).
2. Enter your registered leader email.
3. Check your email for the magic link or 6-digit code from Clerk.
4. Complete the code prompt — confirm you are immediately signed in and taken to the Leader Dashboard (/dashboard).`,
    tag: 'RBAC',
  },
  {
    id: 'auth-clerk-2',
    suiteId: 3,
    suiteName: '3. Sign In & Mobile App Experience',
    section: 'Authentication',
    title: 'Automatic Account Linking',
    description: `When a leader signs in with Clerk, the system automatically matches their email to their church worker record.

How to test:
1. Sign in with your approved leader email.
2. Check the top bar of the dashboard: confirm your full name, residence hall, and executive title appear correctly.
3. This confirms your login account is linked to your church profile.`,
    tag: 'Security',
  },
  {
    id: 'auth-clerk-3',
    suiteId: 3,
    suiteName: '3. Sign In & Mobile App Experience',
    section: 'Route Guard',
    title: 'Secret Route Protection (Middleware Guard)',
    description: `Unauthenticated strangers cannot peek at leader pages by typing dashboard URLs into their browser.

How to test:
1. Open an Incognito / Private browser window.
2. Type the address: http://localhost:3000/dashboard/workers (or the live URL).
3. Press Enter — verify the site immediately bounces you to the /login page and does NOT show any church member data.`,
    tag: 'Security',
  },
  {
    id: 'auth-clerk-4',
    suiteId: 3,
    suiteName: '3. Sign In & Mobile App Experience',
    section: 'Route Guard',
    title: 'Old Login URL Redirect',
    description: `If someone clicks an old link to /dashboard/login, it smoothly redirects them to /login without any error page.

How to test:
1. In your browser address bar, type: /dashboard/login.
2. Press Enter — confirm the browser cleanly lands on /login without an infinite loading loop.`,
    tag: 'Security',
  },
  {
    id: 'auth-clerk-5',
    suiteId: 3,
    suiteName: '3. Sign In & Mobile App Experience',
    section: 'Development Tools',
    title: 'Tester Fast Role Switcher (For Development & QA)',
    description: `Allows testers in development mode to quickly test the website as an Admin, Team Lead, Hall Rep, or Finance Secretary.

How to test:
1. In dev/testing mode, look for the role switcher banner or cookie setting (eccf-dev-role).
2. Switch role from "CSGB Admin" to "Hall Rep".
3. Refresh the page — confirm the sidebar options change immediately to match a Hall Rep's limited permissions.`,
    tag: 'RBAC',
  },
  {
    id: 'auth-pwa-1',
    suiteId: 3,
    suiteName: '3. Sign In & Mobile App Experience',
    section: 'Mobile App Experience',
    title: 'Install Portal as a Mobile App (PWA)',
    description: `Leaders can install the portal onto their Android or iPhone home screen like a native mobile app.

How to test:
1. Open the portal in Chrome on Android or Safari on iPhone.
2. Tap the browser menu (or Share icon on iOS) and tap "Add to Home Screen" / "Install App".
3. Confirm the ECCF crest icon appears on your phone's home screen.
4. Tap the icon — confirm the portal opens in full-screen mode without browser address bars.`,
    tag: 'PWA',
  },

  // =========================================================================
  // SUITE 4: Roles & Permissions (Who Can See What)
  // =========================================================================
  {
    id: 'rbac-pres-1',
    suiteId: 4,
    suiteName: '4. Roles & Permissions (Who Can See What)',
    section: 'Presidential Governance',
    title: 'Fellowship President Authority (Executive Console)',
    description: `Only the Fellowship President can access the Executive Approval Console to approve executive officers.

How to test:
1. Sign in as the Fellowship President.
2. Look at the left sidebar menu: confirm the "Executive Approvals" menu item is visible.
3. Click it — verify the approval console opens showing pending applicants.`,
    tag: 'RBAC',
  },
  {
    id: 'rbac-pres-2',
    suiteId: 4,
    suiteName: '4. Roles & Permissions (Who Can See What)',
    section: 'Presidential Governance',
    title: 'President Backup Verification for Any Team',
    description: `As the spiritual shepherd, the President can step in and verify workers for any ministry team if a Team Lead is unavailable.

How to test:
1. Sign in as the President and go to the Workers page (/dashboard/workers).
2. Find a pending worker from any team (e.g. Media, Choir, or Drama).
3. Click "Approve" — confirm the action succeeds without permission errors.`,
    tag: 'RBAC',
  },
  {
    id: 'rbac-csgb-1',
    suiteId: 4,
    suiteName: '4. Roles & Permissions (Who Can See What)',
    section: 'CSGB Admin',
    title: 'CSGB Admin Full Access (All 8 Modules)',
    description: `CSGB administrators (President, VPs, General Secretary) have full access to manage all fellowship areas.

How to test:
1. Sign in as a CSGB Admin.
2. Check the sidebar: confirm you can access Workers, First-Timers, Attendance, Finance, Welfare, Prayer Requests, Announcements, and Sermons.`,
    tag: 'RBAC',
  },
  {
    id: 'rbac-lead-1',
    suiteId: 4,
    suiteName: '4. Roles & Permissions (Who Can See What)',
    section: 'Team Leadership',
    title: 'Team Leader Scoped View (Own Team Only)',
    description: `Team Leaders (e.g., Choir Director) only see and verify volunteers applying to their own team.

How to test:
1. Sign in as the Choir Team Leader.
2. Go to the Workers page (/dashboard/workers).
3. Confirm you see only Choir members and Choir applicants.
4. Volunteers from Drama, Ushering, or Media should NOT appear in your pending approval list.`,
    tag: 'RBAC',
  },
  {
    id: 'rbac-hall-1',
    suiteId: 4,
    suiteName: '4. Roles & Permissions (Who Can See What)',
    section: 'Hall Representation',
    title: 'Hall Representative Scoped View (Own Hall Only)',
    description: `Hall Reps (e.g., Hall 2 Rep) only see workers and new visitors who live in their specific residence hall.

How to test:
1. Sign in as the Hall 2 Representative.
2. Open Workers and First-Timers pages.
3. Verify that every single student in your list has "Hall 2" as their residence.
4. Students living in Hall 1, Hall 3, etc. must not be displayed.`,
    tag: 'RBAC',
  },
  {
    id: 'rbac-fin-1',
    suiteId: 4,
    suiteName: '4. Roles & Permissions (Who Can See What)',
    section: 'Finance Treasury',
    title: 'Financial Secretary Isolation (Money Matters Only)',
    description: `The Financial Secretary can only view financial records and cannot access private member CRM or welfare records.

How to test:
1. Sign in as the Financial Secretary.
2. Check the sidebar: confirm only "Overview" and "Finance Ledger" appear.
3. Try typing /dashboard/workers directly in the browser address bar.
4. Confirm the site blocks you with an "Access Denied" notification and redirects to overview.`,
    tag: 'RBAC',
  },
  {
    id: 'rbac-welf-1',
    suiteId: 4,
    suiteName: '4. Roles & Permissions (Who Can See What)',
    section: 'Welfare Ministry',
    title: 'Welfare Coordinator Access',
    description: `The Welfare & Medical Coordinator has access to student welfare requests to coordinate care and aid.

How to test:
1. Sign in as Welfare Coordinator.
2. Verify "Student Welfare" is visible in the sidebar menu.
3. Open the page — confirm you can view open student requests and mark them resolved.`,
    tag: 'RBAC',
  },
  {
    id: 'rbac-media-1',
    suiteId: 4,
    suiteName: '4. Roles & Permissions (Who Can See What)',
    section: 'Media Ministry',
    title: 'Media Coordinator Permissions',
    description: `Media Coordinators have access to sermon podcasts, announcement broadcasts, and the birthday directory.

How to test:
1. Sign in as Media Coordinator.
2. Confirm you can access the Sermons page (with the "Sync Sermons Now" button) and the Announcements publisher.
3. On the Workers page, verify you can view worker birthdays to design celebratory campus flyers.`,
    tag: 'RBAC',
  },

  // =========================================================================
  // SUITE 5: Leader Dashboard & Daily Tasks
  // =========================================================================
  {
    id: 'mod-exec-1',
    suiteId: 5,
    suiteName: '5. Leader Dashboard & Daily Tasks',
    section: 'Executive Console',
    title: 'Review Pending Executive Applications',
    description: `In the Presidential Console, applications are neatly organized into tabs for easy review.

How to test:
1. As President, open the Executive Approvals page (/dashboard/executives).
2. Click the tabs: "CSGB Offices", "Hall Pastors", and "Ministry Team Leads".
3. Confirm each card displays the student's name, email, residence hall, applied office, and submission date.`,
    tag: 'UI',
  },
  {
    id: 'mod-exec-2',
    suiteId: 5,
    suiteName: '5. Leader Dashboard & Daily Tasks',
    section: 'Executive Console',
    title: '1-Tap Executive Approval & Automatic Team Verification',
    description: `When the President approves an executive, their leadership status is confirmed, and if they lead a team, their team membership is verified automatically.

How to test:
1. On /dashboard/executives, find a pending Team Lead application (e.g. Music Director).
2. Click the green "Approve" button.
3. Confirm the card switches to "Approved" and moves to the approved list.
4. Check that worker's profile on the Workers page: verify their Choir team membership is now marked "Verified" automatically!`,
    tag: 'RBAC',
  },
  {
    id: 'mod-work-1',
    suiteId: 5,
    suiteName: '5. Leader Dashboard & Daily Tasks',
    section: 'Workforce CRM',
    title: 'Readable Worker Contacts (Decrypted View for Leaders)',
    description: `Authorized leaders see clear, readable phone numbers and hostel rooms (no scrambled code).

How to test:
1. Open the Workers page (/dashboard/workers).
2. Check the table or worker cards: confirm phone numbers (080...), room numbers, and birthdays display in clean, normal English.
3. Confirm there is no ugly scrambled text like "[Encrypted Data]" on screen.`,
    tag: 'UI',
  },
  {
    id: 'mod-work-2',
    suiteId: 5,
    suiteName: '5. Leader Dashboard & Daily Tasks',
    section: 'Workforce CRM',
    title: 'Approve or Decline a Volunteer Worker',
    description: `Team Leads can accept new volunteers onto their roster or decline non-members with one tap.

How to test:
1. Go to /dashboard/workers and click the "Pending" tab.
2. Click the green "Approve" button on a pending volunteer.
3. Confirm their status badge turns green ("Verified") immediately.
4. Try the red "Decline" button on a test record — confirm status turns red ("Declined").`,
    tag: 'RBAC',
  },
  {
    id: 'mod-work-3',
    suiteId: 5,
    suiteName: '5. Leader Dashboard & Daily Tasks',
    section: 'Workforce CRM',
    title: 'Send Email to a Church Worker',
    description: `Leaders can compose and send official fellowship email notices directly to any worker.

How to test:
1. Find any worker on the Workers page and click the "Send Email" envelope icon.
2. In the pop-up modal, type a test subject and brief message.
3. Click "Send Email" — verify a success notification confirms the message was dispatched via Resend.`,
    tag: 'UI',
  },
  {
    id: 'mod-att-1',
    suiteId: 5,
    suiteName: '5. Leader Dashboard & Daily Tasks',
    section: 'Attendance Ledger',
    title: 'Record Service Attendance (Quick Count or Full Roster)',
    description: `Ushering and secretariat can record Sunday attendance either as a fast headcount or by ticking names.

How to test:
1. Go to the Attendance page (/dashboard/attendance) and click "Record Attendance".
2. Try "Quick Headcount" mode: type in the total number of attendees, select the service type (e.g. Sunday Service), and save.
3. Confirm the new record appears on the page and the attendance graph updates immediately.`,
    tag: 'UI',
  },
  {
    id: 'mod-fin-1',
    suiteId: 5,
    suiteName: '5. Leader Dashboard & Daily Tasks',
    section: 'Finance Ledger',
    title: 'Enter Income & Expenses and Download CSV',
    description: `Record tithes, offerings, and utility expenses, and export financial summaries to Excel/CSV.

How to test:
1. Go to the Finance page (/dashboard/finance) and click "Record Transaction".
2. Choose "Income", category "Tithe", enter amount (e.g. 5000), and add a brief description.
3. Save the entry — confirm amount shows in Naira formatting (₦5,000) and the total balance updates.
4. Click "Export CSV" — confirm a spreadsheet file downloads with all transactions.`,
    tag: 'UI',
  },
  {
    id: 'mod-welf-1',
    suiteId: 5,
    suiteName: '5. Leader Dashboard & Daily Tasks',
    section: 'Welfare Desk',
    title: 'Resolve Student Welfare Requests',
    description: `Welfare leaders review student needs, call them directly, and mark requests resolved once assisted.

How to test:
1. Open the Welfare page (/dashboard/welfare).
2. On a pending request, click the phone number — confirm your phone dials the student.
3. After providing assistance, click "Mark Resolved".
4. Confirm the status pill switches from yellow "Pending" to green "Resolved".`,
    tag: 'UI',
  },
  {
    id: 'mod-ft-1',
    suiteId: 5,
    suiteName: '5. Leader Dashboard & Daily Tasks',
    section: 'First-Timers Desk',
    title: 'Follow Up with First-Time Visitors on WhatsApp',
    description: `Hall Pastors and outreach workers can warmly welcome first-time visitors with one tap on WhatsApp.

How to test:
1. Open the First-Timers page (/dashboard/first-timers).
2. Find a new visitor and click the green "WhatsApp" button on their row.
3. Confirm WhatsApp opens with a pre-written pastoral greeting welcoming them to ECCF and asking how their first visit was.`,
    tag: 'UI',
  },
  {
    id: 'mod-ann-1',
    suiteId: 5,
    suiteName: '5. Leader Dashboard & Daily Tasks',
    section: 'Announcements Manager',
    title: 'Publish Announcement & Email Subscribers',
    description: `Leaders can publish new Sunday notices and automatically email them to all newsletter subscribers.

How to test:
1. Go to the Announcements page (/dashboard/announcements) and click "New Announcement".
2. Type a title, select a category, and write the bulletin text.
3. Leave "Broadcast to email subscribers on publish" checked and click Publish.
4. Verify the announcement goes live on the public site and email delivery begins.`,
    tag: 'UI',
  },
  {
    id: 'mod-sermon-1',
    suiteId: 5,
    suiteName: '5. Leader Dashboard & Daily Tasks',
    section: 'Sermons Vault',
    title: 'Trigger Manual Sermon Sync from Top Bar',
    description: `Media leaders can force an immediate sync from Spotify and YouTube without waiting for the automatic schedule.

How to test:
1. Go to /dashboard/sermons (or look at the dashboard header top bar).
2. Click the "Sync Sermons Now" button with the refresh icon.
3. Look for the notification banner confirming the sync started and showing how many new episodes were added.`,
    tag: 'UI',
  },

  // =========================================================================
  // SUITE 6: External Services, Emails & Safety
  // =========================================================================
  {
    id: 'int-draft-1',
    suiteId: 6,
    suiteName: '6. External Services, Emails & Safety',
    section: 'Data Safety',
    title: 'Verify Public Database Privacy (Zero Leak Test)',
    description: `Check that all private church records (workers, attendance, money, welfare) are locked and invisible to public web searchers.

How to test:
1. Open an unauthenticated web query or check with the developer.
2. An anonymous probe to the public database must return EXACTLY 0 operational records.
3. All sensitive church documents are securely stored as private drafts that only logged-in leaders can access.`,
    tag: 'Security',
  },
  {
    id: 'int-rss-1',
    suiteId: 6,
    suiteName: '6. External Services, Emails & Safety',
    section: 'Podcast Automation',
    title: 'Automatic Sermon Ingestion (No Duplicates)',
    description: `When sermons are uploaded to Spotify, the site automatically adds them without creating duplicate entries.

How to test:
1. Run the sermon sync twice in a row.
2. Check the Sermons page: confirm that existing sermons are NOT duplicated, keeping the vault clean and orderly.`,
    tag: 'Security',
  },
  {
    id: 'int-resend-1',
    suiteId: 6,
    suiteName: '6. External Services, Emails & Safety',
    section: 'Email Delivery',
    title: 'Official Email Delivery & Unsubscribe Link',
    description: `Ensure emails arrive promptly with official ECCF branding and a functioning unsubscribe link.

How to test:
1. Request a verification code or trigger a bulletin announcement to your test email.
2. Open the email in your inbox: check that the ECCF header logo, clean styling, and sender address look professional.
3. Scroll to the bottom and click "Unsubscribe" — verify it confirms your preference.`,
    tag: 'Security',
  },
  {
    id: 'int-drive-1',
    suiteId: 6,
    suiteName: '6. External Services, Emails & Safety',
    section: 'Media Pipeline',
    title: 'Safe Photo Uploads to Google Drive',
    description: `Protects the website from huge files or dangerous uploads when members submit photos.

How to test:
1. Try uploading a non-image file (e.g. a .pdf or .exe) on the photo upload step — confirm the form rejects it.
2. Upload a normal picture — confirm it uploads safely and returns a secure Google Drive preview link.`,
    tag: 'Security',
  },
  {
    id: 'int-preview-1',
    suiteId: 6,
    suiteName: '6. External Services, Emails & Safety',
    section: 'Sanity Content Studio',
    title: 'Live Web Preview in Content Studio',
    description: `Church editors in Sanity Studio can see a live split-screen preview of how their announcement or sermon will look on the real website before saving.

How to test:
1. Open the Sanity Studio (https://eccf-backend.sanity.studio).
2. Open any announcement or sermon and click the "Live Web Preview" tab on the right side.
3. Confirm an interactive live preview of the website renders right beside your editing form!`,
    tag: 'UI',
  },
]
