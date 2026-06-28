/**
 * =============================================================================
 * reqres-collections.spec.ts — Testing a CUSTOM, API-key-protected endpoint
 * -----------------------------------------------------------------------------
 * TARGET:
 *   GET https://reqres.in/api/collections/products/records?project_id=33261
 *
 * WHY THIS EXAMPLE:
 *   Demonstrates the framework's "test your own API" flow against a real,
 *   protected endpoint: a config-driven base URL (`config.endpoints.reqres`),
 *   an injected client (`reqres` fixture), and API-Key auth via the Strategy
 *   pattern (`ApiKeyStrategy`).
 *
 * AUTH:
 *   ReqRes /api/* endpoints REQUIRE a registered `x-api-key` header. Without it
 *   the API returns 401 `missing_api_key`. Get a free key at
 *   https://app.reqres.in/api-keys and set REQRES_API_KEY in .env to enable the
 *   happy-path test (it is skipped automatically when the key is absent).
 * =============================================================================
 */
import { test, expect } from '../../src/fixtures/api.fixtures.js';
import { ApiKeyStrategy, NoAuthStrategy } from '../../src/auth/index.js';
import { HttpStatus } from '../../src/constants/http-status.js';

const PATH = '/api/collections/products/records';
const PROJECT_ID = '33261';
const API_KEY = process.env.REQRES_API_KEY;

test.describe('ReqRes collections (custom API-key example)', () => {
  test.describe.configure({ retries: 2 }); // public API — absorb transient blips

  test('is protected: returns 401 without an API key', async ({ reqres }) => {
    const res = await reqres.get(PATH, {
      params: { project_id: PROJECT_ID },
      auth: new NoAuthStrategy(),
    });

    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(res.body).toMatchObject({ error: 'missing_api_key' });
  });

  test('returns records when a valid API key is supplied', async ({
    reqres,
  }) => {
    test.skip(
      !API_KEY,
      'Set REQRES_API_KEY in .env (free at https://app.reqres.in/api-keys) to run this.',
    );

    const res = await reqres.get(PATH, {
      params: { project_id: PROJECT_ID },
      auth: new ApiKeyStrategy('x-api-key', API_KEY as string),
    });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body).toBeTruthy();
  });
});
