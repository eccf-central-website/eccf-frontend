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
export type WorkerRole = 'admin' | 'hall_rep' | 'finance'

/** Valid fellowship teams. Must stay in sync with eccf-backend worker schema. */
export type FellowshipTeam =
  | 'Media'
  | 'Choir'
  | 'Welfare'
  | 'Academic'
  | 'Outreach'
  | 'Prayer'
  | 'Ushering'
  | 'Protocol'
  | 'Technical'
  | 'Finance'
  | 'Exco'

export interface Worker {
  _id: string
  _type: 'worker'
  fullName: string
  /** Operational group — NEVER use `unit`, always `team` */
  team: FellowshipTeam
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
  birthDate?: string // ISO date string YYYY-MM-DD
  role?: WorkerRole
  profileImageUrl?: string
  createdAt?: string
  updatedAt?: string
  /** Human-readable audit trail, e.g. "Changed Team from Choir to Media on 2026-05-10" */
  updateLog?: string[]
}

/** Safe worker type — phoneNumber and roomNumber guaranteed stripped for browser */
export type SafeWorker = Omit<Worker, 'phoneNumber' | 'roomNumber'>

// ---------------------------------------------------------------------------
// JWT Session (NextAuth)
// ---------------------------------------------------------------------------

/** JWT token shape — exactly {id, role, team}. Do not extend without updating CLAUDE.md */
export interface ECCFSession {
  id: string
  role: WorkerRole
  /** Operational team of the authenticated worker — always `team`, never `unit` */
  team: FellowshipTeam
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
    | 'Team Meeting'
    | 'Exco Meeting'
    | 'Special Programme'
  totalCount: number
  attendees?: Pick<Worker, '_id' | 'fullName' | 'team'>[]
  loggedBy: Pick<Worker, '_id' | 'fullName'>
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
  content: PortableTextBlock[]
  publishDate: string // ISO date YYYY-MM-DD
  /** Controls visibility — false = draft, even if publishDate has passed */
  isPublished: boolean
}
