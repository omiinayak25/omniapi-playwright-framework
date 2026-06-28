/**
 * =============================================================================
 * response-assertions.spec.ts — Multi-dimensional response validation
 * -----------------------------------------------------------------------------
 * CONCEPT:
 *   A correct response is more than status 200. We validate ACROSS dimensions
 *   using the reusable validator helpers: status, headers, response TIME (SLA),
 *   response SIZE, JSON-ness, arrays, and nested fields. Each helper reads as a
 *   guarantee the API must uphold.
 * =============================================================================
 */
import { test, expect } from '../../src/fixtures/api.fixtures.js';
import {
  expectStatus,
  expectOk,
  expectHeaderContains,
  expectHeaderPresent,
  expectResponseTimeUnder,
  expectResponseSizeUnder,
  expectJsonBody,
  expectArrayBody,
} from '../../src/validators/index.js';
import { HttpStatus } from '../../src/constants/http-status.js';

test.describe('Phase 6 · Response assertions (dimensions)', () => {
  test('status, ok, and JSON content-type', async ({ products }) => {
    const res = await products.getById(1);

    expectStatus(res, HttpStatus.OK);
    expectOk(res);
    expectJsonBody(res);
    expectHeaderPresent(res, 'content-type');
    expectHeaderContains(res, 'content-type', 'application/json');
  });

  test('response time is within a 5s SLA', async ({ products }) => {
    const res = await products.getById(1);
    expectResponseTimeUnder(res, 5000);
  });

  test('a single-product body is reasonably small (< 50KB)', async ({
    products,
  }) => {
    const res = await products.getById(1);
    expectResponseSizeUnder(res, 50_000);
  });

  test('collection body is an array of the expected length', async ({
    posts,
  }) => {
    const res = await posts.getAll();
    expectArrayBody(res, 1);
    expect(res.body.length).toBe(100);
  });

  test('nested object and array fields are reachable and typed', async ({
    products,
  }) => {
    const res = await products.getAll(3, 0);

    // Envelope -> array -> nested item field (nested access).
    expect(res.body.products).toHaveLength(3);
    const first = res.body.products[0];
    expect(first).toBeDefined();
    expect(typeof first?.title).toBe('string');

    // DYNAMIC assertion: a rule applied across EVERY array element.
    for (const p of res.body.products) {
      expect(
        p.price,
        `product ${p.id} should have a positive price`,
      ).toBeGreaterThan(0);
    }
  });
});
