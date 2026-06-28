/**
 * =============================================================================
 * base.service.ts — BaseApiService (foundation of the REPOSITORY pattern)
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   Every repository needs the SAME two things: an injected ApiClient and the
 *   resource's base path (e.g. "/posts"). Putting them in an abstract base means
 *   each concrete service declares them once via super() — no repetition (DRY),
 *   and the compiler guarantees every repository is constructed with a client
 *   (Dependency Injection is enforced structurally).
 *
 * WHY ABSTRACT (not instantiable):
 *   "A resource repository" is a concept, not a thing. You never `new
 *   BaseApiService()`; you create a PostService or ProductService. `abstract`
 *   encodes that rule in the type system.
 *
 * DESIGN NOTE:
 *   `protected` members are visible to subclasses but not to outside callers —
 *   so tests use the public CRUD methods, never the raw client or path.
 * =============================================================================
 */
import type { ApiClient } from '../api-client/index.js';

export abstract class BaseApiService {
  /**
   * @param client    Injected HTTP Facade (Dependency Injection).
   * @param resource  This repository's base path, e.g. "/posts" or "/products".
   */
  protected constructor(
    protected readonly client: ApiClient,
    protected readonly resource: string,
  ) {}

  /** Builds a resource URL for a specific id, e.g. "/posts/42". */
  protected url(id: number | string): string {
    return `${this.resource}/${id}`;
  }
}
