/**
 * =============================================================================
 * data-utils.spec.ts — UUID & date helpers
 * -----------------------------------------------------------------------------
 * WHAT THIS PROVES:
 *   - uuid() is well-formed and unique across calls.
 *   - randomInt() respects inclusive bounds.
 *   - date helpers format as yyyy-mm-dd and order correctly (future > today).
 * =============================================================================
 */
import { test, expect } from '@playwright/test';
import { uuid, randomInt, pickOne } from '../../src/utils/random.js';
import {
  toIsoDate,
  futureIso,
  todayIso,
  addDays,
} from '../../src/utils/date.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test.describe('Phase 5 · Data utilities', () => {
  test('uuid() produces unique, RFC-4122 v4 ids', () => {
    const a = uuid();
    const b = uuid();
    expect(a).toMatch(UUID_V4);
    expect(a).not.toBe(b);
  });

  test('randomInt() respects inclusive bounds', () => {
    for (let i = 0; i < 50; i++) {
      const n = randomInt(1, 6);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(6);
    }
  });

  test('pickOne() returns an element from the array', () => {
    const items = ['a', 'b', 'c'] as const;
    expect(items).toContain(pickOne(items));
  });

  test('date helpers format as yyyy-mm-dd', () => {
    expect(todayIso()).toMatch(ISO_DATE);
    expect(futureIso(7)).toMatch(ISO_DATE);
    expect(toIsoDate(new Date('2026-07-01T12:00:00Z'))).toBe('2026-07-01');
  });

  test('addDays() advances the date correctly without mutating input', () => {
    const base = new Date('2026-07-01T00:00:00Z');
    const later = addDays(base, 5);
    expect(toIsoDate(later)).toBe('2026-07-06');
    expect(toIsoDate(base)).toBe('2026-07-01'); // original untouched
  });

  test('futureIso() is strictly after todayIso()', () => {
    expect(futureIso(10) > todayIso()).toBe(true);
  });
});
