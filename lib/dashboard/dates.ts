/**
 * Calendar boundaries in the fellowship's timezone (Africa/Lagos, UTC+1,
 * no DST). Pure and browser-safe.
 *
 * "This month" and "the last 7 days" must follow the Lagos calendar, not
 * UTC: between 00:00 and 01:00 Lagos time a UTC boundary still points at
 * the previous day (or, on the 1st, the previous month). Stored dates such
 * as `dateVisited` and `transactionDate` are local YYYY-MM-DD strings, so
 * boundaries are YYYY-MM-DD strings too and compare lexically.
 */

export const FELLOWSHIP_TIME_ZONE = 'Africa/Lagos'

const DAY_MS = 24 * 60 * 60 * 1000

// en-CA formats as YYYY-MM-DD.
const isoDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: FELLOWSHIP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const monthNameFormat = new Intl.DateTimeFormat('en-NG', { timeZone: FELLOWSHIP_TIME_ZONE, month: 'long' })

/** Lagos calendar date of an instant, as YYYY-MM-DD. */
export function lagosDate(now: Date = new Date()): string {
  return isoDateFormat.format(now)
}

/** First day of the current Lagos month, as YYYY-MM-DD. */
export function lagosMonthStart(now: Date = new Date()): string {
  return `${lagosDate(now).slice(0, 8)}01`
}

/** Lagos calendar date `days` days before today, as YYYY-MM-DD. */
export function lagosDaysAgo(days: number, now: Date = new Date()): string {
  const [y, m, d] = lagosDate(now).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) - days * DAY_MS).toISOString().slice(0, 10)
}

/** Name of the current Lagos month, e.g. "October". */
export function lagosMonthLabel(now: Date = new Date()): string {
  return monthNameFormat.format(now)
}

/**
 * Whole Lagos calendar days from `iso` to `now` (0 = today, 1 = yesterday).
 * Accepts a YYYY-MM-DD date (already a local calendar date) or a full ISO
 * timestamp (converted to its Lagos date first).
 */
export function lagosDaysBetween(iso: string, now: Date = new Date()): number {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : lagosDate(new Date(iso))
  const toUtc = (value: string) => {
    const [y, m, d] = value.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((toUtc(lagosDate(now)) - toUtc(day)) / DAY_MS)
}
