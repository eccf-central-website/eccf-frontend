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
    thumbnailUrl,
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
    youtubeMusicUrl,
    spotifyEmbedId,
    youtubeVideoId,
    thumbnailUrl
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
    thumbnailUrl,
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

/**
 * Homepage Fellowship Moments gallery.
 *
 * "Featured on Homepage" is a true visibility switch: only published gallery
 * items with the box ticked are returned, so unticking a photo hides it
 * from the public site without deleting it from the Studio.
 *
 * Manual "Display Order" wins (1, 2, 3 …). Photos left blank follow the
 * numbered ones, newest upload first.
 */
export const GALLERY_QUERY = `
  *[_type == "galleryItem" && coalesce(featured, false) == true]
    | order(coalesce(displayOrder, 9999) asc, _createdAt desc) {
    _id,
    title,
    caption,
    category,
    featured,
    displayOrder,
    image,
    "imageUrl": image.asset->url
  }
`

// ---------------------------------------------------------------------------
// Operational Teams & Leadership
// ---------------------------------------------------------------------------

/** Fetch all operational team units */
export const TEAMS_QUERY = `
  *[_type == "teamUnit"] | order(order asc, _createdAt asc) {
    _id,
    name,
    key,
    description,
    order,
    image,
    "imageUrl": image.asset->url
  }
`

/** Fetch executive officers and leadership for About page */
export const EXCOS_QUERY = `
  *[_type == "publicLeader"] | order(order asc, fullName asc) {
    _id,
    fullName,
    excoPosition,
    role,
    profileImage,
    "profileImageUrl": profileImage.asset->url,
    bio,
    badgeLabel
  }
`

/** Fetch dedicated About page document */
export const ABOUT_PAGE_QUERY = `
  *[_type == "aboutPage"][0] {
    _id,
    heroBadge,
    heroSubheading,
    heroHeadline,
    heroSubtitle,
    missionCreed,
    heroPhoto,
    "heroPhotoUrl": heroPhoto.asset->url,
    metricOperationalTeams,
    metricResidenceHalls,
    metricWeeklyEncounters,
    metricStudentImpact,
    storyHeadline,
    storyLead,
    storyParagraphs,
    storyQuote,
    storyPhoto1,
    "storyPhoto1Url": storyPhoto1.asset->url,
    storyPhoto2,
    "storyPhoto2Url": storyPhoto2.asset->url,
    milestones[] {
      _key,
      year,
      badge,
      title,
      desc
    },
    pillarsHeadline,
    pillarsLead,
    pillar1Title,
    pillar1Subtitle,
    pillar1Scripture,
    pillar1Desc,
    pillar1Points,
    pillar2Title,
    pillar2Subtitle,
    pillar2Scripture,
    pillar2Desc,
    pillar2Points,
    pillar3Title,
    pillar3Subtitle,
    pillar3Scripture,
    pillar3Desc,
    pillar3Points,
    leadershipHeadline,
    leadershipLead,
    teamsHeadline,
    teamsLead,
    ctaTag,
    ctaHeadline,
    ctaSubtitle,
    showHero,
    showHistory,
    showPillars,
    showLeadership,
    showTeams,
    showCta
  }
`

/** Fetch core pillars from the About Page to display on the homepage Who We Are section */
export const HOMEPAGE_PILLARS_QUERY = `
  *[_type == "aboutPage"][0]{
    pillar1Title,
    pillar1Subtitle,
    pillar1Desc,
    pillar2Title,
    pillar2Subtitle,
    pillar2Desc,
    pillar3Title,
    pillar3Subtitle,
    pillar3Desc
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
    heroHeadline,
    heroAccentWord,
    heroCredo,
    heroParagraph,
    liveStatusText,
    heroPhoto,
    "heroPhotoUrl": heroPhoto.asset->url,
    whoWeArePhotoMinister,
    "whoWeArePhotoMinisterUrl": whoWeArePhotoMinister.asset->url,
    whoWeArePhotoAudience,
    "whoWeArePhotoAudienceUrl": whoWeArePhotoAudience.asset->url,
    statsActiveMembers,
    statsWeeklyServices,
    statsCampusLegacy,
    visitContactPerson,
    visitWhatsAppNumber,
    visitPhoto,
    "visitPhotoUrl": visitPhoto.asset->url,
    givingBankName,
    givingAccountName,
    givingAccountNumber,
    givingInstructions,
    fellowshipEmail,
    socialYouTube,
    socialInstagram,
    socialFacebook,
    socialTikTok,
    socialTelegram,
    socialTwitter,
    socialWhatsApp,
    socialBannerLabel,
    socialBannerHeadline1,
    socialBannerHeadline2,
    socialBannerHeadline3,
    footerNewsletterHeading,
    footerNewsletterDescription,
    footerBrandTitle,
    footerBrandSubtitle,
    footerMissionStatement,
    footerLogo,
    "footerLogoUrl": footerLogo.asset->url,
    footerMeetingVenue,
    footerServiceSummary,
    footerCopyright,
    footerNavColumns[] {
      title,
      links[] {
        label,
        url,
        isExternal,
        highlight
      }
    },
    heroTopPill,
    heroCollagePhotos[] {
      _key,
      alt,
      tag,
      "imageUrl": asset->url
    },
    launcherLinks[] {
      title,
      subtitle,
      url,
      iconType,
      isExternal
    },
    maintenancePages,
    maintenanceHeadline,
    maintenanceMessage,
    maintenanceEta
  }
`
