/**
 * =============================================================================
 * excel-driven.spec.ts — Data-driven from an Excel spreadsheet
 * -----------------------------------------------------------------------------
 * CONCEPT:
 *   Excel is what business/QA analysts actually use. We read products.xlsx and
 *   validate each row against the live API.
 *
 * IMPORTANT CONSTRAINT (a real lesson):
 *   exceljs is ASYNC and Playwright collects tests SYNCHRONOUSLY — so we CANNOT
 *   generate one test() per Excel row at collection time. Instead we load and
 *   loop INSIDE a single test. (To get one-test-per-row from Excel, you'd
 *   pre-convert the sheet to JSON in global setup.)
 * =============================================================================
 */
import { test, expect } from '../../src/fixtures/api.fixtures.js';
import { loadExcel } from '../../src/utils/data-loader.js';
import { HttpStatus } from '../../src/constants/http-status.js';

interface ProductRow {
  productId: number;
  minPrice: number;
  category: string;
}

test.describe('Phase 8 · Excel-driven product validation', () => {
  test('every spreadsheet row validates against the live product API', async ({
    products,
  }) => {
    const rows = await loadExcel<ProductRow>('products.xlsx');
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      const res = await products.getById(Number(row.productId));
      expect(res.status, `product ${row.productId}`).toBe(HttpStatus.OK);
      expect(res.body.price).toBeGreaterThanOrEqual(Number(row.minPrice));
    }
  });
});
