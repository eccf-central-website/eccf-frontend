/**
 * GROQ Queries — eccf-frontend
 *
 * Centralised query strings for all Sanity data fetching (ADR-002 Compliant).
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
    duration,
    spotifyUrl,
    youtubeUrl,
    youtubeMusicUrl,
    spotifyEmbedId,
    youtubeVideoId,
    isAutoSynced,
    mediaUrl
  }
`

/** Fetch latest 3 sermons for homepage */
export const LATEST_SERMONS_QUERY = `
  *[_type == "sermonVault"] | order(datePreached desc)[0...3] {
    _id,
    title,
    preacher,
    series,
    topics,
    datePreached,
    scriptureReference,
    duration,
    spotifyUrl,
    youtubeUrl,
    youtubeMusicUrl
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
    duration,
    spotifyUrl,
    youtubeUrl,
    youtubeMusicUrl,
    spotifyEmbedId,
    youtubeVideoId,
    isAutoSynced,
    mediaUrl
  }
`

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

/** Fetch all live (published) announcements, pinned first, then newest */
export const ANNOUNCEMENTS_QUERY = `
  *[_type == "announcement" && isPublished != false] | order(coalesce(isPinned, false) desc, coalesce(eventDate, publishDate) desc, _createdAt desc) {
    _id,
    title,
    content,
    category,
    isPinned,
    eventDate,
    publishDate,
    time,
    location
  }
`

// ---------------------------------------------------------------------------
// Gallery & Moments
// ---------------------------------------------------------------------------

/** Fetch all active gallery items, featured first, then newest */
export const GALLERY_QUERY = `
  *[_type == "galleryItem"] | order(coalesce(featured, false) desc, _createdAt desc) {
    _id,
    title,
    caption,
    category,
    featured,
    "imageUrl": image.asset->url
  }
`

// ---------------------------------------------------------------------------
// Operational Teams
// ---------------------------------------------------------------------------

/** Fetch all operational team units */
export const TEAMS_QUERY = `
  *[_type == "teamUnit"] | order(order asc, _createdAt asc) {
    _id,
    name,
    tag,
    leadName,
    description,
    order,
    "imageUrl": image.asset->url
  }
`

// ---------------------------------------------------------------------------
// Service Schedule
// ---------------------------------------------------------------------------

/** Fetch weekly service schedule ordered by sequence */
export const SERVICES_QUERY = `
  *[_type == "serviceSchedule"] | order(order asc) {
    _id,
    day,
    time,
    title,
    badge,
    description,
    tags,
    location,
    order
  }
`

// ---------------------------------------------------------------------------
// Site Settings & Hero Configuration
// ---------------------------------------------------------------------------

/** Fetch site settings / hero configuration */
export const SITE_SETTINGS_QUERY = `
  *[_type == "siteSettings"][0] {
    _id,
    heroHeadlineStart,
    heroAccentWord,
    heroHeadlineEnd,
    heroCredo,
    heroParagraph,
    liveStatusText,
    "heroPhotoUrl": heroPhoto.asset->url,
    statsActiveMembers,
    statsWeeklyServices,
    statsCampusLegacy,
    visitContactPerson,
    visitWhatsAppNumber,
    fellowshipEmail
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
