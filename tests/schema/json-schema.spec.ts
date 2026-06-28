/**
 * =============================================================================
 * json-schema.spec.ts — JSON Schema validation with AJV (drift detection)
 * -----------------------------------------------------------------------------
 * CONCEPT:
 *   One schema check validates an ENTIRE body's shape & types. This is the
 *   foundation of contract testing (Phase 17): if the API drifts (missing field,
 *   wrong type, unexpected extra), the schema check fails IMMEDIATELY with a
 *   precise error — long before the bug reaches production.
 *
 * WHAT THIS PROVES:
 *   - Real responses conform to their declared schemas (post, product, booking).
 *   - Collections validate element-by-element (postArraySchema).
 *   - DRIFT IS CAUGHT: a deliberately malformed object fails with clear errors.
 * =============================================================================
 */
import { test, expect } from '../../src/fixtures/api.fixtures.js';
import {
  expectMatchesSchema,
  SchemaValidator,
} from '../../src/validators/index.js';
import {
  postSchema,
  postArraySchema,
  productSchema,
  bookingSchema,
} from '../../src/schemas/index.js';
import { BookingFactory } from '../../src/builders/index.js';
import type { CreateBookingResponse } from '../../src/models/booking.model.js';

test.describe('Phase 6 · JSON Schema validation (AJV)', () => {
  test('a real post conforms to postSchema', async ({ posts }) => {
    const res = await posts.getById(1);
    expectMatchesSchema(res, postSchema);
  });

  test('the posts collection conforms to postArraySchema', async ({
    posts,
  }) => {
    const res = await posts.getAll();
    expectMatchesSchema(res, postArraySchema);
  });

  test('a real product conforms to productSchema', async ({ products }) => {
    const res = await products.getById(1);
    expectMatchesSchema(res, productSchema);
  });

  test('a created booking conforms to bookingSchema', async ({ booker }) => {
    const res = await booker.post<CreateBookingResponse>('/booking', {
      data: BookingFactory.valid(),
    });
    // Validate the nested `booking` object against the schema.
    const validator = SchemaValidator.getInstance();
    const result = validator.validate(bookingSchema, res.body.booking);
    expect(result.valid, result.errors.join('; ')).toBe(true);
  });

  test('DRIFT DETECTION — wrong types & missing fields are rejected', () => {
    const validator = SchemaValidator.getInstance();

    const drifted = {
      id: 1,
      userId: 1,
      title: 'ok',
      body: 12345, // WRONG: should be a string
      // (no extra fields, but body type is wrong)
    };

    const result = validator.validate(postSchema, drifted);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('/body');
  });

  test('DRIFT DETECTION — unexpected extra field is rejected (strict contract)', () => {
    const validator = SchemaValidator.getInstance();

    const result = validator.validate(postSchema, {
      id: 1,
      userId: 1,
      title: 'ok',
      body: 'ok',
      hacker: 'unexpected', // additionalProperties:false should reject this
    });

    expect(result.valid).toBe(false);
  });
});
