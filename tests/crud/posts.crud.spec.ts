/**
 * =============================================================================
 * posts.crud.spec.ts — Full CRUD lifecycle via PostService (JSONPlaceholder)
 * -----------------------------------------------------------------------------
 * CONCEPT:
 *   CRUD = Create, Read, Update, Delete — the four fundamental data operations,
 *   mapped to POST, GET, PUT/PATCH, DELETE. This spec exercises each through the
 *   REPOSITORY, so the tests read in domain language with zero HTTP plumbing.
 *
 * NOTE: JSONPlaceholder is a FAKE API — it validates and echoes but does not
 *   persist. That's perfect for learning CRUD mechanics & status codes.
 * =============================================================================
 */
import { test, expect } from '../../src/fixtures/api.fixtures.js';
import { HttpStatus } from '../../src/constants/http-status.js';
import type { NewPost } from '../../src/models/post.model.js';

test.describe('Phase 3 · Posts CRUD (Repository pattern)', () => {
  test('READ ALL — returns the full collection', async ({ posts }) => {
    const res = await posts.getAll();

    expect(res.status).toBe(HttpStatus.OK);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(100); // JSONPlaceholder seeds 100 posts
  });

  test('READ ONE — returns the requested post', async ({ posts }) => {
    const res = await posts.getById(1);

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.id).toBe(1);
    expect(res.body.title).toBeTruthy();
  });

  test('READ ONE — non-existent id returns 404', async ({ posts }) => {
    const res = await posts.getById(999_999);
    expect(res.status).toBe(HttpStatus.NOT_FOUND);
  });

  test('CREATE — returns 201 with a server-assigned id', async ({ posts }) => {
    const payload: NewPost = {
      userId: 1,
      title: 'OmniAPI Phase 3',
      body: 'Repository pattern in action',
    };

    const res = await posts.create(payload);

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.id).toBe(101); // next id in the fake DB
    expect(res.body.title).toBe(payload.title);
    expect(res.body.body).toBe(payload.body);
  });

  test('UPDATE (PUT) — fully replaces the resource', async ({ posts }) => {
    const res = await posts.update(1, {
      userId: 1,
      title: 'Replaced title',
      body: 'Replaced body',
    });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.id).toBe(1);
    expect(res.body.title).toBe('Replaced title');
  });

  test('PATCH — partially updates only the provided fields', async ({
    posts,
  }) => {
    const res = await posts.patch(1, { title: 'Only the title changed' });

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.id).toBe(1);
    expect(res.body.title).toBe('Only the title changed');
  });

  test('DELETE — removes the resource (200)', async ({ posts }) => {
    const res = await posts.remove(1);
    expect(res.status).toBe(HttpStatus.OK);
  });
});
