/**
 * =============================================================================
 * response.validator.ts — Reusable, expressive response assertions
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   Assertions like "responded within 2s", "has JSON content-type", or "matches
 *   schema" recur in EVERY suite. Centralizing them as named helpers gives DRY,
 *   intent-revealing tests AND rich failure messages (a green/red signal plus a
 *   diagnosis). Tests read like a checklist of guarantees.
 *
 * DESIGN:
 *   Each helper wraps Playwright's `expect` (so failures integrate with the
 *   reporter) and adds a descriptive message. They operate on our normalized
 *   ApiResponse, so they work uniformly across every API in the framework.
 * =============================================================================
 */
import { expect } from '@playwright/test';
import type { AnySchema } from 'ajv';
import type { ApiResponse } from '../api-client/index.js';
import { SchemaValidator } from './schema.validator.js';

/** Assert an exact status code. */
export function expectStatus(res: ApiResponse, status: number): void {
  expect(res.status, `Expected status ${status}, got ${res.status}`).toBe(
    status,
  );
}

/** Assert the response is a 2xx success. */
export function expectOk(res: ApiResponse): void {
  expect(res.ok, `Expected 2xx, got ${res.status}`).toBe(true);
}

/** Assert a header exists (case-insensitive: our headers are lower-cased). */
export function expectHeaderPresent(res: ApiResponse, name: string): void {
  const key = name.toLowerCase();
  expect(res.headers[key], `Missing header "${name}"`).toBeDefined();
}

/** Assert a header's value contains a substring (e.g. content-type). */
export function expectHeaderContains(
  res: ApiResponse,
  name: string,
  substring: string,
): void {
  const key = name.toLowerCase();
  expect(
    res.headers[key],
    `Header "${name}" should contain "${substring}"`,
  ).toContain(substring);
}

/** Assert the response arrived within an SLA (milliseconds). */
export function expectResponseTimeUnder(res: ApiResponse, ms: number): void {
  expect(
    res.durationMs,
    `Response took ${res.durationMs}ms, expected < ${ms}ms`,
  ).toBeLessThan(ms);
}

/** Assert the response body is no larger than `bytes`. */
export function expectResponseSizeUnder(res: ApiResponse, bytes: number): void {
  expect(
    res.sizeBytes,
    `Body was ${res.sizeBytes} bytes, expected < ${bytes}`,
  ).toBeLessThan(bytes);
}

/** Assert the body parsed as JSON (not text/HTML/empty). */
export function expectJsonBody(res: ApiResponse): void {
  expect(res.isJson, 'Expected a JSON response body').toBe(true);
}

/** Assert the body is an array, optionally with a minimum length. */
export function expectArrayBody(res: ApiResponse, minLength = 0): void {
  expect(Array.isArray(res.body), 'Expected an array body').toBe(true);
  expect((res.body as unknown[]).length).toBeGreaterThanOrEqual(minLength);
}

/**
 * Assert the body conforms to a JSON Schema (the strongest structural check).
 * On failure, the message lists EVERY AJV violation for fast diagnosis.
 */
export function expectMatchesSchema(res: ApiResponse, schema: AnySchema): void {
  const { valid, errors } = SchemaValidator.getInstance().validate(
    schema,
    res.body,
  );
  expect(
    valid,
    `Body failed schema validation:\n  - ${errors.join('\n  - ')}`,
  ).toBe(true);
}
