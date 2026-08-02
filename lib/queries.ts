/**
 * GROQ Queries — eccf-frontend
 *
 * Centralised query strings for all Sanity data fetching.
 * Public queries (Sermons, Announcements, Gallery, Teams, SiteSettings) are used in Server Components.
 * Authenticated queries (Worker, Ledgers) must only be called from Server Actions.
 *
 * Keep field projections in sync with eccf-backend schemas and types/index.ts.
 */

// ---------------------------------------------------------------------------
// Sermon Vault
// ---------------------------------------------------------------------------

/** Fetch all published sermons, newest first */
export const SERMONS_QUERY = `
  *[_type == "sermonVault"] | order(datePreached desc) {
    _id,
    title,
    preacher,
    series,
    topics,
    datePreached,
    scriptureReference,
    mediaUrl
  }
`

/** Fetch a single sermon by ID */
export const SERMON_BY_ID_QUERY = `
  *[_type == "sermonVault" && _id == $id][0] {
    _id,
    title,
    preacher,
    series,
    topics,
    datePreached,
    scriptureReference,
    mediaUrl
  }
`

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

/** Fetch all live (published) announcements, newest first */
export const ANNOUNCEMENTS_QUERY = `
  *[_type == "announcement" && isPublished == true] | order(publishDate desc) {
    _id,
    title,
    content,
    publishDate,
    isPublished
  }
`

/** Fetch the single most recent live announcement */
export const LATEST_ANNOUNCEMENT_QUERY = `
  *[_type == "announcement" && isPublished == true] | order(publishDate desc)[0] {
    _id,
    title,
    content,
    publishDate
  }
`

// ---------------------------------------------------------------------------
// Gallery Items & Team Units
// ---------------------------------------------------------------------------

/** Fetch all published gallery items */
export const GALLERY_QUERY = `
  *[_type == "galleryItem"] | order(_createdAt desc) {
    _id,
    title,
    category,
    "imageUrl": image.asset->url,
    eventDate
  }
`

/** Fetch all operational team units */
export const TEAMS_QUERY = `
  *[_type == "teamUnit"] | order(order asc) {
    _id,
    name,
    description,
    "imageUrl": image.asset->url,
    leadName
  }
`

/** Fetch site settings */
export const SITE_SETTINGS_QUERY = `
  *[_type == "siteSettings"][0] {
    siteTitle,
    motto,
    contactEmail,
    fellowshipLocation
  }
`

// ---------------------------------------------------------------------------
// Worker CRM — server-side only, used in Server Actions after auth check
// ---------------------------------------------------------------------------

/** Fetch all workers — for admin use only. Strip PII before sending to client. */
export const ALL_WORKERS_QUERY = `
  *[_type == "worker"] | order(fullName asc) {
    _id,
    fullName,
    team,
    hall,
    role,
    birthDate,
    profileImageUrl,
    createdAt,
    updatedAt
  }
`

/** Fetch a single worker by phone number for upsert matching */
export const WORKER_BY_PHONE_QUERY = `
  *[_type == "worker" && phoneNumber == $phoneNumber][0] {
    _id,
    fullName,
    team,
    hall,
    roomNumber,
    phoneNumber,
    role,
    birthDate,
    updateLog
  }
`
