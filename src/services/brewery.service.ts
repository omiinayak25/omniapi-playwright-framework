/**
 * =============================================================================
 * brewery.service.ts — BreweryService (PAGE-BASED pagination, Open Brewery DB)
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   Demonstrates page-based pagination (?page=&per_page=) — distinct from
 *   DummyJSON's offset-based skip/limit. Also covers filtering (by_state),
 *   sorting (sort=field:dir), search, and the /meta total endpoint. The
 *   repository hides these query-param conventions behind domain methods.
 * =============================================================================
 */
import { BaseApiService } from './base.service.js';
import type { ApiClient, ApiResponse } from '../api-client/index.js';
import type { Brewery, BreweryMeta } from '../models/brewery.model.js';

export class BreweryService extends BaseApiService {
  public constructor(client: ApiClient) {
    // Includes the /v1 API prefix here (baseURL is the origin only).
    super(client, '/v1/breweries');
  }

  /** PAGE — GET /breweries?page=&per_page= (1-based pages; bare array result). */
  public getPage(
    page: number,
    perPage: number,
  ): Promise<ApiResponse<Brewery[]>> {
    return this.client.get<Brewery[]>(this.resource, {
      params: { page, per_page: perPage },
    });
  }

  /** FILTER + SORT — GET /breweries?by_state=&sort=name:asc. */
  public byState(state: string, perPage = 10): Promise<ApiResponse<Brewery[]>> {
    return this.client.get<Brewery[]>(this.resource, {
      params: { by_state: state, per_page: perPage, sort: 'name:asc' },
    });
  }

  /** SEARCH — GET /breweries/search?query=... */
  public search(query: string): Promise<ApiResponse<Brewery[]>> {
    return this.client.get<Brewery[]>(`${this.resource}/search`, {
      params: { query },
    });
  }

  /** META — GET /breweries/meta (provides the total count, optionally filtered). */
  public meta(byState?: string): Promise<ApiResponse<BreweryMeta>> {
    return this.client.get<BreweryMeta>(`${this.resource}/meta`, {
      ...(byState ? { params: { by_state: byState } } : {}),
    });
  }
}
