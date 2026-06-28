/**
 * =============================================================================
 * filter-sort-search.spec.ts — Filtering, sorting, searching, field selection
 * -----------------------------------------------------------------------------
 * CONCEPT:
 *   Beyond paging, collection endpoints support shaping the result set. The key
 *   is to verify the SEMANTICS, not just status 200:
 *     - sort: the returned order is actually ascending/descending,
 *     - filter: every item matches the filter,
 *     - search: results relate to the query,
 *     - select: only requested fields are present (sparse fieldset).
 * =============================================================================
 */
import { test, expect } from '../../src/fixtures/api.fixtures.js';
import { HttpStatus } from '../../src/constants/http-status.js';

test.describe('Phase 10 · Filter / Sort / Search / Select', () => {
  test('SORT — results are ordered by price ascending', async ({
    products,
  }) => {
    const res = await products.sortedBy('price', 'asc', 10);
    expect(res.status).toBe(HttpStatus.OK);

    const prices = res.body.products.map((p) => p.price);
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted); // order is genuinely ascending
  });

  test('FILTER — every product matches the requested category', async ({
    products,
  }) => {
    const res = await products.byCategory('smartphones', 10);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.products.length).toBeGreaterThan(0);
    for (const p of res.body.products) {
      expect(p.category).toBe('smartphones');
    }
  });

  test('SEARCH — results relate to the query', async ({ products }) => {
    const res = await products.search('mascara');
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(
      res.body.products.some((p) =>
        JSON.stringify(p).toLowerCase().includes('mascara'),
      ),
    ).toBe(true);
  });

  test('SELECT — only requested fields are returned (sparse fieldset)', async ({
    products,
  }) => {
    const res = await products.selectFields(['title', 'price'], 3);
    const first = res.body.products[0] as unknown as Record<string, unknown>;
    expect(first).toBeDefined();
    // id is always returned by DummyJSON; title & price requested; description NOT.
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('price');
    expect(first).not.toHaveProperty('description');
  });

  test('FILTER (page-based API) — breweries filtered by state', async ({
    breweries,
  }) => {
    const res = await breweries.byState('ohio', 5);
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.length).toBeGreaterThan(0);
    for (const b of res.body) {
      expect(b.state_province.toLowerCase()).toBe('ohio');
    }
  });
});
