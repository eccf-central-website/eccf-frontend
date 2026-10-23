# ECCF Central Platform — Master Operational Manual
**Edo State University Christian Campus Fellowship (ECCF)**  
*Edo State University Uzairue / Iyamho (ESUI)*  
*Version 2.0 — Comprehensive Guide for Leaders, Workers, Media Stewards, and Fellowship Members*

**Last verified:** 23 October 2026 against frontend commit `a46ccdc` and backend commit `e6819d8`.

> **Revision 2.0.** This edition replaces Version 1.0 and was checked line-by-line against the current frontend and Sanity schemas. Major corrections include: Clerk-only status tracking and sign-up, signed-in Clerk profile refresh, the 8-step worker intake with no executive application, multi-team memberships and position approvals, the President-only executive console, manual announcement broadcasts, bank-transfer-only giving, role-scoped welfare contact visibility, dashboard-only PWA installation, the current six QA suites (61 tests), and the three-tab Connect hub. Where code and prose disagree, the code is the source of truth.

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
        Web["Public Web Portal\n(Home, About, Sermons, Announcements, Connect, Give)"]
        WorkerReg["Worker Registration\n(/register, /register/status)"]
    end

    subgraph Auth["Identity Layer (Clerk)"]
        Clerk["Clerk Authentication\n(Google OAuth + emailed verification codes)"]
    end

    subgraph Dashboard["Executive Management Layer (eccf-frontend /dashboard)"]
        ExcoDash["Role-Based Exco Dashboard\n(Overview, Executives, Workers, Attendance,\nFinance, First-Timers, Welfare, Prayer,\nAnnouncements, Sermons)"]
    end

    subgraph Backend["Content & Operational Storage (eccf-backend)"]
        SanityStudio["Sanity Studio CMS\n(Media Team & Content Admins)"]
        SanityDrafts["Private Operational Drafts\n(Encrypted Worker CRM, Finance, Intake)"]
    end

    Web -->|Published Content Only| SanityStudio
    WorkerReg -->|Public Intake, Encrypted| SanityDrafts
    Clerk -->|Session + Role Bridge| ExcoDash
    ExcoDash -->|Authenticated Read/Write Token| SanityDrafts
    SanityStudio -->|Live Web Preview Split Pane| Web
```

### Core Security & Privacy Safeguards
1. **Private Operational Drafts Boundary:** Sensitive records (worker profiles, financial entries, attendance rosters, first-timer contacts, welfare requests, prayer requests) are written as Sanity private drafts. Public, unauthenticated queries only return published content such as sermons, announcements, gallery items, and leadership profiles.
2. **Field-Level AES-256-GCM Encryption:** Phone numbers and hostel room numbers are encrypted before they reach Sanity. Legacy keys are supported only for controlled re-encryption, via `ENCRYPTION_LEGACY_KEYS` and `HMAC_LEGACY_PEPPERS`.
3. **One-Way HMAC-SHA256 Blind Indexing:** Phone lookups and deduplication use a blind index, so searchable plain-text contact numbers are never stored.
4. **Clerk Identity + Strict RBAC:** Dashboard routes and server actions verify the Clerk session, resolve the worker record, and derive permissions from approved positions. Unauthorised sections are removed from navigation and blocked on direct URL access.
5. **Abuse & Consent Controls:** Public intake and subscription forms use Cloudflare Turnstile. Worker registration requires an explicit NDPR consent checkbox before submission.

> [!NOTE]
> The authoritative access rules live in `lib/dashboard/rbac.ts` and `lib/dashboard/access.ts`; the API/schema boundary lives in `lib/sanity.ts` and the `eccf-backend` schemas. This manual describes the behaviour of those files. If a future code change alters them, update this document in the same pull request.

---

## Chapter 1: Fellowship Members & General Students (Public Website & PWA)

Every student, alumnus, and campus visitor interacts with the public website at `https://eccf-frontend.vercel.app` (or the custom domain).

### 1.1 Homepage (`/`)
The homepage is server-rendered from live Sanity content and currently renders these sections, in order:

1. **Hero:** Fellowship headline, mission creed, introductory paragraph, a configurable top pill (default: *"Join us this week"*), and a five-photo **Formula 4 collage**. The collage is editable in Sanity; if fewer than five photos are configured, the built-in reference collage is used.
2. **Who We Are:** Mission summary and fellowship statistics from Site Settings.
3. **Weekly Service Schedule:** Day, time, title, badge, description, tags, and venue for each gathering.
4. **Latest Sermons:** Recent messages with links to the Sermon Vault and streaming platforms.
5. **Fellowship Moments:** Featured photo gallery.
6. **Giving Hub:** Verified bank-transfer details with a copy-account-number control.
7. **Social Media Banner:** Links to the fellowship's official channels.
8. **Plan a Visit:** Visit contact, WhatsApp link, and location guidance.

> [!IMPORTANT]
> The homepage no longer displays a **Next Service status pill** or a **Latest Announcements ticker**. Announcements live on `/announcements`, and the hero's visible pill is driven by the `heroTopPill` field. The legacy `liveStatusText` field still exists in the schema/query but is not rendered by the current frontend.

The global public chrome adds:
- **Navbar links:** Sermons, Giving (`/#giving`), About, Announcements, Connect.
- **The Launcher:** a floating bottom-right "next steps" card with an inline Connect Card plus configurable quick links. Default actions include Join A Team / Registrations (worker intake), Weekly Podcasts & Messages (`/sermons`), and Give Online (`/give`). The quick links are editable in Sanity under **Launcher Quick Links**.
- **Footer:** newsletter prompt, brand text, mission statement, meeting venue, active ministry, navigation columns, copyright, and social links.

### 1.2 About Page (`/about`)
- **Mission & Vision:** The fellowship's spiritual mandate for Edo State University.
- **Our Story & Heritage:** Narrative, pull quote, and photo collage tracing ECCF's history.
- **Chronological Milestones:** Timeline entries with year, badge, title, and description.
- **Pillars of Faith:** Configurable pillars, each with a title, subtitle, scripture, description, and bullet points.
- **Leadership Gallery:** Five tiers — **Patrons**, **CSGB**, **Hall Pastors (Halls 1–8)**, **Team Leaders**, and **Assistant Team Leaders**. The roster is driven by Sanity `publicLeader` records. Patrons use the `patron` Leadership Category; the curated Patron list remains only as a fallback when no Patron records exist.
- **Operational Teams Directory:** Live `teamUnit` records describing the 14 ministry teams.

> [!NOTE]
> There is no separate "resident pastor" tier. Hall Pastor cards deliberately omit personal hall/room labels so student residence information is not exposed publicly.

### 1.3 Sermon Vault (`/sermons`)
- **Multi-Platform Player:** Watch on YouTube or listen on Spotify / YouTube Music. Each message card exposes only the platforms that have been configured.
- **Search & Filters:** Search by **title, preacher, or series**; filter by topic tags derived from the live sermon catalogue.
- **No Public Download Button:** The site links out to the streaming platforms. It does not host an MP3 download control or a public sermon-notes reader.
- **Automatic Enrichment:** Visiting the homepage or Sermon Vault triggers a throttled background sync at most once every 15 minutes. The sync ingests the Spotify and YouTube RSS feeds and can enrich sermons with YouTube Data API v3 metadata when `YOUTUBE_API_KEY` is configured.

### 1.4 Sunday Announcements Hub (`/announcements`)
- **Category Filters:**
  - `WEEKLY SERVICES`
  - `ACADEMIC & EXAMS`
  - `BIBLE STUDY`
  - `EXCO UPDATES`
  - `GENERAL` (displayed as *General Fellowship*)
- **Pinned Notices:** Pinned bulletins sort to the top of the feed.
- **Search:** Free-text search across titles and bulletin content.
- **Subscribe to Broadcasts:** The subscription card collects an optional name and a required email address, protected by Turnstile. Subscribers receive manual broadcasts sent from the dashboard; subscribing does not automatically publish anything.
- **Preview Mode:** `/announcements/preview` is an internal preview surface. It is not part of the public navigation.

### 1.5 Connect Hub (`/connect`)
The Connect Hub has exactly **three** tabs:

1. **First Timer ("New Here?"):** First name, last name, phone number, hostel/hall, room number, department, and level. The visit date is recorded automatically as the submission date; the form does not ask for a separate date.
2. **Welfare ("Need Support?"):** Name, phone number, and a confidential description of the need.
3. **Prayer ("Need Prayer?"):** An optional name and the prayer request. Leaving the name blank submits the request anonymously.

> [!IMPORTANT]
> There is no **"Join a Team"** tab in the Connect Hub. Prospective workers use the Launcher's **Join A Team / Registrations** actions or go directly to `/register`.

### 1.6 Online Giving & Stewardship (`/give`)
- **Bank Transfer Only:** The page displays the fellowship's verified bank name, account name, and a 10-digit account number, plus any instructions configured in Sanity. The account number can be copied with one tap.
- **No Flutterwave Checkout:** There is no card, USSD, or automated online checkout, no payment webhook, and no automatic receipt generation. Contributions are reconciled manually by the Finance team.
- **Financial Integrity:** The page explains that funds are stewarded under the CSGB and Financial Secretary. Published account details are managed in **Site Settings → Giving Accounts**.

### 1.7 Installing the Progressive Web App (PWA)
The PWA is intentionally an **Exco dashboard application**, not a public-site app.

- **Manifest:** Served from `/manifest.webmanifest`; `start_url` and `scope` are `/dashboard`.
- **Install Control:** Authenticated leaders use the **Install App** button in the dashboard top bar. It captures the browser's native install prompt on Chrome, Edge, and Android, and shows iOS Safari instructions (Share -> Add to Home Screen) when needed.
- **Already Installed:** The button hides automatically when the app is running in standalone mode.
- **Public Site:** Install prompts are suppressed on public pages. Visitors browsing the marketing site will not be prompted to install the portal.
- **No Offline Data Cache:** The project does not register a service worker. The installed app opens in a standalone window but still requires network access and a valid Clerk session for dashboard data.

---

## Chapter 2: Fellowship Workers & Volunteer Onboarding

### 2.1 Registering as a Worker (`/register`)
Any student desiring to serve in ECCF registers through the official worker intake portal. The form supports **new workers**, **signed-in workers refreshing a linked profile**, and **returning workers updating an existing profile**.

#### Signed-In Profile Refresh (Preferred)
If you are signed in with Clerk and your account is already trusted for a worker record, `/register` opens at **Profile Refresh**, step 2 of 4. Trust is established when the worker record is linked to your Clerk user ID or when Clerk has verified the same email and the record is not linked to a different sign-in method. Clerk's verified session replaces the email code, so no second OTP is required.

You can update names, birthday month/day, hall/room, operational teams, and the optional photo. Email and phone stay read-only; contact-detail changes require an administrator. The page shows **"Profile linked"** and a **My status** link.

If the email matches a worker record linked to a different sign-in method, the page shows **"One more check"** and requires the email code. If no worker profile is linked yet, the page starts a new registration and links the new record to the signed-in Clerk account on save.

#### New Worker Flow (8 Steps)
1. **Phone Gateway:** Enter a phone number and complete the Turnstile bot check. The action rejects requests without a valid challenge. The system then checks whether the number already belongs to a worker.
2. **Name:** First name, middle name (optional), and last name.
3. **Email:** A valid personal email address. This becomes the identity used for Clerk sign-in and status access.
4. **Operational Teams:** Select one or more of the 14 fellowship teams. Multi-team membership is supported and expected.
5. **Residence:** Select a hall of residence (Halls 1–8) and enter a room number. Room data is encrypted before storage.
6. **Birthday:** Select the birthday **month and day**. The year is not collected.
7. **Birthday Photo (Optional):** Upload a celebratory photo, maximum 5 MB. The image is compressed before upload; the server rejects stored assets larger than 2 MB.
8. **Review & Consent:** Review name, email, phone, selected teams, hostel/room, and birthday. Check the **NDPR consent** box, complete the final Turnstile check, and select **"Complete Registration"**.

> [!NOTE]
> The intake form does **not** collect academic department, academic level, password, or an executive application. Executive positions are appointed separately and approved by the President.

#### Returning Worker Flow (4 Steps)
**Signed-in trusted workers** use the Profile Refresh path above and start at step 2.

**Signed-out workers** can either enter the phone number on file at step 1, or select **"Already registered as a worker?"** and enter the registered email or phone number; the recovery form requires Turnstile. The system sends a **6-digit verification code and a secure unlock link** to the email on file. Both expire after **15 minutes** (the resend cooldown is 60 seconds).

1. Verify ownership with the phone number, or with the registered email/phone recovery form, and the emailed code/link.
2. Review and update your profile: first/middle/last name, birthday month and day, hall and room, and operational team memberships. The email and phone on file are shown read-only.
3. Replace the optional birthday photo.
4. Confirm the profile, complete the security check, and select **"Save Profile Updates"**.

#### What Happens After Submission
- The worker profile is stored as a private operational draft.
- For a new profile, each selected team membership starts as **Pending** and is routed to that team's leader for verification. On a refresh, existing memberships keep their current status; newly selected teams start **Pending**.
- New registrations show **"Registration Confirmed"**; profile refreshes show **"Profile Updated"**. Both screens list the selected teams, hall/room, and the note *"Review by Team Leads"*.
- Executive appointments are **not** requested here. When the President later approves a position, the corresponding operational team membership is verified automatically.

### 2.2 Tracking Your Registration Status (`/register/status`)
The status tracker is now **privacy-protected by Clerk**. There is no phone-number + OTP lookup on this page.

1. Navigate to `/register/status`.
2. If you are not signed in, the page shows **"Authentication Required"** and links to `/login`. The page explains that sign-in is required to protect member privacy and hostel room information.
3. Sign in with the verified email or Google account associated with your worker profile.
4. Review:
   - **Team Memberships:** Each team and its status — `Pending`, `Verified`, or `Declined`.
   - **Executive Positions:** Each position and its status — `Pending`, `Approved`, or `Declined`.
   - **Profile Details:** Name, contact details, hall/room, and birthday information on file.
   - **Clerk Link Status:** Whether the worker profile is linked to a Clerk identity.

> [!NOTE]
> If no executive positions exist, the status page explains that executive positions are appointed by the Fellowship President and directs the worker to the President or Technical Administrator. It no longer links to `/register` as an application path.

### 2.3 Worker & Leader Sign-In (`/login` and `/sign-up`)
1. Navigate to `/login`.
2. Sign in through Clerk using **Google OAuth** or an **emailed verification code**. Passwords are not used.
3. First-time Exco members who do not yet have a Clerk account use `/sign-up`.
4. **Previously registered but cannot sign in?** Use the **"Activate Login"** form below the Clerk card. Enter the email address on your worker profile. The system finds the worker, creates or links the Clerk user, stores `clerkUserId` on the profile, and asks you to sign in with that same email.
5. After authentication you land on `/dashboard`.

Routing notes:
- The dashboard middleware protects `/dashboard(.*)`.
- `/dashboard/login` permanently redirects to `/login`.
- `/dashboard/sign-up` permanently redirects to `/sign-up`.
- `DASHBOARD_MOCK_AUTH=1` enables a local-only mock session outside production; it never applies in production.

---

## Chapter 3: President & Central Student Governing Board (CSGB)

The President and CSGB executives hold central oversight over fellowship operations, student governance, and executive appointments. Access is derived from **approved positions**, not from job titles typed into a form.

### 3.1 Overview Dashboard (`/dashboard`)
The overview greets the signed-in leader by name and shows their position badge, role badge, and teams.

**Available actions and panels:**
- **Broadcast Mail to Workers** (admins) or **Send Mail to [Team]** (team leaders): opens the workforce email workflow.
- **People statistics** (admins, team leads, hall reps):
  - First-timers this month
  - Pending welfare requests
  - Prayer requests in the last 7 days
  - Workers (scoped caption: "In your hall" for Hall Reps, otherwise "Across all halls")
  - Last service attendance with service type and relative date
- **Finance statistics** (admins and finance role):
  - Income this month
  - Expenses this month
  - Net this month (Surplus / Deficit / Break-even)
- **Recent First-Timers** and **Recent Welfare Requests** lists, shown only to roles that can access those sections.

> [!IMPORTANT]
> The overview no longer contains an attendance trends chart or a generic quick-actions grid. Its only top-level action is the workforce email link. The "last service attendance" card is the current at-a-glance attendance indicator.

### 3.2 Presidential Executive Approvals Console (`/dashboard/executives`)
> [!IMPORTANT]
> `/dashboard/executives` is exclusively accessible to the **President**. The guard checks the derived `isPresident` capability (also settable with `canApproveExecutives`); all other roles are blocked.

#### Processing Executive Appointments:
1. Open `/dashboard/executives`.
2. Search by name, email, hall, office, or team.
3. Filter with the category tabs:
   - **CSGB** central offices: President, VP Admin / Brothers' Coordinator, VP Evangelism / Sisters' Coordinator, General Secretary.
   - **Hall** positions: Hall Pastor / Assistant Hall Pastor for Halls 1–8.
   - **Team** positions: Team Lead / Assistant Team Lead across the 14 operational teams.
4. Review each card. The card shows the applicant's **name, photo, email, hall, requested position/rank, and submission date**. It does **not** show an academic level, because worker intake no longer collects one.
5. Choose an action:
   - **"Approve Appointment"** — records the approved position, grants the corresponding dashboard capabilities immediately, and automatically verifies the related team membership when the appointment is a team position.
   - **Decline** — records the rejection. The applicant sees `Declined` on `/register/status`.

> [!NOTE]
> There is no CSV import control in the rendered executive console. Bulk spreadsheet imports are not part of the current President workflow.

### 3.3 Sunday Announcements Engine (`/dashboard/announcements`)
Access is limited to **CSGB members**: admins, the President, Vice Presidents, the General Secretary, and Prayer leadership (including a Prayer Team Lead). Ordinary team leads cannot open this section unless their position also satisfies the CSGB test.

#### Creating a New Announcement:
1. Select **"New Announcement"**.
2. Optionally start from a **template chip**: Sunday Service, Wednesday Study, Night Vigil, or Exams Clinic. Templates prefill the category and body.
3. Complete the fields:
   - **Title** (minimum 3 characters)
   - **Category** — `WEEKLY SERVICES`, `ACADEMIC & EXAMS`, `BIBLE STUDY`, `EXCO UPDATES`, or `GENERAL`
   - **Event Date** and **Publish Date**
   - **Time** and **Location** (defaults to the fellowship venue if left blank)
   - **Content** — rich text with bold, lists, links, and scripture quotes
   - **Pin Announcement** — keeps the notice at the top of the public feed
   - **Published** — makes it live on `/announcements`
4. Select **"Save Announcement"**.

#### Broadcasting to Subscribers:
There is **no "Send Broadcast on Publish" toggle** in the current modal. Publishing and emailing are separate actions. New announcements are stored with automatic broadcast explicitly disabled; existing announcement documents are left untouched.

1. Publish the announcement first; the **Broadcast** action is disabled for drafts.
2. On the announcement card, select **"Broadcast"**. A confirmation dialog opens.
3. Confirm to send the email to all active subscribers through Resend.
4. The card changes to **"Broadcast sent"** and the action becomes **"Re-send"** for a deliberate repeat send.
5. If there are no active subscribers, the action reports that the mailing list is empty.

The dashboard summary counters show total announcements, published notices, drafts, pinned notices, and broadcasted notices.

### 3.4 Pastoral & Workforce Oversight
- **Workforce Directory (`/dashboard/workers`):** Fellowship-wide roster for admins; team-scoped for team leads; hall-scoped for hall reps; fellowship-wide read-only directory for Media leads. Includes pending approvals and workforce email.
- **Prayer Feed (`/dashboard/prayer-requests`):** Confidential petitions submitted through `/connect`.
- **Welfare Review (`/dashboard/welfare`):** Pending and resolved student support cases.
- **First-Timers (`/dashboard/first-timers`):** Campus-wide for admins and outreach leads; hall-scoped for hall reps.

---

## Chapter 4: Media Team & Content Stewards (Sanity Studio & Sermons)

> [!NOTE]
> The **Media Team** is the custodian of the public website's text, images, banners, and digital assets via **Sanity Studio** (`https://eccf-backend.sanity.studio`).

### 4.1 Accessing Sanity Studio
1. Open `https://eccf-backend.sanity.studio`.
2. Sign in with an authorised Sanity account (Google or GitHub authentication).
3. The Studio Desk provides the content schema list on the left and the document editor on the right.
4. Content types with public representations expose a **"Live Web Preview"** tab beside the edit form: announcements, sermons, the About page, Site Settings, service schedules, gallery items, team units, and public leaders.

### 4.2 Updating Homepage & Site Settings (`siteSettings`)
1. In the Studio sidebar, open **"Homepage & Site Settings"**.
2. Edit the singleton document using the group tabs:
   - **Homepage Hero:**
     - `Hero Headline`, `Fellowship Credo / Motto`, and `Hero Mission Paragraph`.
     - `Hero Top Pill` — the visible pill above the headline (default *"Join us this week"*).
     - `Hero 5-Photo Collage` — upload/replace the five collage images and set their alt text and tag. If fewer than five are configured, the reference collage is displayed.
     - `Hero Photo` — legacy single-photo field retained for compatibility.
     - `Live Status Text` — retained in the schema but not rendered by the current frontend.
   - **Metrics & Legacy:** `Active Members`, `Weekly Services`, and `Campus Legacy` statistics displayed in the Who We Are section.
   - **Plan a Visit:** Visit contact person, WhatsApp number, and visit photo.
   - **Giving Accounts:** Bank name, account name, 10-digit account number, and transfer instructions.
   - **Website Footer:** Newsletter heading and description, brand title/subtitle, mission statement, logo, meeting venue, active ministry, copyright, and footer navigation columns.
   - **Social Channels:** Fellowship email, YouTube, Instagram, Facebook, TikTok, Telegram, X/Twitter, and WhatsApp URLs.
   - **Launcher Quick Links:** Title, subtitle, target URL/anchor, icon type (podcast, visit, give, announcement, portal), and external-link flag for the floating launcher.
3. Select **"Publish"**. The public site is server-rendered with `force-dynamic`, so published changes appear on the next request.

### 4.3 Updating the About Page (`aboutPage`)
1. Open **"About Page"**.
2. Edit:
   - **Hero:** badge, location subheading, master headline, subtitle, mission creed, and hero photo.
   - **Metrics:** operational teams, residence halls, weekly encounters, and student impact.
   - **Story:** headline, lead, narrative paragraphs, pull quote, and two story photos.
   - **Milestones:** year/period, badge, title, and description.
   - **Core Pillars:** headline, lead, and pillar entries (title, subtitle, scripture, description, bullet points).
   - **Leadership:** section headline and subtitle.
   - **Teams:** section headline and subtitle.
   - **CTA:** tag, headline, and subtitle.
3. Select **"Publish"**.

### 4.4 Managing the Photo Gallery (`galleryItem`)
1. Open **"Photo Gallery"** and select **"Create New"**.
2. Complete:
   - **Photo Title**
   - **Category** — `Sunday Service`, `Bible Study`, `Student Life`, `Prayer Night`, `Excellence`, `Outreach`, or `Exco Roster`
   - **Photo Image** — upload a high-resolution image and set the hotspot/focal point
   - **Caption / Short Description**
   - **Featured on Homepage** — controls whether the image is eligible for the homepage gallery
3. Select **"Publish"**.

> [!NOTE]
> The gallery schema no longer has a separate "Event Date" field. Use the caption or title if a date needs to be shown.

### 4.5 Managing Weekly Service Schedules (`serviceSchedule`)
1. Open **"Weekly Fellowship Schedule"**.
2. Add or edit each gathering:
   - **Day of the Week**, **Service Time**, **Service Title**, **Badge / Category Tag**
   - **Service Description**, **Highlight Tags / Focus Points**, **Venue Location**
   - **Display Order**
3. Select **"Publish"**. The homepage renders the schedule in display order.

### 4.6 Managing Public Executive Profiles (`publicLeader`)
1. Open **"Public Leaders"**.
2. Add or update:
   - **Full Name**
   - **Official Position** (e.g., President, General Secretary)
   - **Official Portrait Photo** (hotspot supported)
   - **Leadership Category** — optional: `Patron`, `CSGB Executive`, `Hall Pastor`, `Team Leader`, or `Assistant Team Leader`
   - **Display Order**
3. Select **"Publish"**.

> [!NOTE]
> Patrons are a selectable `publicLeader` category. Add a record with **Leadership Category: Patron** to publish a Patron card. The About page only falls back to its curated Patrons list when no Sanity record is tagged as a patron. Use the supported categories for all current leaders.

### 4.7 Managing Operational Team Profiles (`teamUnit`)
1. Open **"Teams & Units"**.
2. Maintain each team's **name**, **system key slug**, **team photo**, **short description**, and **display order**.
3. Select **"Publish"**.

> [!NOTE]
> Team meeting days and banners are not fields on `teamUnit`. Meeting logistics belong in the service schedule, announcements, or team communication.

### 4.8 Dashboard Sermon Management (`/dashboard/sermons`)
Access is restricted to **Media leaders**. The check accepts an approved position on a team whose key is `media`/`media-technical` or whose name contains "Media", or a legacy media appointment. The admin role alone does not grant this section, and a CSGB admin without a media position is blocked. Because the check is name-based, an approved position on the **Drama/Creative Media Team** also qualifies.

> [!NOTE]
> If the President needs to manage sermons, add an approved Media Team position for that account; the admin role alone will not open the section.

1. Open `/dashboard/sermons`.
2. Select **"New Sermon"**.
3. Complete:
   - **Sermon Title**
   - **Preacher**
   - **Date Preached**
   - **Primary Scripture Reference**
   - **Sermon Series** and **Topical Tags**
   - **Media URL** (direct audio, optional)
   - **Duration**
   - **Spotify Episode URL**
   - **YouTube Video URL**
   - **Notes**
4. Select **"Save Changes"**.

Platform behaviour:
- There is **no separate YouTube Music input** in the sermon form. When a YouTube video is present, the public card derives the YouTube Music link from the video ID.
- The public player shows Spotify and YouTube Music links only when the corresponding URLs exist.

#### Syncing External Feeds
- The toolbar button is **"Sync Feeds (RSS)"** (while running: *"Syncing Feeds..."*).
- The sync ingests the configured Spotify/Anchor RSS feed and YouTube playlist RSS feed.
- Known sermons are resolved from a curated catalogue first; unknown titles can be enriched through the **YouTube Data API v3** when `YOUTUBE_API_KEY` is set.
- The Sermon Vault and homepage also trigger the same sync at most once every 15 minutes in the background.
- Dashboard search covers title, preacher, scripture reference, series, and topics. Filters include topic and origin (`all`, `synced`, `manual`), with card and table views.

---

## Chapter 5: Team Leaders & Assistant Leads (14 Ministry Teams)

This chapter applies to the leaders of all 14 ECCF teams:
*Bible Study/Sunday School, Prayer, Protocol, Financial, Choir, Ushering, Drama/Creative Media, Outreach, Welfare/Medical, Academic, Colporteur/Library, Technical, Media, Decoration.*

### 5.1 Team Workforce Verification (`/dashboard/workers`)
When a student registers at `/register` and selects your team, the membership appears in your team roster with status **Pending**.

#### Verifying a Team Member:
1. Open `/dashboard/workers`.
2. The roster is scoped to the team(s) you lead. Media leads see the fellowship-wide directory for celebrations and media coverage.
3. Review the worker's name, contact details, hall, team(s), and status.
4. Meet the worker during rehearsals or meetings to confirm commitment.
5. Choose:
   - **Approve / Verify** — the membership becomes **Verified** and the worker sees the green verified badge on `/register/status`.
   - **Decline / Reject** — the membership becomes **Declined**.
6. Pending approvals are highlighted in the page banner and counted in the header.

> [!IMPORTANT]
> Verification is per team membership. A worker serving in multiple teams can be verified by each team independently. Assistant Team Leads with an approved assistant position receive the same scoped team access as the lead. Media leads see the fellowship-wide directory but cannot approve or decline memberships.

### 5.2 Logging Team Meeting Attendance (`/dashboard/attendance`)
1. Open `/dashboard/attendance`.
2. If your account has both consoles, select the **"Team Rosters"** tab; otherwise the team roster is the default view (labelled e.g. *"Choir Roster"*).
3. Select **"Take Meeting Attendance"**.
4. Complete:
   - **Meeting Title** (e.g., *Weekly Choir Rehearsal*)
   - **Date**
   - **Team** (fixed to your team for team leads; admins can choose)
5. Use the **Team Member Roster**:
   - Tick each worker who was present.
   - Use the select-all / clear controls for fast roster updates.
6. Add **Guest / Visiting Attendees** as a count.
7. Add **Meeting Notes / Agenda Summary** (e.g., *"Late arrival due to 400L lab practicals"*).
8. The form displays `workers + guests = total present`.
9. Select **"Save Attendance (n)"**.

Past meeting records can be reopened to review the saved roster.

### 5.3 Sending Team Emails
1. Open `/dashboard/workers`.
2. Use **"Broadcast Mail"** (admins) or **"Email Workers"** (team leads) in the header, or the expanded **Send Email to Workers** dialog.
3. Choose the recipient scope available to your role (your team for team leads; all workers for admins).
4. Write the subject and message, then send through the configured Resend integration.

> [!NOTE]
> There is no separate "Send Team Email" page. The workflow lives inside the workforce directory and respects the same team scoping.

---

## Chapter 6: Hall Representatives (Hostel / Campus Residence Pastors)

Hall Reps serve as on-the-ground spiritual shepherds in the student hostels. Approved Hall positions are recorded as `kind: 'hall'` positions for Halls 1–8.

### 6.1 Scoped Hall Roster (`/dashboard/workers`)
- Hall Reps see workers residing in their assigned hall.
- The header identifies the hall (e.g., *"Hall 3 Workers Roster"*).
- Use the roster to identify students living near one another, encourage room fellowships, and coordinate morning devotions.
- Hall Reps cannot open the fellowship-wide directory or verify team memberships.

### 6.2 First-Timers Follow-Up (`/dashboard/first-timers`)
When a fresher or new student submits the Connect card or First Timer form and indicates your hall:
1. Open `/dashboard/first-timers`.
2. The console is scoped to your hall; the header and filter badge confirm the scope.
3. Review the visitor's name, phone number, hall/room, department, level, and visit date.
4. Use the follow-up actions:
   - **Copy phone number** for a call or SMS.
   - **WhatsApp** to open a pre-filled greeting that introduces you as the hall representative and invites the visitor to fellowship.
   - **View details** for the full record.
5. Coordinate with the Outreach team for campus-wide follow-up.

> [!NOTE]
> The current console does **not** provide a free-text follow-up notes field or an assignment workflow. Record keeping beyond the initial contact happens outside the dashboard (e.g., team records or a supervised follow-up log).

### 6.3 Welfare, Prayer & Attendance
- **Welfare (`/dashboard/welfare`):** Hall Reps can review welfare requests and mark cases resolved.
- **Prayer (`/dashboard/prayer-requests`):** Hall Reps can read and copy prayer requests.
- **Attendance (`/dashboard/attendance`):** Hall Reps can open the Attendance section and use the team-roster view. The **General Headcount** console is limited to admins and Ushering team members; Hall Reps cannot record general service headcounts unless they also hold an Ushering position.

---

## Chapter 7: Financial Secretary & Finance Team

The Financial Secretary and Finance team manage fellowship accounting with strict transparency and accountability. The ledger is stored as private operational drafts.

### 7.1 Financial Overview & KPI Cards (`/dashboard/finance`)
- **Total Inflow (Income):** Sum of all recorded income entries.
- **Total Outflow (Expense):** Sum of all recorded expense entries.
- **Net Balance:** Total Inflow minus Total Outflow.

The KPI cards recalculate immediately when a transaction is added. There is no semester selector; the figures reflect the records currently loaded in the ledger.

### 7.2 Recording Income Transactions
1. Open `/dashboard/finance`.
2. Select **"Record Transaction"**.
3. Complete:
   - **Type:** `Income`
   - **Category:** `Tithe`, `Offering`, `Project Levy`, `Online Giving`, or `Miscellaneous`
   - **Amount (NGN)**
   - **Date**
   - **Description** (e.g., *Sunday 2nd Service Tithes & Offerings*)
4. Select **"Save Transaction"**.

> [!IMPORTANT]
> The current modal has **no Flutterwave Reference input**. Online giving is a manual bank transfer, so the Finance team records the deposit and describes the narration in the Description field. Existing legacy records may still display a stored Flutterwave reference.

### 7.3 Recording Expense Disbursements
1. Select **"Record Transaction"**.
2. Complete:
   - **Type:** `Expense`
   - **Category:** `Welfare Disbursement`, `Utility Expense`, `Event Expense`, or `Miscellaneous`
   - **Amount (NGN)**
   - **Date**
   - **Description** (e.g., *Approved medical emergency support for a 200L student*)
3. Select **"Save Transaction"**.

### 7.4 Exporting Financial Ledgers for Audit
1. Apply the desired search and type filters. The export uses the **currently filtered rows**, not the entire ledger.
2. Select **"Export CSV"**.
3. The download is named `eccf_finance_ledger_YYYY-MM-DD.csv` and contains:
   - Transaction Date
   - Type
   - Amount (NGN)
   - Category
   - Description
   - Flutterwave Ref (legacy column; blank for new records)
4. Submit the file for monthly CSGB reviews and business meetings.

### 7.5 Controls & Confidentiality
- Finance records are private drafts, not published Sanity documents.
- The **finance** role can access the Finance section and finance statistics only. It cannot open first-timers, prayer requests, or welfare.
- The President (admin) can access both finance and pastoral sections.
- Manual reconciliation is required for every bank-transfer gift; the platform does not verify payments automatically.

---

## Chapter 8: Outreach, Evangelism & Follow-up Team

The Outreach & Evangelism team leads soul-winning initiatives on campus and ensures every visitor is embraced into the fellowship family.

### 8.1 First-Timers Intake Console (`/dashboard/first-timers`)
Access:
- **Admins:** all visitors across all halls.
- **Outreach Team Lead / Follow-up Lead:** all visitors campus-wide, with an *"Outreach Coordinator"* badge.
- **Hall Reps:** visitors in their assigned hall only.
- **Other roles:** no access.

The console shows:
- **Total first-timers** (or *"First-Timers in Hall"* for Hall Reps)
- **Ready for WhatsApp** — visitors with a usable phone number
- **Hostel coverage** — number of halls represented, or the assigned hall

Table columns:
- **Visitor** — full name and phone number (with copy control)
- **Campus Residence** — hall and room
- **Department & Level**
- **Date Visited** — the recorded visit date (set automatically at intake)
- **Follow-up Action**

### 8.2 Follow-Up Workflow
1. Filter by hall (admins/outreach) or use the hall-scoped view (Hall Reps).
2. Search by name, phone number, department, level, hall, or room.
3. Contact the visitor within 24 hours using the copy-phone or WhatsApp action.
4. Coordinate a room visitation with the Hall Rep for that residence.
5. Invite the visitor to an operational team and to foundation Bible study classes.

> [!NOTE]
> The dashboard does not store follow-up notes, assign follow-up partners, or track "contacted" status. Those coordination steps must happen in the team's own process. The console is an intake and contact-launch tool, not a CRM pipeline.

---

## Chapter 9: Intercessory Prayer Team

The Prayer Team provides spiritual coverage for the fellowship, students' academic success, campus revival, and individual petitions.

### 9.1 Prayer Requests Feed (`/dashboard/prayer-requests`)
1. Open `/dashboard/prayer-requests`.
2. Review requests submitted through `/connect`.
3. Use the filter pills:
   - **All**
   - **This Week**
   - **Named**
   - **Anon**
4. Sort by **Newest first** or **Oldest first**.
5. Search by submitter name or keyword.
6. Use the **Copy** action to copy a formatted request for a prayer chain or intercession group.

### 9.2 Intercessory Protocols
- Treat every request with total confidentiality.
- Do not forward identifiable requests outside authorised leadership channels.
- Lift requests during daily/weekly prayer chains.
- The current feed has **no "mark answered" or "resolved" status**. Answered-prayer records are maintained outside the dashboard; do not promise members that the portal tracks resolution.

> [!CAUTION]
> Finance-role accounts cannot open this feed. Prayer requests are intentionally separated from financial administration.

---

## Chapter 10: Welfare & Medical Team

The Welfare & Medical team demonstrates Christ's love by supporting students experiencing practical, physical, and financial difficulties.

### 10.1 Managing Welfare Cases (`/dashboard/welfare`)
1. Open `/dashboard/welfare`.
2. Review the incoming assistance requests and the pending/resolved counters.
3. Search by student name, phone number, or request details, and filter by **All Statuses**, **Pending**, or **Resolved**.
4. Each case shows the student's name, request details, and submission date. The requester's phone number is shown only when your role is authorized to contact them.
5. **Investigation:** Contact the student discreetly, assess the need, and agree on support with the President/Welfare lead.
6. **Resolution:** After support is delivered, select **"Mark Resolved"** on a pending case. The status changes to **Resolved** and the counters update.

> [!NOTE]
> The console records only `Pending` and `Resolved`. There is no assignment owner, case-severity field, or internal case-note thread. Sensitive case discussion belongs in the Welfare team's private channels.

> [!IMPORTANT]
> Welfare section access and requester-phone visibility are separate. CSGB officers and approved **Welfare & Medical** positions see the requester phone. Other welfare-capable roles, including general Team Leads and Hall Reps, can open and resolve cases but see the request without the phone number. Finance and Media roles cannot open the section.

### 10.2 Coordination
- Confirm the available budget with the Financial Secretary before committing fellowship funds.
- Record the corresponding disbursement in `/dashboard/finance` under `Welfare Disbursement`.
- Hall Reps can view and resolve cases for students in their care, but they do not see requester phone numbers.

---

## Chapter 11: Ushering Team (Headcount & Statistics)

The Ushering team oversees orderliness during services and provides accurate headcount data for campus attendance tracking.

### 11.1 Logging Service Headcounts (`/dashboard/attendance`)
The **General Headcount** console is available to admins and members of the Ushering team. Team leads from other teams use the team-roster console instead.

1. Open `/dashboard/attendance`.
2. Select the **"General Headcount"** tab.
3. Complete:
   - **Service Date** — use the date picker or the **Today**, **Last Sun**, or **Last Wed** shortcuts.
   - **Service Type** — `Sunday Service`, `Wednesday Bible Study`, `Academic Service`, or `Special Programme`.
   - **Service Theme / Special Programme Title** (optional), e.g. *Communion Service* or *Freshers Welcome Service*.
   - **Total Headcount Counted** — the direct count from the ushers' tally sheets. Use the **+10**, **+50**, and **+100** controls for quick adjustments.
4. Optionally open **Detailed Demographic Breakdown** and enter Men, Women, Children, and First-Timers. This breakdown does **not** change the total automatically. If it is complete, select **"Set Total (n)"** to copy the breakdown sum into the total field.
5. Add **Ushering Notes / Special Observations** for special factors (e.g., *"Service held during examination week; heavy rain"*).
6. Submit the record.

> [!IMPORTANT]
> The old manual claimed the system summed Men + Women + Children in real time. It does not. The usher enters the total directly; the breakdown is an optional cross-check with a manual **Set Total** helper. First-Timers are included in the breakdown sum.

### 11.2 Where the Numbers Appear
- The attendance console shows services counted, average Sunday attendance, peak attendance, and the latest service.
- The dashboard overview's **Last service attendance** card reflects the most recent recorded service.
- There is **no attendance trends chart** in the current dashboard.

---

## Chapter 12: Technical Administrators & Platform Engineers

This chapter covers environment configuration, private-draft storage, QA, integrations, and deployment.

### 12.1 Environment Variables & Secret Configuration
Maintain these in Vercel (frontend) and the Sanity project. Never expose server-side values with a `NEXT_PUBLIC_` prefix.

| Variable Name | Environment | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Frontend | Sanity project identifier (`ynnot4j0`) |
| `NEXT_PUBLIC_SANITY_DATASET` | Frontend | Target dataset (`production`) |
| `SANITY_READ_TOKEN` | Frontend (server) | Authenticated reads, including private drafts |
| `SANITY_WRITE_TOKEN` | Frontend (server) | Mutations, intake, ledgers, broadcasts |
| `ENCRYPTION_KEY` | Frontend (server) | 32-byte key for AES-256-GCM field encryption |
| `HMAC_PEPPER` | Frontend (server) | Secret for HMAC-SHA256 blind indexing |
| `ENCRYPTION_LEGACY_KEYS` | Frontend (server) | Comma-separated keys for planned re-encryption only |
| `HMAC_LEGACY_PEPPERS` | Frontend (server) | Comma-separated legacy peppers for lookup migration |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Frontend | Clerk browser authentication |
| `CLERK_SECRET_KEY` | Frontend (server) | Clerk token verification and user management |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Frontend | `/login` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Frontend | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Frontend | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Frontend | `/dashboard` |
| `NEXT_PUBLIC_APP_URL` | Frontend | Canonical public base URL used in emailed verification links. Falls back to `VERCEL_URL` and then `http://localhost:3000` |
| `CRON_SECRET` | Frontend (server) | Authorises scheduled sermon sync requests |
| `SANITY_WEBHOOK_SECRET` | Frontend (server) | Verifies the announcement webhook |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Frontend | Cloudflare Turnstile browser widget |
| `TURNSTILE_SECRET_KEY` | Frontend (server) | Turnstile verification; public actions fail closed in production when missing |
| `GOOGLE_APPS_SCRIPT_WEBHOOK_URL` | Frontend (server) | Private Google Apps Script bridge for Drive uploads |
| `GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET` | Frontend (server) | Shared HMAC secret for the Apps Script bridge |
| `SPOTIFY_RSS_URL` | Frontend (server) | Spotify/Anchor podcast RSS source |
| `YOUTUBE_RSS_URL` | Frontend (server) | YouTube playlist RSS source |
| `YOUTUBE_API_KEY` | Frontend (server) | Optional YouTube Data API v3 key for sermon enrichment; read by `lib/sermonSync.ts` but not listed in the sample `.env.example` |
| `RESEND_API_KEY` | Frontend (server) | Transactional email and announcement broadcasts |
| `RESEND_FROM_EMAIL` | Frontend (server) | Canonical sender for every Resend flow (worker verification, worker email, announcements, subscriber welcome, intake notifications). Must use a verified Resend domain. The fallback `onboarding@resend.dev` only delivers to the Resend account owner |
| `EMAIL_FROM` | Frontend (server) | Accepted alias for `RESEND_FROM_EMAIL`; use one or the other |
| `NOTIFY_EMAIL` | Frontend (server) | Administrative notification recipient |
| `DASHBOARD_MOCK_AUTH` | Local only | `1` enables a mock dashboard session outside production |
| `DASHBOARD_DATA_SOURCE` | Local only | `mock` or `sanity`; production should use Sanity |
| `DASHBOARD_MOCK_STATE` | Local only | `empty`, `error`, or `slow` to exercise UI states |

> [!IMPORTANT]
> There are **no Flutterwave environment variables and no payment-verification route** in the current frontend. Any deployment checklist that still lists Flutterwave keys is obsolete.

> [!IMPORTANT]
> Every server-side Resend send site now uses `lib/email/from.ts`, which resolves `RESEND_FROM_EMAIL`, then `EMAIL_FROM`, then the development fallback `onboarding@resend.dev`. The fallback logs a warning and Resend will only deliver from it to the Resend account owner. Production delivery to other recipients requires a verified Resend domain and a sender address on that domain.
>
> `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are no longer required. Clerk is the only identity provider. If an older deployment used `NEXTAUTH_SECRET` or `AUTH_SECRET` as an encryption or HMAC key, add the old value to `ENCRYPTION_LEGACY_KEYS` and `HMAC_LEGACY_PEPPERS` before upgrading. Do not delete those keys until `node scripts/check-encryption-health.mjs` reports zero unreadable fields.

### 12.2 Private Operational Drafts & Data Scripts
Operational records (`worker`, `attendanceLedger`, `financeLedger`, `firstTimer`, `welfareRequest`, `prayerRequest`) must remain in the private draft space. Public queries are limited to published content.

Useful scripts in `eccf-frontend/scripts`:

```bash
# Confirm that unauthenticated Sanity queries return zero operational documents
node scripts/verify-unauthenticated.mjs

# Encrypt legacy plaintext phone/room fields
node scripts/encrypt-existing-data.mjs

# Move existing operational records into private drafts
node scripts/migrate-operational-records-to-drafts.mjs

# Remove obsolete worker fields after the multi-position migration
node scripts/remove-legacy-worker-fields.mjs

# Verify that decryption works with the configured key set
node scripts/test-decryption.mjs

# Report unreadable encrypted fields without printing plaintext values
node scripts/check-encryption-health.mjs
```

> [!IMPORTANT]
> Local and production must use the same `ENCRYPTION_KEY` and `HMAC_PEPPER`. If either environment previously used different values, add the old values to `ENCRYPTION_LEGACY_KEYS` / `HMAC_LEGACY_PEPPERS` before rotating. Run `node scripts/check-encryption-health.mjs` (or `npm run check:encryption`) and expect `Unreadable encrypted fields: 0`. See **`eccf-frontend/docs/ENCRYPTION_KEY_UNIFICATION.md`** for the full runbook.
>
> `NEXTAUTH_SECRET` and `AUTH_SECRET` are **not** read implicitly by `lib/encryption.ts` or the health check any more. Any deployment that encrypted or blind-indexed records with those values must place them in `ENCRYPTION_LEGACY_KEYS` and `HMAC_LEGACY_PEPPERS` before deploying this change; otherwise existing fields become unreadable.
>
> A failed decryption now returns an empty string rather than `[Encrypted Data]`; a blank phone, room, or birthday field can indicate a key mismatch. Always run data scripts against a staging dataset first and keep an encrypted backup before re-encryption.

### 12.3 QA Portal (`/qa`)
The QA portal is a public, `noindex` testing checklist at `/qa`. It is not Clerk-gated.

- **Tester identity:** Each tester registers a display name and a **4-digit PIN**. The session token is stored in `localStorage`; the PIN/token hashes are stored in the Sanity `qaChecklist` document. This prevents one tester from overwriting another tester's ticks.
- **Current suites and test counts (61 total):**
  1. *Public Website & Media* — **18 tests**
  2. *Forms & Applications (Connect & Register)* — **13 tests**
  3. *Sign In & Mobile App Experience* — **6 tests**
  4. *Roles & Permissions (Who Can See What)* — **8 tests**
  5. *Leader Dashboard & Daily Tasks* — **11 tests**
  6. *External Services, Emails & Safety* — **5 tests**
- **Defect tracker:** Testers and leads can report defects with severity (`Blocker`, `High`, `Med`, `Low`) and status (`Open`, `In Progress`, `Resolved`).
- **Lead override:** A lead can reset checklists or override another tester's state; normal testers cannot overwrite each other.

Non-technical testers can follow the plain-English steps on each card before every semester release.

### 12.4 Integrations, Webhooks & Scheduled Jobs
- **`/api/sync-sermons`** — scheduled/manual sermon sync endpoint, protected by `CRON_SECRET`.
- **`/api/webhooks/announcement`** — Sanity announcement webhook, verified with `SANITY_WEBHOOK_SECRET`.
- **`/api/upload-drive`** — private Google Apps Script bridge for large media uploads.
- **Background sermon sync** — triggered by homepage/Sermon Vault visits, throttled to one run per 15 minutes per server instance.
- **PWA manifest** — `/manifest.webmanifest`, scope and start URL `/dashboard`, with shortcuts for Attendance, Workers, First Timers, and Finance.

### 12.5 Local Development & Deployment Commands
**Frontend (`eccf-frontend`):**
```bash
npm install
npm run dev      # local development
npm run lint     # ESLint
npm run build    # production build
npm start        # serve the production build
```

**Sanity Studio (`eccf-backend`):**
```bash
npm install
npm run dev      # local Studio
npm run build    # build the Studio bundle
npm run deploy   # deploy the hosted Studio
```

Production frontend hosting is Vercel; the Studio is hosted at `https://eccf-backend.sanity.studio`.

### 12.6 Preview & Developer Surfaces
- **Public preview:** append `?preview=true` or enable Next.js Draft Mode. A preview banner appears and draft content is read with `SANITY_READ_TOKEN`.
- **Preview bridge:** `/api/preview` enables Draft Mode; `/api/exit-preview` disables it.
- **Dashboard preview:** the middleware forwards `x-preview-mode` for preview requests.
- **UI states gallery:** `/dashboard/dev/ui-states` is development-only and returns 404 outside the mock-auth development environment.
- **Announcement preview:** `/announcements/preview` is an internal preview route.

---

## Appendix A: Role-Based Access Control (RBAC) Matrix

Roles are `admin`, `team_lead`, `finance`, and `hall_rep`. Position flags refine what a role can see: `isPresident`, `isCSGB`, `isFinance`, `isWelfare`, `isMedia`, `isOutreachLeader`, and `isUsheringTeam`. "CSGB Admin" below means an admin who is not the President.

| Section / Capability | President (admin) | CSGB Admin (admin) | Team Lead (scoped) | Outreach Lead | Media Lead | Hall Rep | Finance |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Overview** | Full | Full | People | People | People | Hall People | Finance only |
| **Executive Appointments** | **Full** | No | No | No | No | No | No |
| **Workforce Directory** | All | All | Own team | Own team | All (directory) | Own hall | No |
| **Verify Team Memberships** | All | All | Own team | Own team | No | No | No |
| **General Service Headcount** | Yes | Yes | Ushering lead only | No | No | No | No |
| **Team Meeting Rosters** | All teams | All teams | Own team | Own team | Own team | Team roster view | No |
| **Finance Ledger** | Full | Full | No | No | No | No | **Full** |
| **First-Timers Intake** | All | All | Outreach only | All | No | **Own hall** | No |
| **Welfare Requests** | Yes | Yes | Yes | Yes | Yes | Yes | No |
| **Welfare Requester Phone** | Yes | Yes | Welfare team only | No | No | No | No |
| **Prayer Petitions** | Yes | Yes | Yes | Yes | Yes | Yes | No |
| **Sunday Announcements** | **Full** | **Full** | CSGB positions only | CSGB positions only | CSGB positions only | No | No |
| **Sermon Management** | Media position only | Media position only | No | No | **Full** | No | No |
| **QA Portal (`/qa`)** | Public | Public | Public | Public | Public | Public | Public |
| **Sanity Studio CMS** | Admin | Admin | No | No | **Primary editor** | No | No |

Notes:
- **CSGB membership** is granted to the President, Vice Presidents, the General Secretary, and Prayer leadership (including a Prayer Team Lead). An `admin` role is always CSGB. A team lead in another team does not automatically get announcements access.
- **Media access** is position-based (team key `media`/`media-technical` or a team name containing "Media", including Drama/Creative Media); the admin role alone does not grant sermon management. Media leads also see the fellowship-wide worker directory for birthday and celebration content.
- **Outreach access** is a scoped first-timers grant for team leads whose team key/name matches Outreach, Evangelism, or Follow-up.
- **Finance access** is granted to CSGB members and approved Finance Team positions. The standalone `finance` role cannot see pastoral sections.
- **Hall Reps** are scoped by their approved hall position. They see hall workers and hall first-timers, but do not verify team memberships or log general service headcounts.
- **Welfare contact visibility** is narrower than section access: only CSGB members and approved Welfare & Medical positions see the requester phone; other roles with welfare access see the case without the number.
- A Hall Rep who also holds an approved **Ushering** position gains the Ushering capabilities, including the General Headcount console.
- Direct URL access is still guarded even when a navigation item is hidden. Unauthorised attempts show an access-denied response/toast.

---

## Appendix B: Route & URL Directory

### Public Routes
- `/` — Homepage (Hero, Who We Are, Service Schedule, Latest Sermons, Gallery, Giving, Social, Plan a Visit)
- `/about` — About ECCF (Mission, Story, Milestones, Pillars, Leadership, Teams)
- `/sermons` — Sermon Vault (Multi-platform player, search, topics)
- `/announcements` — Sunday Announcements Hub (Category filters, search, email subscribe)
- `/announcements/preview` — Internal announcement preview
- `/connect` — Connect Hub (First Timer, Welfare, Prayer)
- `/give` — Giving & Stewardship (Bank transfer details only)
- `/privacy` — Operational Privacy & Data Protection Policy
- `/register` — Worker Registration & Profile Update Intake
- `/register/status` — Registration Status Tracker (Clerk sign-in required)
- `/qa` — QA Testing Portal (public, noindex)

### Authentication Routes
- `/login` — Clerk sign-in (Google or emailed code) plus "Activate Login"
- `/sign-up` — Clerk sign-up for first-time Exco users

### Dashboard Routes (Protected)
- `/dashboard` — Executive Overview Dashboard
- `/dashboard/executives` — Presidential Executive Appointments Console
- `/dashboard/workers` — Workforce Directory, Verification & Email
- `/dashboard/attendance` — Attendance Hub (General Headcount & Team Rosters)
- `/dashboard/finance` — Finance Ledger & Expense Tracking
- `/dashboard/first-timers` — First-Timers Follow-Up Console
- `/dashboard/welfare` — Student Welfare Requests
- `/dashboard/prayer-requests` — Intercessory Prayer Petitions Feed
- `/dashboard/announcements` — Sunday Announcements & Broadcast Engine
- `/dashboard/sermons` — Sermon Management & RSS Sync
- `/dashboard/dev/ui-states` — Development-only UI state gallery

### Backend CMS
- `https://eccf-backend.sanity.studio` — Sanity Studio Content Management System (project `ynnot4j0`, dataset `production`)

---

## Appendix C: Operational Troubleshooting & FAQ

### Q1: Why do I get an "Access Denied" toast when clicking a dashboard tab?
**A:** Your approved positions do not grant that section. Examples: `/dashboard/executives` is President-only; `/dashboard/finance` is for admins and Finance positions; `/dashboard/sermons` is for Media leaders only (an approved media position; the admin role alone is not enough). Contact the President or Technical Administrator if a position needs to be recorded or corrected.

### Q2: How do I change the photo or headline on the website homepage?
**A:** In Sanity Studio:
1. Log in at `https://eccf-backend.sanity.studio`.
2. Open **Homepage & Site Settings**.
3. Under **Homepage Hero**, update the headline, top pill, or collage photos.
4. Select **Publish**.
The site is server-rendered on each request, so the change appears on the next load.

### Q3: Why does a newly registered worker not appear in the verified list?
**A:** New team memberships start as `Pending`. The team leader must open `/dashboard/workers`, review the worker, and approve the membership. Multi-team workers must be verified by each team separately. Executive appointments approved by the President automatically verify the related team membership.

### Q4: How does a worker check their membership or executive status?
**A:** The worker signs in at `/login` and opens `/register/status`. The page requires Clerk authentication to protect private room and contact data. It shows each team membership and each position with `Pending`, `Verified/Approved`, or `Declined` status. There is no phone-number + OTP lookup on the status page.

### Q5: How do we record a bank-transfer tithe or offering?
**A:** The Financial Secretary opens `/dashboard/finance`, selects **Record Transaction**, chooses `Income`, selects `Tithe`/`Offering`/`Online Giving`, enters the amount, date, and a description containing the narration or depositor name, then saves. There is no automated Flutterwave reconciliation and no reference field in the current modal.

### Q6: Why can't visitors install the app from the public website?
**A:** The PWA is scoped to `/dashboard` and its install prompts are deliberately suppressed on public pages. Leaders install it from the **Install App** button in the dashboard top bar. The app still requires network access and a valid Clerk session.

### Q7: Why is there no executive application in `/register`?
**A:** Executive appointments are not self-service applications. The President creates/approves positions in `/dashboard/executives`. The intake form collects worker profile and team membership only. `/register/status` directs workers to the President or Technical Administrator when a position is missing.

### Q8: Why did "Sync Feeds (RSS)" not import a new sermon?
**A:** Check that `SPOTIFY_RSS_URL` and `YOUTUBE_RSS_URL` point to the current feeds, that the sermon exists in one of them, and that `YOUTUBE_API_KEY` is set if YouTube enrichment is expected. The sync is also throttled: public visits trigger it at most once every 15 minutes per server instance. Use the dashboard button for an immediate run.

### Q9: I forgot my QA tester PIN. What do I do?
**A:** QA is not Clerk-authenticated, and PINs are stored only as hashes, so a forgotten PIN cannot be recovered. The QA Lead reset clears test progress, not tester registrations. Register under a slightly different display name (for example, add your surname initial) with a new 4-digit PIN, or ask the technical administrator to remove the old tester record in Sanity. Tester tokens live in `localStorage`; clearing site data signs you out but does not recover the PIN.

### Q10: Why are announcements not appearing on the homepage?
**A:** By design. The current homepage has no announcements ticker. Publish the notice and it appears on `/announcements`; use the per-card **Broadcast** action to email subscribers.

---

*Document approved for fellowship operations by the Central Student Governing Board (CSGB) — Edo State University Christian Campus Fellowship.*
