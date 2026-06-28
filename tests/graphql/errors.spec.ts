/**
 * =============================================================================
 * errors.spec.ts — GraphQL error handling (the 200-with-errors trap)
 * -----------------------------------------------------------------------------
 * CONCEPT:
 *   GraphQL returns HTTP 200 even when the operation FAILS — the failure is in
 *   `body.errors`. A REST-style `expect(status).toBe(200)` would WRONGLY pass.
 *   We assert on the errors array, and confirm graphqlData() throws on errors.
 * =============================================================================
 */
import { test, expect } from '../../src/fixtures/api.fixtures.js';
import { graphqlData } from '../../src/api-client/index.js';
import { HttpStatus } from '../../src/constants/http-status.js';

test.describe('Phase 14 · GraphQL errors', () => {
  test.describe.configure({ retries: 2 }); // external GraphQL endpoint can blip
  test('an invalid field yields errors despite HTTP 200', async ({
    countries,
  }) => {
    const res = await countries.query(`
      {
        country(code: "US") { nonExistentField }
      }
    `);

    // The classic trap: HTTP is 200...
    expect(res.status).toBe(HttpStatus.OK);
    // ...but the operation FAILED — proven by the errors array.
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors?.[0]?.message).toContain('nonExistentField');
  });

  test('graphqlData() throws on an errored response', async ({ countries }) => {
    const res = await countries.query(`{ country(code: "US") { bogus } }`);
    expect(() => graphqlData(res)).toThrow(/GraphQL/);
  });
});
