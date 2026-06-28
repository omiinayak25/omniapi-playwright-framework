/**
 * =============================================================================
 * pagination.ts — PaginationHelper (auto-collect across pages)
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   Tests often need the ENTIRE dataset, not one page. Re-implementing the
 *   "loop until exhausted" logic per test is error-prone (off-by-one, infinite
 *   loops). This generic helper drives any page-fetching function until the data
 *   runs out, with a hard safety cap to prevent runaway loops.
 *
 * DESIGN (generic & API-agnostic):
 *   The caller supplies a `fetchPage(pageIndex, pageSize)` function returning the
 *   items for that page. The helper handles iteration & termination. It works for
 *   offset-based (skip = pageIndex*pageSize) and page-based APIs alike — the
 *   caller's closure adapts the math.
 * =============================================================================
 */

/** A function that returns the items for a given zero-based page. */
export type PageFetcher<T> = (
  pageIndex: number,
  pageSize: number,
) => Promise<T[]>;

export interface CollectAllOptions {
  /** Items per page. */
  readonly pageSize?: number;
  /** Safety cap on number of pages (prevents infinite loops). */
  readonly maxPages?: number;
}

export class PaginationHelper {
  /**
   * Collect items across pages until a page returns fewer than `pageSize`
   * (the standard "last page" signal) or `maxPages` is reached.
   */
  public static async collectAll<T>(
    fetchPage: PageFetcher<T>,
    options: CollectAllOptions = {},
  ): Promise<T[]> {
    const pageSize = options.pageSize ?? 20;
    const maxPages = options.maxPages ?? 100;

    const all: T[] = [];
    for (let page = 0; page < maxPages; page++) {
      const items = await fetchPage(page, pageSize);
      all.push(...items);
      // A short (or empty) page means we've reached the end.
      if (items.length < pageSize) break;
    }
    return all;
  }
}
