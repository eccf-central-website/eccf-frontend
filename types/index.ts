/**
 * Shared TypeScript types — eccf-frontend
 *
 * These types mirror the Sanity schemas defined in eccf-backend.
 * Keep in sync with eccf-backend/schemaTypes/ whenever a schema changes.
 * Source of truth for field shape is ALWAYS eccf-backend — never modify
 * field names or types here without a corresponding schema change there.
 *
 * ⚠️  RBAC/Privacy rule: Worker.phoneNumber and Worker.roomNumber must be
 * stripped from any payload before it reaches the browser. These fields
 * are marked optional here to reflect that they are withheld from
 * client-facing responses.
 *
 * ⚠️  Naming: The worker's operational group is `team`, never `unit`.
 */

// ---------------------------------------------------------------------------
// Worker (CRM)
// ---------------------------------------------------------------------------

/** Valid RBAC roles. Must stay in sync with eccf-backend worker schema. */
export type WorkerRole = 'admin' | 'team_lead' | 'finance' | 'hall_rep'

export type ExcoPosition =
  | 'President'
  | "Vice President - Admin / Brothers' Coordinator"
  | "Vice President - Evangelism / Sisters' Coordinator"
  | 'General Secretary'
  | 'Financial Secretary'
  | 'Academic Coordinator'
  | 'Choir Director'
  | 'Music Director / Head of Instrumentalists'
  | 'Decoration Director'
  | 'Drama Director'
  | 'Colporteur'
  | 'Librarian'
  | 'Media Coordinator'
  | 'Assist. Media Coordinator'
  | 'Welfare & Medical Coordinator'
  | 'Outreach Coordinator'
  | 'Prayer Coordinator'
  | 'Head of Protocol Team'
  | 'Editorial Publication Head'
  | 'Publicity / Social Media Head'
  | 'Technical Coordinator'
  | 'Assist. Technical Coordinator'
  | 'Head Usher'

/** Valid fellowship teams. Must stay in sync with eccf-backend worker schema. */
export type FellowshipTeam =
  | string
  | { _ref: string; _type: 'reference' }
  | { _id: string; name: string }

export interface WorkerPosition {
  _key?: string
  kind: 'team' | 'hall' | 'csgb'
  team?: { _ref?: string; _id?: string; name?: string; key?: string } | string
  teamId?: string
  teamKey?: string
  teamName?: string
  hall?: string
  office?: string
  rank?: 'lead' | 'assistant'
  status: 'pending' | 'approved' | 'rejected'
  decidedBy?: string
  decidedAt?: string
}

export interface WorkerMembership {
  _key?: string
  team?: { _ref?: string; _id?: string; name?: string; key?: string } | string
  teamId?: string
  teamKey?: string
  teamName?: string
  status: 'pending' | 'verified' | 'rejected'
  decidedBy?: string
  decidedAt?: string
}

export interface PendingExecutiveApplication {
  workerId: string
  fullName: string
  email: string
  hall: string
  profileImageUrl?: string
  createdAt?: string
  position: {
    key: string
    kind: 'csgb' | 'hall' | 'team'
    office?: string
    hall?: string
    rank?: 'lead' | 'assistant'
    teamId?: string
    teamKey?: string
    teamName?: string
    status: 'pending' | 'approved' | 'rejected'
    submittedAt?: string
  }
}

export interface Worker {
  _id: string
  _type: 'worker'
  fullName: string
  firstName?: string
  middleName?: string
  lastName?: string
  email?: string
  /** Operational group — NEVER use `unit`, always `team` */
  team: FellowshipTeam
  /** Multiple operational teams if worker is assigned to multiple */
  teams?: FellowshipTeam[]
  hall: string
  /**
   * ⚠️ ENCRYPTED — stripped before any client-facing response.
   * Present only in server-side contexts after decryption.
   */
  roomNumber?: string
  /**
   * ⚠️ ENCRYPTED — stripped before any client-facing response.
   * This is the unique identifier used for upsert deduplication.
   */
  phoneNumber?: string
  /** ⚠️ One-way HMAC-SHA256 blind index for deterministic lookups */
  phoneBlindIndex?: string
  birthDate?: string // ISO date string YYYY-MM-DD
  /** ⚠️ One-way HMAC-SHA256 blind index for birthday matching/tracking */
  birthdayBlindIndex?: string
  birthMonth?: number
  birthDay?: number
  role?: WorkerRole
  excoPosition?: ExcoPosition
  isExcoApproved?: boolean
  requestedRole?: WorkerRole
  /** Workforce verification by Team Leader: 'pending' | 'verified' | 'rejected' */
  verificationStatus?: 'pending' | 'verified' | 'rejected'
  verifiedAt?: string
  verifiedBy?: string
  /** Operational team this worker leads/heads (if Team Lead or Assistant) */
  leadingTeam?: FellowshipTeam
  positions?: WorkerPosition[]
  memberships?: WorkerMembership[]
  /** ⚠️ Never sent to client — server-side auth verification only */
  passwordHash?: string
  profileImageUrl?: string
  createdAt?: string
  updatedAt?: string
  /** Human-readable audit trail, e.g. "Changed Team from Choir to Media on 2026-05-10" */
  updateLog?: string[]
}

/** Safe worker type — phoneNumber, roomNumber, passwordHash, phoneBlindIndex, and birthdayBlindIndex guaranteed stripped for browser */
export type SafeWorker = Omit<Worker, 'phoneNumber' | 'roomNumber' | 'passwordHash' | 'phoneBlindIndex' | 'birthdayBlindIndex'>

// ---------------------------------------------------------------------------
// JWT Session (NextAuth)
// ---------------------------------------------------------------------------

/** JWT token shape — exactly {id, role, team}. Do not extend without updating CLAUDE.md */
export interface ECCFSession {
  id: string
  name?: string
  role: WorkerRole
  /**
   * Operational team name of the authenticated worker, resolved to a plain
   * string (teamUnit name) at sign-in — always `team`, never `unit`.
   */
  team: string
  /** All operational teams this worker belongs to */
  teams?: string[]
  leadingTeam?: string
  excoPosition?: string
  hall?: string
  email?: string
}

// ---------------------------------------------------------------------------
// Attendance Ledger
// ---------------------------------------------------------------------------

export interface AttendanceLedger {
  _id: string
  _type: 'attendanceLedger'
  date: string // ISO date YYYY-MM-DD
  serviceType:
    | 'Sunday Service'
    | 'Wednesday Bible Study'
    | 'Academic Service'
    | 'Team Meeting'
    | 'Exco Meeting'
    | 'Special Programme'
  meetingTitle?: string
  team?: FellowshipTeam
  totalCount: number
  menCount?: number
  womenCount?: number
  childrenCount?: number
  firstTimersCount?: number
  notes?: string
  attendees?: Pick<Worker, '_id' | 'fullName' | 'team'>[]
  loggedBy: Pick<Worker, '_id' | 'fullName'>
}

export interface AttendanceWorkerItem {
  _id: string
  fullName: string
  team: string
  teams?: string[]
  hall: string
}

// ---------------------------------------------------------------------------
// Finance Ledger
// ---------------------------------------------------------------------------

export type FinanceType = 'Income' | 'Expense'

export type FinanceCategory =
  | 'Tithe'
  | 'Offering'
  | 'Project Levy'
  | 'Online Giving'
  | 'Welfare Disbursement'
  | 'Utility Expense'
  | 'Event Expense'
  | 'Miscellaneous'

export interface FinanceLedger {
  _id: string
  _type: 'financeLedger'
  transactionDate: string // ISO date YYYY-MM-DD
  type: FinanceType
  amount: number // NGN
  category: FinanceCategory
  description?: string
  /** Present only for online giving entries — written after server-side Flutterwave verification */
  flutterwaveRef?: string
}

// ---------------------------------------------------------------------------
// Sermon Vault
// ---------------------------------------------------------------------------

export interface SermonVault {
  _id: string
  _type: 'sermonVault'
  title: string
  preacher: string
  series?: string
  topics?: string[]
  datePreached: string // ISO date YYYY-MM-DD
  scriptureReference: string
  /** Direct URL to audio/video. Streams from source — never proxied through Vercel */
  mediaUrl?: string
  duration?: string
  spotifyUrl?: string
  youtubeUrl?: string
  youtubeMusicUrl?: string
  spotifyEmbedId?: string
  youtubeVideoId?: string
  thumbnailUrl?: string
  isAutoSynced?: boolean
  notes?: string
}

// ---------------------------------------------------------------------------
// Announcement (Sunday Announcements Engine)
// ---------------------------------------------------------------------------

/** Portable Text block — rendered by @portabletext/react */
export type PortableTextBlock = {
  _type: 'block'
  _key: string
  style?: string
  children: {_type: 'span'; _key: string; text: string; marks?: string[]}[]
  markDefs?: {_type: string; _key: string; [key: string]: unknown}[]
}

export interface Announcement {
  _id: string
  _type: 'announcement'
  title: string
  category?: 'WEEKLY SERVICES' | 'ACADEMIC & EXAMS' | 'BIBLE STUDY' | 'EXCO UPDATES' | 'GENERAL' | string
  isPinned?: boolean
  time?: string
  location?: string
  eventDate?: string // ISO date YYYY-MM-DD
  publishDate: string // ISO date YYYY-MM-DD
  content: string | PortableTextBlock[]
  /** Controls visibility — false = draft, even if publishDate has passed */
  isPublished: boolean
  sendBroadcastOnPublish?: boolean
  sentToSubscribers?: boolean
  sentAt?: string
  _createdAt?: string
  _updatedAt?: string
}

// ---------------------------------------------------------------------------
// Data Intake (First-Timers, Welfare, Prayer Requests)
// ---------------------------------------------------------------------------

export interface FirstTimer {
  _id: string
  _type: 'firstTimer'
  fullName: string
  firstName?: string
  lastName?: string
  /**
   * ⚠️ ENCRYPTED — stripped before any client-facing response.
   */
  phoneNumber: string
  /** ⚠️ One-way HMAC-SHA256 blind index for deterministic lookups */
  phoneBlindIndex?: string
  hall?: string
  /**
   * ⚠️ ENCRYPTED — stripped before any client-facing response.
   */
  roomNumber?: string
  department?: string
  level?: string
  dateVisited: string // ISO date YYYY-MM-DD
  createdAt?: string
}

export interface WelfareRequest {
  _id: string
  _type: 'welfareRequest'
  name: string
  /**
   * ⚠️ ENCRYPTED — stripped before any client-facing response.
   */
  phoneNumber: string
  /** ⚠️ One-way HMAC-SHA256 blind index for deterministic lookups */
  phoneBlindIndex?: string
  requestDetails: string
  status: 'Pending' | 'Resolved'
  dateSubmitted: string // ISO date string
}

export interface PrayerRequest {
  _id: string
  _type: 'prayerRequest'
  name?: string
  request: string
  dateSubmitted: string // ISO date string
}

export interface Subscriber {
  _id: string
  _type: 'subscriber'
  email: string
  name?: string
  subscribedAt: string // ISO datetime
  isActive: boolean
}

/** Browser-safe intake types — phoneNumber, roomNumber, and phoneBlindIndex guaranteed stripped */
export type SafeFirstTimer = Omit<FirstTimer, 'phoneNumber' | 'roomNumber' | 'phoneBlindIndex'>
export type SafeWelfareRequest = Omit<WelfareRequest, 'phoneNumber' | 'phoneBlindIndex'>

// ---------------------------------------------------------------------------
// Exco Dashboard view models (browser-safe — never carry phoneNumber/roomNumber)
// ---------------------------------------------------------------------------

/** Worker CRM row: SafeWorker with `team` resolved to a display name. */
export type WorkerRow = Omit<SafeWorker, 'team' | 'teams' | 'leadingTeam' | '_type'> & {
  /** Resolved teamUnit name (or legacy string value) — never `unit` */
  team: string
  /** All resolved teams if worker belongs to multiple teams */
  teams?: string[]
  /** Resolved operational team this worker heads/leads (if applicable) */
  leadingTeam?: string
}

export interface AttendanceAttendee {
  _id: string
  fullName: string
  team?: string
  teams?: string[]
}

/** Attendance ledger row: attendee references collapsed to a count, with optional attendee details. */
export type AttendanceRow = Omit<AttendanceLedger, '_type' | 'attendees' | 'team'> & {
  attendeeCount: number
  teamName?: string
  attendees?: AttendanceAttendee[]
}

/** Finance ledger row as listed in the dashboard. */
export type FinanceRow = Omit<FinanceLedger, '_type'>

/** First-timer intake row as listed in the dashboard for follow-up coordination. */
export interface FirstTimerRow {
  _id: string
  _type?: 'firstTimer'
  fullName: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  hall?: string
  roomNumber?: string
  department?: string
  level?: string
  dateVisited: string
  createdAt?: string
}

