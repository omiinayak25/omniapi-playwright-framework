/**
 * =============================================================================
 * dynamic-mocking.spec.ts — Responses computed from the request
 * -----------------------------------------------------------------------------
 * CONCEPT:
 *   A dynamic handler inspects the incoming request (query/body) and builds the
 *   response on the fly — mimicking real server logic. Great for echo endpoints,
 *   conditional behavior, and data-shaped responses.
 * =============================================================================
 */
import { test, expect } from '../../src/fixtures/api.fixtures.js';
import { HttpStatus } from '../../src/constants/http-status.js';

test.describe('Phase 15 · Dynamic mocking', () => {
  test('response is computed from query parameters', async ({ mock }) => {
    const { server, client } = mock;
    server.on('GET', '/greet', (req) => ({
      body: { message: `Hello, ${req.query.name ?? 'stranger'}!` },
    }));

    const res = await client.get<{ message: string }>('/greet', {
      params: { name: 'Omni' },
    });
    expect(res.body.message).toBe('Hello, Omni!');
  });

  test('handler echoes the posted body', async ({ mock }) => {
    const { server, client } = mock;
    server.on('POST', '/echo', (req) => ({ body: { received: req.body } }));

    const payload = { a: 1, nested: { b: 2 } };
    const res = await client.post<{ received: typeof payload }>('/echo', {
      data: payload,
    });
    expect(res.body.received).toEqual(payload);
  });

  test('handler returns a conditional status based on input', async ({
    mock,
  }) => {
    const { server, client } = mock;
    server.on('GET', '/resource', (req) =>
      req.query.id === '1'
        ? { status: HttpStatus.OK, body: { id: 1 } }
        : { status: HttpStatus.NOT_FOUND, body: { error: 'not found' } },
    );

    const found = await client.get('/resource', { params: { id: 1 } });
    const missing = await client.get('/resource', { params: { id: 999 } });

    expect(found.status).toBe(HttpStatus.OK);
    expect(missing.status).toBe(HttpStatus.NOT_FOUND);
  });
});
