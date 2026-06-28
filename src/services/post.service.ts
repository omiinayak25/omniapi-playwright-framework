/**
 * =============================================================================
 * post.service.ts — PostService (REPOSITORY for JSONPlaceholder /posts)
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   Encapsulates EVERY way to interact with the /posts resource behind business
 *   methods. Tests call `posts.create(...)`, never `api.post('/posts', ...)`.
 *   If the path or verb changes, this is the ONLY file that changes.
 *
 * WHAT THIS DEMONSTRATES:
 *   A clean, complete CRUD repository: list, read, create, replace (PUT),
 *   partial update (PATCH), delete — each returning the normalized ApiResponse
 *   so tests can assert status, timing, AND body.
 * =============================================================================
 */
import { BaseApiService } from './base.service.js';
import type { ApiClient } from '../api-client/index.js';
import type { ApiResponse } from '../api-client/index.js';
import type { Post, NewPost } from '../models/post.model.js';

export class PostService extends BaseApiService {
  public constructor(client: ApiClient) {
    super(client, '/posts'); // resource path declared once, here.
  }

  /** READ ALL — GET /posts (JSONPlaceholder returns a bare array). */
  public getAll(): Promise<ApiResponse<Post[]>> {
    return this.client.get<Post[]>(this.resource);
  }

  /** READ ONE — GET /posts/{id}. */
  public getById(id: number): Promise<ApiResponse<Post>> {
    return this.client.get<Post>(this.url(id));
  }

  /** CREATE — POST /posts (server assigns the id; returns 201). */
  public create(post: NewPost): Promise<ApiResponse<Post>> {
    return this.client.post<Post>(this.resource, { data: post });
  }

  /** REPLACE — PUT /posts/{id} (full update of the resource). */
  public update(id: number, post: NewPost): Promise<ApiResponse<Post>> {
    return this.client.put<Post>(this.url(id), { data: post });
  }

  /** PARTIAL UPDATE — PATCH /posts/{id} (only the provided fields). */
  public patch(
    id: number,
    partial: Partial<NewPost>,
  ): Promise<ApiResponse<Post>> {
    return this.client.patch<Post>(this.url(id), { data: partial });
  }

  /** DELETE — DELETE /posts/{id}. */
  public remove(id: number): Promise<ApiResponse<unknown>> {
    return this.client.del(this.url(id));
  }
}
