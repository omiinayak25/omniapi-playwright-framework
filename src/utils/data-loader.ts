/**
 * =============================================================================
 * data-loader.ts — Read external test data (JSON / CSV / Excel)
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   Data-driven testing separates test LOGIC from test DATA. This loader is the
 *   single seam that reads data files from the `data/` directory in the three
 *   common formats, so specs never deal with fs/parsing details — they just ask
 *   for typed rows.
 *
 * DESIGN NOTES:
 *   - JSON & CSV are read SYNCHRONOUSLY so callers can generate one test() per
 *     row at collection time (Playwright collects tests synchronously).
 *   - Excel is read ASYNCHRONOUSLY (exceljs has no sync API), so it's consumed
 *     inside a test body, not used to generate tests.
 *   - All paths resolve under <projectRoot>/data via dataPath().
 * =============================================================================
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseCsv } from 'csv-parse/sync';
import ExcelJS from 'exceljs';

/** Absolute path to the project's data directory. */
const DATA_DIR = path.resolve(process.cwd(), 'data');

/** Resolve a path relative to the data directory, e.g. dataPath('bookings.csv'). */
export function dataPath(relative: string): string {
  return path.join(DATA_DIR, relative);
}

/** Load and parse a JSON data file as type T (synchronous). */
export function loadJson<T>(relative: string): T {
  const raw = fs.readFileSync(dataPath(relative), 'utf-8');
  return JSON.parse(raw) as T;
}

/**
 * Load a CSV file as an array of row objects keyed by header (synchronous).
 * All values come back as strings — convert types at the call site as needed.
 */
export function loadCsv<T = Record<string, string>>(relative: string): T[] {
  const raw = fs.readFileSync(dataPath(relative), 'utf-8');
  return parseCsv(raw, {
    columns: true, // first row = header -> object keys
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}

/**
 * Load the first (or named) worksheet of an Excel file as row objects keyed by
 * the header row (asynchronous). Cell values are returned as-is from exceljs.
 */
export async function loadExcel<T = Record<string, unknown>>(
  relative: string,
  sheetName?: string,
): Promise<T[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(dataPath(relative));

  const sheet = sheetName
    ? workbook.getWorksheet(sheetName)
    : workbook.worksheets[0];
  if (!sheet) {
    throw new Error(`[data-loader] Worksheet not found in ${relative}`);
  }

  const headers: string[] = [];
  const rows: T[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) {
      // Header row -> column names.
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        // cell.text is exceljs's safe string rendering of any cell value.
        headers[col - 1] = cell.text || `col${col}`;
      });
      return;
    }
    const obj: Record<string, unknown> = {};
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const key = headers[col - 1] ?? `col${col}`;
      obj[key] = cell.value;
    });
    rows.push(obj as T);
  });

  return rows;
}
