/**
 * =============================================================================
 * date.ts — Date helpers for request payloads
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   APIs expect dates in specific formats (Restful Booker wants yyyy-mm-dd) and
 *   date logic (checkin < checkout) is easy to get subtly wrong inline. These
 *   helpers centralize formatting and arithmetic so builders/tests stay clean.
 *
 * BEST PRACTICE:
 *   Keep date math in ONE place. Off-by-one and timezone bugs in dates are a
 *   classic source of flaky tests — a single tested helper removes that risk.
 * =============================================================================
 */

/** Format a Date as an ISO calendar date "yyyy-mm-dd" (UTC, no time component). */
export function toIsoDate(date: Date): string {
  // toISOString() -> "2026-07-01T00:00:00.000Z"; take the date part.
  const [datePart] = date.toISOString().split('T');
  return datePart ?? '';
}

/** Return a NEW Date `days` after the given date (does not mutate input). */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Today's date as "yyyy-mm-dd". */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/** A date `days` in the future as "yyyy-mm-dd". */
export function futureIso(days: number): string {
  return toIsoDate(addDays(new Date(), days));
}
