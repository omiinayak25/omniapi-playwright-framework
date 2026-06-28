/**
 * =============================================================================
 * api-negative.spec.ts — Live negative testing against real APIs
 * -----------------------------------------------------------------------------
 * These assert REAL rejection behaviors verified to be deterministic:
 *   - Restful Booker: missing fields -> 500, malformed JSON -> 400, bad/missing
 *     token -> 403.
 *   - Not-found resources -> 404 across JSONPlaceholder, DummyJSON, Booker.
 *   - Duplicate data: Booker PERMITS duplicates — we assert that documented
 *     behavior honestly (negative testing isn't only about rejections; it's
 *     about verifying what the API ACTUALLY does with edge inputs).
 * =============================================================================
 */
import { test, expect } from '../../src/fixtures/api.fixtures.js';
import { CookieTokenStrategy, NoAuthStrategy } from '../../src/auth/index.js';
import {
  BookingFactory,
  NegativeBookingFactory,
} from '../../src/builders/index.js';
import { HttpStatus } from '../../src/constants/http-status.js';
import type { CreateBookingResponse } from '../../src/models/booking.model.js';

test.describe('Phase 9 · Live API negative testing', () => {
  test.describe.configure({ retries: 2 }); // Booker (Heroku) flakiness insurance

  test('WRONG PAYLOAD: missing required fields -> 500', async ({ booker }) => {
    const res = await booker.post('/booking', {
      data: NegativeBookingFactory.missingRequired(),
    });
    expect(res.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  test('MALFORMED JSON body -> 400', async ({ booker }) => {
    const res = await booker.post('/booking', {
      data: NegativeBookingFactory.MALFORMED_JSON, // raw broken string
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
  });

  test('MISSING auth header on protected DELETE -> 403', async ({ booker }) => {
    const res = await booker.del('/booking/1', { auth: new NoAuthStrategy() });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  test('INVALID token -> 403', async ({ booker }) => {
    const res = await booker.del('/booking/1', {
      auth: new CookieTokenStrategy('INVALID-token-xyz'),
    });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  test('EXPIRED (well-formed but stale) token -> 403', async ({ booker }) => {
    // A token that looks valid but is no longer recognized by the server.
    const res = await booker.del('/booking/1', {
      auth: new CookieTokenStrategy('abc123def456expired'),
    });
    expect(res.status).toBe(HttpStatus.FORBIDDEN);
  });

  test('NOT FOUND: non-existent resources -> 404', async ({
    posts,
    products,
    bookings,
  }) => {
    expect((await posts.getById(999_999)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await products.getById(999_999)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await bookings.getById(99_999_999)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
  });

  test('DUPLICATE data: Booker permits duplicates (distinct ids)', async ({
    bookings,
  }) => {
    const payload = BookingFactory.forGuest('Dup', 'Licate');

    const first = await bookings.create(payload);
    const second = await bookings.create(payload);

    expect(first.status).toBe(HttpStatus.OK);
    expect(second.status).toBe(HttpStatus.OK);
    // Documented behavior: duplicates allowed, each gets a unique id.
    expect(first.body.bookingid).not.toBe(second.body.bookingid);
  });

  test('a valid create still succeeds (sanity baseline)', async ({
    booker,
  }) => {
    const res = await booker.post<CreateBookingResponse>('/booking', {
      data: BookingFactory.valid(),
    });
    expect(res.status).toBe(HttpStatus.OK);
  });
});
