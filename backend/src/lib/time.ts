import { APP_TIMEZONE } from "../shared/constants";

/**
 * Returns current UTC date string in ISO 8601 format.
 */
export function nowUtc(): string {
  return new Date().toISOString();
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
