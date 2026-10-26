import { APP_TIMEZONE } from "../shared/constants";

/**
 * Returns current UTC date string in ISO 8601 format.
 */
export function nowUtc(): string {
  return new Date().toISOString();
}

/**
 * Add specified number of minutes to a date (defaults to now) and returns ISO string.
 */
export function addMinutes(
  minutes: number,
  baseDate: Date = new Date(),
): string {
  const result = new Date(baseDate.getTime() + minutes * 60 * 1000);
  return result.toISOString();
}

/**
 * Add specified number of hours to a date (defaults to now) and returns ISO string.
 */
export function addHours(hours: number, baseDate: Date = new Date()): string {
  const result = new Date(baseDate.getTime() + hours * 60 * 60 * 1000);
  return result.toISOString();
}

/**
 * Add specified number of days to a date (defaults to now) and returns ISO string.
 */
export function addDays(days: number, baseDate: Date = new Date()): string {
  return addHours(days * 24, baseDate);
}

/**
 * Check if an ISO date string is expired compared to now
 */
export function isExpired(isoDateString: string): boolean {
  return new Date(isoDateString).getTime() <= Date.now();
}

/**
 * Format date in Vietnam timezone YYYY-MM-DD
 */
export function formatVnDateOnly(
  date: Date | string | number = new Date(),
): string {
  const d = date instanceof Date ? date : new Date(date);
  // Get date in Asia/Ho_Chi_Minh
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}

/**
 * Format a Date or date string to Vietnam timezone (Asia/Ho_Chi_Minh).
 */
export function formatVnDateTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Convert a Date to a localized Date string in Vietnam timezone.
 */
export function toVnTimeString(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString("vi-VN", { timeZone: APP_TIMEZONE });
}
