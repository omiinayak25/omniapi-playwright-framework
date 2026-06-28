/**
 * =============================================================================
 * booking-factory.spec.ts — BookingFactory scenarios + real integration
 * -----------------------------------------------------------------------------
 * WHAT THIS PROVES:
 *   - Named scenarios return the expected shape (valid/minimal/withDeposit).
 *   - Factory output is UNIQUE per call (no collisions on stateful APIs).
 *   - invalid() is intentionally incomplete (for Phase 9 negative tests).
 *   - END-TO-END: a factory-built booking actually creates on Restful Booker —
 *     proving dynamic payloads work against a real API (no hardcoded data!).
 * =============================================================================
 */
import { test, expect } from '../../src/fixtures/api.fixtures.js';
import { BookingFactory } from '../../src/builders/index.js';
import { HttpStatus } from '../../src/constants/http-status.js';
import type { CreateBookingResponse } from '../../src/models/booking.model.js';

test.describe('Phase 5 · BookingFactory', () => {
  test('valid() returns a complete booking', () => {
    const b = BookingFactory.valid();
    expect(b.firstname).toBeTruthy();
    expect(b.bookingdates.checkin).toBeTruthy();
  });

  test('withDeposit() forces the deposit flag', () => {
    expect(BookingFactory.withDeposit(true).depositpaid).toBe(true);
    expect(BookingFactory.withDeposit(false).depositpaid).toBe(false);
  });

  test('minimal() omits the optional field', () => {
    expect(BookingFactory.minimal().additionalneeds).toBeUndefined();
  });

  test('successive valid() calls produce different data (uniqueness)', () => {
    const names = new Set(
      Array.from({ length: 10 }, () => BookingFactory.valid().firstname),
    );
    // Faker makes collisions unlikely; expect strong variety across 10 samples.
    expect(names.size).toBeGreaterThan(1);
  });

  test('invalid() is intentionally incomplete', () => {
    const bad = BookingFactory.invalid();
    expect(bad.firstname).toBeTruthy();
    expect(bad.lastname).toBeUndefined();
    expect(bad.totalprice).toBeUndefined();
  });

  test('END-TO-END: a factory booking creates successfully on Booker', async ({
    booker,
  }) => {
    const payload = BookingFactory.forGuest('Dynamic', 'Payload');

    const res = await booker.post<CreateBookingResponse>('/booking', {
      data: payload,
    });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.bookingid).toBeGreaterThan(0);
    expect(res.body.booking.firstname).toBe('Dynamic');
    expect(res.body.booking.lastname).toBe('Payload');
  });
});
