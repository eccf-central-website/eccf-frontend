/**
 * Display formatters for the Exco Dashboard — Intl only, no date or number
 * libraries. Pure and browser-safe. Dates render in the fellowship's
 * timezone (Africa/Lagos) wherever the code runs.
 */

import { FELLOWSHIP_TIME_ZONE, lagosDaysBetween } from './dates'

const nairaFormat = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

const countFormat = new Intl.NumberFormat('en-NG')

const dateFormat = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeZone: FELLOWSHIP_TIME_ZONE })

const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** ₦86,500 · -₦4,000 */
export function formatNaira(amount: number): string {
  return nairaFormat.format(amount)
}

/** 1,234 */
export function formatCount(value: number): string {
  return countFormat.format(value)
}

/**
 * A date-only YYYY-MM-DD value is a Lagos calendar date. Anchor it at noon
 * UTC so formatting it in Lagos can never slip to a neighbouring day.
 */
function toInstant(iso: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00Z`) : new Date(iso)
}

/** "8 Oct 2026" */
export function formatDate(iso: string): string {
  return dateFormat.format(toInstant(iso))
}

/** "today", "yesterday", "3 days ago", "5 weeks ago" — Lagos calendar days. */
export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const days = lagosDaysBetween(iso, now)
  if (Math.abs(days) < 14) return relativeFormat.format(-days, 'day')
  if (Math.abs(days) < 60) return relativeFormat.format(-Math.round(days / 7), 'week')
  return relativeFormat.format(-Math.round(days / 30), 'month')
}

/** Value for <time dateTime>: the date as stored (YYYY-MM-DD or full ISO). */
export function toDateTimeAttr(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : toInstant(iso).toISOString()
}
