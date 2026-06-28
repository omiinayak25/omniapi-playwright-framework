/**
 * =============================================================================
 * queries.spec.ts — GraphQL queries (Countries API)
 * -----------------------------------------------------------------------------
 * CONCEPT:
 *   A GraphQL query asks for EXACTLY the fields it needs. We assert the response
 *   contains the requested shape — and, crucially, that `errors` is absent
 *   (GraphQL returns HTTP 200 even on failure, so checking status is not enough).
 * =============================================================================
 */
import { test, expect } from '../../src/fixtures/api.fixtures.js';
import { graphqlData } from '../../src/api-client/index.js';
import { HttpStatus } from '../../src/constants/http-status.js';

interface Country {
  name: string;
  capital: string;
  currency: string;
  emoji: string;
}

test.describe('Phase 14 · GraphQL queries', () => {
  test.describe.configure({ retries: 2 }); // external GraphQL endpoint can blip
  test('fetches a single country with selected fields', async ({
    countries,
  }) => {
    const res = await countries.query<{ country: Country }>(`
      {
        country(code: "US") {
          name
          capital
          currency
          emoji
        }
      }
    `);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.errors).toBeUndefined(); // no GraphQL-level errors

    const data = graphqlData(res); // throws if errors/null
    expect(data.country.name).toBe('United States');
    expect(data.country.capital).toBe('Washington D.C.');
    expect(data.country.emoji).toBeTruthy();
  });

  test('fetches a filtered list of countries', async ({ countries }) => {
    const res = await countries.query<{ countries: { code: string }[] }>(`
      {
        countries(filter: { continent: { eq: "EU" } }) {
          code
          name
        }
      }
    `);

    const data = graphqlData(res);
    expect(data.countries.length).toBeGreaterThan(0);
    // Every returned country has the requested fields.
    for (const c of data.countries) {
      expect(c.code).toMatch(/^[A-Z]{2}$/);
    }
  });
});
