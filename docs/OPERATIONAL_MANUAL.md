# ECCF Central Platform — Master Operational Manual
**Edo State University Christian Campus Fellowship (ECCF)**  
*Edo State University Uzairue / Iyamho (ESUI)*  
*Version 1.0 — Comprehensive Guide for Leaders, Workers, Media Stewards, and Fellowship Members*

---

## Table of Contents
1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Chapter 1: Fellowship Members & General Students (Public Website & PWA)](#chapter-1-fellowship-members--general-students-public-website--pwa)
3. [Chapter 2: Fellowship Workers & Volunteer Onboarding](#chapter-2-fellowship-workers--volunteer-onboarding)
4. [Chapter 3: President & Central Student Governing Board (CSGB)](#chapter-3-president--central-student-governing-board-csgb)
5. [Chapter 4: Media Team & Content Stewards (Sanity Studio & Sermons)](#chapter-4-media-team--content-stewards-sanity-studio--sermons)
6. [Chapter 5: Team Leaders & Assistant Leads (14 Ministry Teams)](#chapter-5-team-leaders--assistant-leads-14-ministry-teams)
7. [Chapter 6: Hall Representatives (Hostel / Campus Residence Pastors)](#chapter-6-hall-representatives-hostel--campus-residence-pastors)
8. [Chapter 7: Financial Secretary & Finance Team](#chapter-7-financial-secretary--finance-team)
9. [Chapter 8: Outreach, Evangelism & Follow-up Team](#chapter-8-outreach-evangelism--follow-up-team)
10. [Chapter 9: Intercessory Prayer Team](#chapter-9-intercessory-prayer-team)
11. [Chapter 10: Welfare & Medical Team](#chapter-10-welfare--medical-team)
12. [Chapter 11: Ushering Team (Headcount & Statistics)](#chapter-11-ushering-team-headcount--statistics)
13. [Chapter 12: Technical Administrators & Platform Engineers](#chapter-12-technical-administrators--platform-engineers)
14. [Appendix A: Role-Based Access Control (RBAC) Matrix](#appendix-a-role-based-access-control-rbac-matrix)
15. [Appendix B: Route & URL Directory](#appendix-b-route--url-directory)
16. [Appendix C: Operational Troubleshooting & FAQ](#appendix-c-operational-troubleshooting--faq)

---

## 1. Executive Summary & System Architecture

The ECCF Central Platform is a unified digital ecosystem designed to support the spiritual and academic mission of the **Edo State University Christian Campus Fellowship (ECCF)**: *"Jesus in our hearts, letters in our heads."*

The ecosystem consists of four interconnected layers:

```mermaid
flowchart TD
    subgraph Public["Public Layer (eccf-frontend)"]
        Web["Public Web Portal & PWA\n(Home, About, Sermons, Connect, Give)"]
        WorkerReg["Worker Registration & Status Tracker\n(/register & /register/status)"]
    end

    subgraph Auth["Identity Layer (Clerk)"]
        Clerk["Clerk Passwordless Authentication\n(Magic Links, Email/SMS OTP, Session Tokens)"]
    end

    subgraph Dashboard["Executive Management Layer (eccf-frontend /dashboard)"]
        ExcoDash["Role-Based Exco Dashboard\n(Execs, Workers, Attendance, Finance, Welfare)"]
    end

    subgraph Backend["Content & Operational Storage (eccf-backend)"]
        SanityStudio["Sanity Studio CMS\n(eccf-backend.sanity.studio)\n[Media Team & Content Admins]"]
        SanityDrafts["Sanity Drafts Operational Boundary\n(Encrypted Worker CRM, Finance, Intake)"]
    end

    Web -->|Unauthenticated Read| SanityStudio
    WorkerReg -->|Public Intake (Encrypted)| SanityDrafts
    Clerk -->|RBAC Session Bridge| ExcoDash
    ExcoDash -->|Authenticated Read/Write Token| SanityDrafts
    SanityStudio -->|Live Web Preview Split Pane| Web
```

### Core Security & Privacy Safeguards
1. **Zero Public Leakage (Operational Drafts Boundary):** All sensitive fellowship records (worker contact details, financial logs, attendance names, first-timer phone numbers, welfare requests) are stored in Sanity's private operational draft space. Public queries only retrieve published content (sermons, announcements, about info).
2. **Field-Level AES-256-GCM Encryption:** Phone numbers and hostel room numbers are encrypted at rest using military-grade cryptography before hitting the database.
3. **One-Way HMAC-SHA256 Blind Indexing:** Allows deduplication and lookup of worker profiles without storing searchable plain-text contact numbers.
4. **Strict Role-Based Access Control (RBAC):** Every dashboard route and server action verifies user role and assigned ministry before granting access.

---

## Chapter 1: Fellowship Members & General Students (Public Website & PWA)

Every student, alumnus, and campus visitor interacts with the public website at `https://eccf-frontend.vercel.app` (or custom domain).

### 1.1 Homepage (`/`)
- **Next Service Status Pill:** Located prominently at the top of the hero section, highlighting the upcoming campus gathering (e.g., *"NEXT UP • Sunday 08:00 AM • NLT 5 Law Auditorium"*).
- **Hero Mission Creed:** Displays the core fellowship manifesto and theme for the academic session.
- **Formula 4 Photo Collage:** Visual mosaic showcasing authentic moments across five pillars: Worship, Academics, Choir, Prayer, and Christian Community.
- **Weekly Schedule Bar:** Quick glance at weekly meeting days, start times, and campus auditoriums.
- **Latest Announcements Ticker:** Highlights pinned Sunday bulletins and academic exam prayer notices.

### 1.2 About Page (`/about`)
- **Mission & Vision:** Reading the spiritual mandate for Edo State University.
- **Our Story & Heritage:** Chronological narrative tracing ECCF's foundation from early hostel fellowships in Iyamho to a university-wide powerhouse.
- **Pillars of Faith:** Foundational doctrinal beliefs and values.
- **Executive Leadership Roster:** Public directory of CSGB leaders, campus pastors, and directors.
- **Operational Teams Directory:** Information on the 14 ministry teams and how they operate.

### 1.3 Sermon Vault (`/sermons`)
- **Multi-Platform Player (ADR-002):** Listen to messages directly on the website or seamlessly switch to **Spotify**, **YouTube**, or **YouTube Music** with one click.
- **Search & Filters:** Search sermons by title, scripture reference, preacher, series (e.g., *Campus Revival Series*), or topical tags (e.g., *Purity*, *Faith*, *Academic Excellence*).
- **Audio Download & Notes:** Download offline MP3s and read key scripture anchors.

### 1.4 Sunday Announcements Hub (`/announcements`)
- **Category Filtering:** Filter announcements by:
  - `WEEKLY SERVICES`
  - `ACADEMIC & EXAMS`
  - `BIBLE STUDY`
  - `EXCO UPDATES`
  - `GENERAL ANNOUNCEMENTS`
- **Pinned Notices:** Urgent notifications (e.g., venue shifts, examination prayer schedules) stay pinned to the top.
- **Subscribe to Broadcasts:** Input email address to receive immediate newsletter alerts when new announcements are published.

### 1.5 Connect Hub (`/connect`)
A single digital portal for all student intake:
1. **First-Timers Form:** For freshers or visiting students attending their first service. Captures name, department, level, hall of residence, and date visited.
2. **Prayer Request Form:** A confidential channel to submit personal burdens, academic anxieties, family matters, or healing petitions directly to the pastoral intercessors.
3. **Welfare Request Form:** Confidential request channel for students facing emergency health, nutrition, or academic material challenges.
4. **Join a Team:** Direct link to the worker registration intake.

### 1.6 Online Giving & Stewardship (`/give`)
- **Online Giving via Flutterwave:** Secure online debit card, USSD, or direct bank payment for Tithes, Offerings, Project Levies, and Welfare Love Offerings. Instant automated receipt verification.
- **Direct Bank Transfer Details:** Displays the verified ECCF fellowship bank account numbers, bank name, and official transfer narration guidance.
- **Financial Integrity Assurance:** Explicitly states how fellowship funds are stewarded under the supervision of the CSGB and Financial Secretary.

### 1.7 Installing the Progressive Web App (PWA)
- **Android:** Tap the *"Install App"* banner or Chrome menu `⋮` -> *"Add to Home screen"*.
- **iOS (iPhone/iPad):** Open Safari, tap the Share icon `⎙`, scroll down and tap *"Add to Home Screen"*.
- **Benefits:** Instant launch like a native mobile app, zero app store download required, fast offline caching for announcements and weekly schedules.

---

## Chapter 2: Fellowship Workers & Volunteer Onboarding

### 2.1 Registering as a Worker (`/register`)
Any student desiring to serve God in ECCF must register through the official worker intake portal.

#### Step-by-Step Registration Instructions:
1. Navigate to `/register` on the website.
2. **Personal Information:**
   - Full Name (First Name, Middle Name, Last Name).
   - Valid University Email and Phone Number.
   - Date of Birth (Day and Month used for fellowship birthday celebrations).
3. **Academic & Residence Details:**
   - Academic Department and Current Level (e.g., *100L, 200L, 300L, 400L, 500L*).
   - Hall of Residence (e.g., *Hall 1, Hall 2, Hall 3, Off-Campus*).
   - Room Number (encrypted immediately upon submission).
4. **Team Selection (Multi-Team Membership):**
   - Select your Primary Ministry Team (e.g., *Choir, Ushering, Media, Technical, Welfare*).
   - Optionally select secondary teams if you serve in multiple units.
5. **Executive Application (Optional):**
   - If applying for an executive office (e.g., *CSGB Office, Hall Pastor, Team Lead, Assistant Team Lead*), select the desired position and category.
6. **Submit:** Click **"Complete Worker Registration"**.
   - Your details are encrypted.
   - Your membership is routed to your Team Leader for verification.
   - If you applied for an executive post, your application is routed to the President's console.

### 2.2 Tracking Your Application Status (`/register/status`)
Applicants can check their approval status anytime without needing a password:
1. Navigate to `/register/status`.
2. Enter the phone number used during registration.
3. Receive a **6-digit One-Time PIN (OTP)**.
4. Enter the verification code.
5. **View Status:**
   - **Team Membership:** Shows whether your Team Leader has marked you as `Pending`, `Verified`, or `Rejected`.
   - **Executive Position:** Shows whether the President has marked your nomination as `Pending`, `Approved`, or `Rejected`.

### 2.3 Worker Dashboard Sign-In (`/login`)
Once approved as an executive, team lead, or hall rep:
1. Navigate to `/login`.
2. Enter your registered email address or phone number.
3. Clerk will send a passwordless Magic Link or 6-digit verification code.
4. Complete authentication to access your role-specific dashboard views.

---

## Chapter 3: President & Central Student Governing Board (CSGB)

The President and CSGB executives hold central oversight over all fellowship operations, student governance, and executive nominations.

### 3.1 Overview Dashboard (`/dashboard`)
- **Key Metrics Bar:** Real-time counters of Total Verified Workers, Weekly Attendance averages, Active Welfare Cases, and Open Prayer Petitions.
- **Attendance Trends Chart:** Visual graph comparing Sunday Services, Wednesday Bible Studies, and Academic Services over the semester.
- **Quick Actions:** Direct shortcuts to approve pending executives, publish Sunday announcements, or view urgent welfare alerts.

### 3.2 Presidential Executive Approvals Console (`/dashboard/executives`)
> [!IMPORTANT]
> The `/dashboard/executives` route is exclusively accessible to the **President**. Other roles attempting to access this route are blocked by RBAC security.

#### Processing Executive Nominations:
1. Open `/dashboard/executives`.
2. Filter applications by category:
   - **CSGB Central Offices** (Vice Presidents, General Secretary, Academic Coordinator, Directors).
   - **Hall Pastors & Hall Assistants** (Residence hall spiritual heads).
   - **Team Leads & Assistant Leads** (Heads of the 14 operational teams).
3. Review applicant profile: Name, photo, hall, academic level, requested office, and date applied.
4. **Action:**
   - Tap **"Approve" (Green Shield)** to confirm the appointment. The worker's account permissions immediately upgrade, granting them access to their designated dashboard tools.
   - Tap **"Reject" (Red X)** if the nomination is not approved. The applicant's status updates on their `/register/status` tracker.

### 3.3 Sunday Announcements Engine (`/dashboard/announcements`)
The CSGB coordinates official Sunday announcements read on the pulpit and displayed online.

#### Creating a New Announcement:
1. Click **"New Announcement"**.
2. **Title:** Enter an engaging headline (e.g., *"Academic Summit: First Class Honors Seminar"*).
3. **Category:** Choose from `WEEKLY SERVICES`, `ACADEMIC & EXAMS`, `BIBLE STUDY`, `EXCO UPDATES`, or `GENERAL`.
4. **Date & Venue:** Set event date, time, and campus venue.
5. **Pinned Toggle:** Toggle *"Pin Announcement"* to keep it at the top of the homepage ticker.
6. **Rich Content:** Write the bulletin body using bolding, lists, and scripture quotes.
7. **Publishing Control:**
   - Toggle **"Published"** to make it instantly visible to all students on the public website.
   - Toggle **"Send Broadcast on Publish"** to automatically blast an email notification to all registered email subscribers.
8. Click **"Save Announcement"**.

### 3.4 Pastoral & Workforce Oversight
- **Workforce Directory (`/dashboard/workers`):** View all fellowship workers across all 14 teams and residence halls. Search by name, department, or graduation year.
- **Pastoral Prayer Feed (`/dashboard/prayer-requests`):** Review confidential student petitions for spiritual intercession.
- **Welfare Review (`/dashboard/welfare`):** Monitor critical student support cases.

---

## Chapter 4: Media Team & Content Stewards (Sanity Studio & Sermons)

> [!NOTE]
> The **Media Team** is the exclusive custodian of the public website's text, images, banners, and digital assets via **Sanity Studio** (`https://eccf-backend.sanity.studio`).

### 4.1 Accessing Sanity Studio
1. Open your browser and navigate to:
   ```
   https://eccf-backend.sanity.studio
   ```
2. Log in using your authorized Sanity Media Admin credentials (Google or GitHub authentication).
3. You will see the Sanity Desk with two primary workspaces:
   - **Content Schemas List** (Left sidebar).
   - **Document Editor with Live Web Preview** (Right split-pane).

### 4.2 Updating Homepage & Site Settings (`siteSettings`)
To change banners, slogans, giving details, or contact info on the homepage:
1. In the Studio sidebar, click **"Homepage & Site Settings"**.
2. Select the singleton settings document.
3. Use the group tabs at the top to navigate:
   - **Hero Tab:**
     - `Hero Headline`: Edit master text (e.g., *"An Assembly of Spiritual Dynamites & Academic Giants"*).
     - `Fellowship Credo / Motto`: *"JESUS IN OUR HEARTS, LETTERS IN OUR HEADS."*
     - `Hero Mission Paragraph`: Brief introductory mission statement.
     - `Next Service Status Pill`: e.g., *"NEXT UP • Sunday 08:00 AM • NLT 5 Law Auditorium"*.
     - `Hero Top Pill`: e.g., *"Join us this week"*.
     - `Hero 5-Photo Collage Grid (Formula 4)`: Upload or replace 5 high-resolution photos for the homepage mosaic. Tag each photo with its category (`Worship`, `Academics`, `Choir`, `Community`, `Prayer`).
   - **Metrics & Legacy Tab:**
     - Update operational team counts, hall counts, weekly encounters, and student impact percentages.
   - **Plan a Visit Tab:**
     - Update meeting days, venue descriptions, and Google Maps location notes.
   - **Giving Accounts Tab:**
     - Update designated fellowship bank names, account numbers, and beneficiary names.
   - **Social Channels Tab:**
     - Update official YouTube channel links, Instagram handles, and Telegram channels.
   - **Website Footer Tab:**
     - Update copyright notices, address text, and fellowship support contacts.
4. Click **"Publish"** at the bottom right. Changes reflect live on the website within seconds.

### 4.3 Updating the About Page (`aboutPage`)
1. In the Studio sidebar, click **"About Page"**.
2. **Hero & Mission Creed:** Update the hero badge, subheading, headline, and core manifesto block.
3. **Story & Heritage Narrative:** Edit the history paragraphs describing ECCF's journey in Edo State University.
4. **Chronological Milestones:**
   - Add new milestones (e.g., Year: 2026, Title: *"Campus Multi-Media Expansion"*).
   - Describe major fellowship milestones and achievements.
5. **Core Pillars:** Edit descriptions for Spiritual Power, Academic Excellence, Integrity, and Fellowship.
6. Click **"Publish"**.

### 4.4 Managing the Photo Gallery (`galleryItem`)
To showcase authentic campus fellowship moments in the public gallery:
1. Click **"Photo Gallery"** -> **"Create New"**.
2. **Image:** Upload a crisp, high-resolution photo. Use the hotspot tool to set the focal point (ensuring faces are never cropped on mobile screens).
3. **Caption:** Add an inspiring caption or scripture.
4. **Category:** Choose category (`Worship`, `Academic Summit`, `Outreach`, `Drama / Choir Ministration`, `Orientation`).
5. **Event Date:** Enter when the photo was taken.
6. Click **"Publish"**.

### 4.5 Managing Weekly Service Schedules (`serviceSchedule`)
1. Click **"Weekly Service Schedules"**.
2. Edit or add regular weekly gatherings:
   - *Sunday Worship Encounter* (Sundays 08:00 AM, NLT 5).
   - *Midweek Spiritual & Academic Encounter* (Wednesdays 05:30 PM).
   - *Academic Tutorials & Exam Prayers* (Saturdays 04:00 PM).
3. Click **"Publish"**.

### 4.6 Managing Public Executive Profiles (`publicLeader`)
1. Click **"Public Leaders"**.
2. Add or update executive profiles visible on `/about`:
   - Full Name and Office (e.g., *President, General Secretary*).
   - Official portrait photograph.
   - Short bio and academic department.
   - Display Order (e.g., 1 for President, 2 for VP Admin, etc.).
3. Click **"Publish"**.

### 4.7 Managing Operational Team Profiles (`teamUnit`)
1. Click **"Team Units"**.
2. Update descriptions, meeting days, and banners for each of the 14 operational teams so prospective workers know what each team does before registering.

### 4.8 Dashboard Sermon Management (`/dashboard/sermons`)
The Media Coordinator and team leaders manage sermon releases on the Dashboard:
1. Navigate to `/dashboard/sermons`.
2. Click **"Add New Sermon"**.
3. **Basic Information:**
   - Sermon Title (e.g., *"Walking in Academic Dominion"*).
   - Preacher (e.g., *Bro. President / Guest Speaker*).
   - Date Preached.
   - Primary Scripture Reference (e.g., *Daniel 1:17-20*).
   - Sermon Series & Topical Tags.
4. **Media Links (ADR-002 Pivot):**
   - **Spotify Episode URL:** Paste the episode link or embed ID.
   - **YouTube Video URL:** Paste the YouTube recording URL.
   - **YouTube Music URL:** Direct link for audio streaming.
   - **Direct Audio URL:** Optional MP3 download link.
5. Click **"Save Sermon"**.
6. **Sync Sermons Button:** Click the *"Sync External Sermons"* button at the top of the page to refresh third-party metadata and verify audio stream links.

---

## Chapter 5: Team Leaders & Assistant Leads (14 Ministry Teams)

This chapter applies to the leaders of all 14 ECCF teams:
*Bible Study/Sunday School, Prayer, Protocol, Financial, Choir, Ushering, Drama/Creative Media, Outreach, Welfare/Medical, Academic, Colporteur/Library, Technical, Media, Decoration.*

### 5.1 Team Workforce Verification (`/dashboard/workers`)
When a student registers online at `/register` and selects your team, they appear in your team's roster with status `Pending`.

#### Verifying a Team Member:
1. Navigate to `/dashboard/workers`.
2. The list automatically displays students who applied for your team.
3. Review the applicant's name, department, level, and hall.
4. Meet with the student during rehearsals or meetings to confirm their commitment.
5. **Action:**
   - Tap **"Verify Member" (Green Checkmark)**: Confirms the student as an official workforce member of your team.
   - Tap **"Reject" (Red X)**: If the student no longer participates or registered in error.
6. The verification status updates in real-time, and the student sees the green verified badge on their `/register/status` page.

### 5.2 Logging Nominal Team Meeting Attendance (`/dashboard/attendance`)
Team Leads must log attendance for weekly team rehearsals, preparatory prayer sessions, and departmental meetings.

#### Step-by-Step Attendance Logging:
1. Navigate to `/dashboard/attendance`.
2. Click on the **"Team Meeting Attendance"** tab.
3. Fill in the meeting details:
   - **Meeting Title:** (e.g., *"Weekly Choir Rehearsal"*, *"Technical Setup & Sound Check"*, *"Midweek Protocol Briefing"*).
   - **Date:** Select the date of the meeting.
   - **Team:** Select your operational team.
4. **Nominal Roll Checklist:**
   - You will see a list of all verified workers belonging to your team.
   - Check the box next to each worker who was present.
   - The total headcount counter updates automatically as you check boxes.
5. **Notes:** Add any comments (e.g., *"Late arrival due to 400L lab practicals"*).
6. Click **"Submit Team Attendance"**.

### 5.3 Sending Team Announcements via Email
1. In `/dashboard/workers`, click **"Send Team Email"**.
2. Select your team as the recipient audience.
3. Write your update (e.g., rehearsal time change, dress code briefing).
4. Send email directly to all verified members.

---

## Chapter 6: Hall Representatives (Hostel / Campus Residence Pastors)

Hall Reps serve as on-the-ground spiritual shepherds in the student hostels (*Hall 1, Hall 2, Hall 3, Hall 4, Off-Campus hostels*).

### 6.1 Scoped Hall Roster (`/dashboard/workers`)
- By default, Hall Reps see workers residing in their assigned hostel.
- Monitor student distribution across rooms and identify who is living near whom to foster room fellowships and morning devotions.

### 6.2 First-Timers Follow-Up (`/dashboard/first-timers`)
When freshers or new students fill the intake form and indicate your hostel:
1. Open `/dashboard/first-timers`.
2. Filter by your hall of residence.
3. View the student's room number and department.
4. **Hospitality Visitation:**
   - Pay a friendly, welcoming visit to their room.
   - Introduce yourself as their hostel fellowship rep.
   - Invite them to hall prayer meetings and the upcoming Sunday service.
5. Log follow-up notes in the console.

### 6.3 Welfare & Emergency Reporting (`/dashboard/welfare`)
- If a student in your hostel falls sick, lacks food, or faces acute distress, immediately submit a welfare ticket via `/connect` or notify the Welfare Coordinator in `/dashboard/welfare`.
- Assist in delivering food parcels or medical assistance approved by the Welfare Team.

---

## Chapter 7: Financial Secretary & Finance Team

The Financial Secretary and finance team manage fellowship accounting with strict transparency and accountability.

### 7.1 Financial Overview & KPI Cards (`/dashboard/finance`)
- **Net Balance:** Cumulative balance (Total Income minus Total Expenses).
- **Total Inflow:** Summary of Tithes, Offerings, Online Giving, Levies, and Donations for the current semester.
- **Total Outflow:** Summary of Welfare disbursements, Utility expenses, Event costs, and Equipment purchases.

### 7.2 Recording Income Transactions
1. Navigate to `/dashboard/finance`.
2. Click **"Record Transaction"**.
3. **Transaction Details:**
   - **Type:** Select `Income`.
   - **Category:** Select from `Tithe`, `Offering`, `Project Levy`, `Online Giving`, or `Miscellaneous`.
   - **Amount (NGN):** Enter exact amount in Naira (e.g., `₦25,000`).
   - **Date:** Date funds were received or verified in the bank.
   - **Description:** Provide context (e.g., *"Sunday 2nd Service Tithes & Offerings"*).
   - **Flutterwave Reference (Optional):** Enter transaction ID if received via the web portal.
4. Click **"Save Transaction"**.

### 7.3 Recording Expense Disbursements
1. Click **"Record Transaction"**.
2. **Details:**
   - **Type:** Select `Expense`.
   - **Category:** Select from `Welfare Disbursement`, `Utility Expense`, `Event Expense`, or `Miscellaneous`.
   - **Amount (NGN):** Enter disbursed amount.
   - **Description:** Detailed note (e.g., *"Fuel purchase for fellowship bus during Academic Summit"* or *"Approved medical emergency support for 200L student"*).
3. Click **"Save Transaction"**.

### 7.4 Exporting Financial Ledgers for Audit
1. Click the **"Export CSV"** button on the top right of the financial table.
2. An audited `.csv` file will immediately download to your computer, containing:
   - Transaction ID, Date, Inflow/Outflow Type, Category, Amount (NGN), Description, and Verification Reference.
3. Submit this report for monthly CSGB financial reviews and general fellowship business meetings.

> [!CAUTION]
> Under ECCF Data Privacy Rules, members of the Finance role have zero access to student prayer requests and personal first-timer details to maintain absolute pastoral confidentiality.

---

## Chapter 8: Outreach, Evangelism & Follow-up Team

The Outreach & Evangelism team leads soul-winning initiatives on campus and ensures every visitor is embraced into the fellowship family.

### 8.1 First-Timers Intake Console (`/dashboard/first-timers`)
1. Open `/dashboard/first-timers`.
2. The table lists every student who registered on Sunday or through `/connect`.
3. Details displayed:
   - Full Name
   - Academic Department and Level
   - Hall of Residence & Room Number
   - Date Visited
4. **Follow-Up Coordination:**
   - Assign follow-up partners to call the visitor within 24 hours.
   - Coordinate with the respective Hall Rep for room visitations.
   - Encourage visitors to join an operational team and attend the foundation Bible study classes.

---

## Chapter 9: Intercessory Prayer Team

The Prayer Team provides spiritual coverage for the fellowship, students' academic success, campus revival, and individual petitions.

### 9.1 Prayer Requests Feed (`/dashboard/prayer-requests`)
1. Navigate to `/dashboard/prayer-requests`.
2. View incoming prayer requests submitted via the public `/connect` portal.
3. Petitions include academic stress, family needs, health healing, spiritual growth, and salvation of roommates.
4. **Intercessory Protocols:**
   - Treat every request with total spiritual confidentiality.
   - Lift up requests during daily/weekly prayer chains.
   - Mark completed or answered prayers in the tracker.

---

## Chapter 10: Welfare & Medical Team

The Welfare & Medical team demonstrates Christ's love by supporting students experiencing practical, physical, and financial difficulties.

### 10.1 Managing Welfare Cases (`/dashboard/welfare`)
1. Navigate to `/dashboard/welfare`.
2. Review incoming welfare assistance tickets.
3. Cases start with status `Pending` (Yellow Badge).
4. **Case Investigation:**
   - Contact the student discreetly to assess the emergency (food shortage, hospital medication, hostel rent distress).
   - Determine necessary support in consultation with the President.
5. **Resolution:**
   - Once support is delivered (e.g., food provisions dispatched or medical bill covered with the Financial Secretary), click **"Mark as Resolved" (Green Checkmark)**.
   - Status updates to `Resolved` (Green Badge).

---

## Chapter 11: Ushering Team (Headcount & Statistics)

The Ushering team oversees orderliness during services and provides accurate headcount data for campus attendance tracking.

### 11.1 Logging Service Headcounts (`/dashboard/attendance`)
1. Open `/dashboard/attendance`.
2. Select the **"Ushering Headcount"** tab.
3. Fill out the service entry:
   - **Service Type:** Choose from `Sunday Service`, `Wednesday Bible Study`, `Academic Service`, or `Special Programme`.
   - **Date:** Enter the service date.
   - **Men Count:** Number of male students/guests counted.
   - **Women Count:** Number of female students/guests counted.
   - **Children Count:** Number of children (e.g., faculty staff families).
   - **First-Timers Count:** Total hands raised for first-time visitors.
4. **Automatic Calculation:** The system calculates the `Total Count` in real-time (`Men + Women + Children`).
5. **Notes:** Note special factors (e.g., *"Service held during examination week; heavy rain"*).
6. Click **"Save Attendance Record"**.
7. The record immediately synchronizes with the Executive Overview attendance graph.

---

## Chapter 12: Technical Administrators & Platform Engineers

This chapter covers system maintenance, security keys, database boundaries, and automated pipelines.

### 12.1 Environment Variables & Secret Configuration
The following variables must be maintained in production (Vercel & Sanity):

| Variable Name | Environment | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Frontend | Clerk client-side authentication engine |
| `CLERK_SECRET_KEY` | Frontend | Server-side Clerk token verification & user management |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Both | Sanity project identifier (`ynnot4j0`) |
| `NEXT_PUBLIC_SANITY_DATASET` | Both | Target dataset (`production`) |
| `SANITY_READ_TOKEN` | Frontend | Server-only authenticated token for reading operational drafts |
| `SANITY_WRITE_TOKEN` | Frontend | Server-only token for mutations, worker intake, and ledgers |
| `ENCRYPTION_KEY` | Frontend | 32-byte hexadecimal key for AES-256-GCM data encryption |
| `HMAC_PEPPER` | Frontend | Secret key for one-way HMAC-SHA256 blind indexing |
| `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` | Frontend | Flutterwave checkout initialization |
| `FLUTTERWAVE_SECRET_KEY` | Frontend | Server-side transaction verification webhook |

### 12.2 Sanity Operational Drafts Privacy Architecture
Operational records (`worker`, `attendanceLedger`, `financeLedger`, `firstTimer`, `welfareRequest`, `prayerRequest`) must remain unpublished drafts at all times.
- **Verification Script:**
  ```bash
  node scripts/verify-unauthenticated.mjs
  ```
  Confirms that public unauthenticated queries to Sanity return zero operational documents.
- **Migration & Encryption Script:**
  ```bash
  node scripts/encrypt-existing-data.mjs
  ```
  Encrypts legacy unencrypted phone/room records.

### 12.3 Automated Testing & QA Portal (`/qa`)
The platform includes an automated testing suite accessible at `/qa` for leadership and QA teams.
- **Suites Covered:**
  1. *Public Website & Media Suite* (14 tests)
  2. *Worker Intake, Security & Privacy Suite* (13 tests)
  3. *Clerk Auth, OTP & Verification Suite* (8 tests)
  4. *Multi-Position Governance & RBAC Suite* (9 tests)
  5. *Leadership Operations & Intake Suite* (10 tests)
  6. *PWA, Data Integrity & Recovery Suite* (7 tests)
- Non-technical testers can follow the plain-English step-by-step instructions on each card to verify features before every major campus semester release.

---

## Appendix A: Role-Based Access Control (RBAC) Matrix

| Section / Capability | President (admin) | CSGB Exco (admin) | Team Lead (team_lead) | Hall Rep (hall_rep) | Finance (finance) | Media Lead (team_lead) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Overview Metrics** | Full | Full | Team/People | Hall/People | Finance Only | Team/Media |
| **Executive Nominations** | **Full** | View | No | No | No | No |
| **Workforce Directory** | All | All | Own Team | Own Hall | No | Media Team |
| **Verify Team Members** | Yes | Yes | **Own Team** | No | No | Media Team |
| **Ushering Attendance** | Yes | Yes | No | Hall | No | No |
| **Nominal Team Attendance**| Yes | Yes | **Yes** | No | No | **Yes** |
| **Finance Ledger** | Yes | View | No | No | **Full** | No |
| **First-Timers Intake** | Yes | Yes | Outreach Only | **Own Hall** | No | No |
| **Welfare Requests** | Yes | Yes | Yes | **Yes** | No | No |
| **Prayer Petitions** | Yes | Yes | Yes | Yes | No | No |
| **Sunday Announcements** | **Full** | **Full** | View | View | View | View |
| **Sermon Management** | Yes | View | No | No | No | **Full** |
| **Sanity Studio CMS** | Admin | Admin | No | No | No | **Primary Editor** |

---

## Appendix B: Route & URL Directory

### Public Routes
- `/` — Homepage (Hero, Next Service Pill, 5-photo collage, Weekly Schedule)
- `/about` — About ECCF (Vision, History, Pillars, Public Executive Leadership)
- `/sermons` — Sermon Vault (Multi-platform audio/video player, search, topics)
- `/announcements` — Sunday Announcements & Events Hub (Category filters, email subscribe)
- `/connect` — Connect Hub (First-Timers, Prayer Requests, Welfare, Join a Team)
- `/give` — Online Giving & Stewardship (Flutterwave card/bank transfer, account details)
- `/privacy` — Operational Privacy & Data Protection Policy
- `/register` — Worker Registration Intake
- `/register/status` — Worker Application & Verification Status Tracker
- `/qa` — Comprehensive Quality Assurance Testing Portal

### Dashboard Routes (Protected)
- `/login` — Clerk Passwordless Authentication
- `/dashboard` — Executive Overview Dashboard
- `/dashboard/executives` — Presidential Executive Nominations & Approval Console
- `/dashboard/workers` — Workforce Directory & Team Lead Verification
- `/dashboard/attendance` — Attendance Hub (Ushering Headcount & Nominal Team Attendance)
- `/dashboard/finance` — Finance Ledger & Expense Tracking
- `/dashboard/first-timers` — First-Timers Follow-Up Console
- `/dashboard/welfare` — Student Welfare & Benevolence Requests
- `/dashboard/prayer-requests` — Intercessory Prayer Petitions Feed
- `/dashboard/announcements` — Sunday Announcements Engine
- `/dashboard/sermons` — Sermon Management & Multi-Platform Sync

### Backend CMS
- `https://eccf-backend.sanity.studio` — Sanity Studio Content Management System

---

## Appendix C: Operational Troubleshooting & FAQ

### Q1: Why do I get an "Access Denied" toast when clicking on a dashboard tab?
**A:** Your assigned account role does not have permission for that section. For example, `/dashboard/executives` is restricted strictly to the President, and `/dashboard/finance` is restricted to Finance officers and the President. Contact the President or Technical Administrator if your role needs upgrading.

### Q2: How do I change the photo or headline on the website homepage?
**A:** The Media Team handles this in Sanity Studio:
1. Log in at `https://eccf-backend.sanity.studio`.
2. Click **"Homepage & Site Settings"**.
3. Under the **"Homepage Hero"** tab, upload the new image or update the headline text.
4. Click **"Publish"** at the bottom right.

### Q3: Why does a newly registered worker not appear in the verified list?
**A:** New registrations start in the `Pending` state. The worker's assigned Team Leader must log into `/dashboard/workers` and click **"Verify Member"** to approve them into active fellowship service.

### Q4: How does a student check if their executive nomination was approved?
**A:** The student visits `/register/status`, enters their phone number, inputs the 6-digit OTP received, and their real-time approval status will be displayed immediately.

### Q5: How do we record a direct bank transfer tithe or offering?
**A:** The Financial Secretary opens `/dashboard/finance`, clicks **"Record Transaction"**, enters the amount, selects category `Tithe` or `Offering`, types the bank narration or depositor's name in the description, and clicks **"Save Transaction"**.

---
*Document approved for fellowship operations by the Central Student Governing Board (CSGB) — Edo State University Christian Campus Fellowship.*
