/**
 * Maintenance helpers — shared by the public layout and middleware.
 *
 * Page paths are stored in Sanity as plain route strings ("/", "/about",
 * "/sermons"). A selected route also covers everything nested beneath it, so
 * ticking "/sermons" closes "/sermons" and any future "/sermons/[slug]" page.
 */

/** Normalise a pathname: strips query/hash, trailing slashes and duplicates. */
export function normalisePath(pathname: string): string {
  const clean = (pathname || '/').split('?')[0].split('#')[0].replace(/\/+$/, '')
  return clean === '' ? '/' : clean
}

/** Normalise a pathname and map legacy aliases cleanly to canonical routes. */
function normaliseRoute(pathname: string): string {
  const normalised = normalisePath(pathname)
  if (normalised === '/announcements' || normalised.startsWith('/announcements/')) {
    return `/updates${normalised.slice('/announcements'.length)}`
  }
  return normalised
}

/**
 * True when `pathname` sits on (or under) one of the pages marked for
 * maintenance in Sanity.
 */
export function isUnderMaintenance(pathname: string, pages?: string[] | null): boolean {
  if (!pathname || !Array.isArray(pages) || pages.length === 0) return false

  const current = normaliseRoute(pathname)

  return pages.some((page) => {
    const route = normaliseRoute(page)
    if (route === '/') return current === '/'
    return current === route || current.startsWith(`${route}/`)
  })
}
