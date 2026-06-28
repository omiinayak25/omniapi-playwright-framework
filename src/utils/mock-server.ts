/**
 * =============================================================================
 * mock-server.ts — MockServer (in-process fake HTTP server)
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   Playwright's APIRequestContext cannot intercept requests (that's a browser-
 *   page feature). To mock at the API layer we run a REAL local HTTP server we
 *   fully control — enabling deterministic, offline tests AND forced edge cases
 *   (500s, malformed bodies) that live APIs won't produce on demand.
 *
 * CAPABILITIES:
 *   - stub(method, path, response): fixed canned response.
 *   - on(method, path, handler): DYNAMIC response computed from the request.
 *   - requests[]: every received request is recorded (a SPY for consumer-contract
 *     assertions — "did my client send the right body/headers?").
 *   - start()/stop(): listen on an ephemeral port (0 -> OS-assigned) for isolation.
 * =============================================================================
 */
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';

/** A normalized view of an incoming request handed to handlers & recorded. */
export interface MockRequest {
  readonly method: string;
  readonly path: string;
  readonly query: Record<string, string>;
  readonly headers: http.IncomingHttpHeaders;
  readonly body: unknown;
}

/** What a handler returns (status/body/headers all optional). */
export interface MockResponse {
  readonly status?: number;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
}

export type MockHandler = (
  req: MockRequest,
) => MockResponse | Promise<MockResponse>;

export class MockServer {
  private server: http.Server | undefined;
  private port = 0;
  private readonly routes = new Map<string, MockHandler>();

  /** Every request received — inspect this to spy on what the client sent. */
  public readonly requests: MockRequest[] = [];

  /** Base URL once started, e.g. http://127.0.0.1:54321 */
  public get url(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  /** Register a fixed (canned) response for a route. */
  public stub(method: string, path: string, response: MockResponse): this {
    this.routes.set(MockServer.key(method, path), () => response);
    return this;
  }

  /** Register a dynamic handler that builds the response from the request. */
  public on(method: string, path: string, handler: MockHandler): this {
    this.routes.set(MockServer.key(method, path), handler);
    return this;
  }

  /** Clear all routes and recorded requests (for reuse between scenarios). */
  public reset(): void {
    this.routes.clear();
    this.requests.length = 0;
  }

  /** Start listening on an OS-assigned ephemeral port. */
  public start(): Promise<void> {
    return new Promise((resolve) => {
      const server = http.createServer((req, res) => {
        void this.handle(req, res);
      });
      this.server = server;
      server.listen(0, '127.0.0.1', () => {
        this.port = (server.address() as AddressInfo).port;
        resolve();
      });
    });
  }

  /** Stop the server and release the port. */
  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  private static key(method: string, path: string): string {
    return `${method.toUpperCase()} ${path}`;
  }

  /** Core request handler: parse -> record -> route -> respond. */
  private async handle(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void> {
    try {
      const raw = await MockServer.readBody(req);
      const urlObj = new URL(req.url ?? '/', this.url);
      const query: Record<string, string> = {};
      urlObj.searchParams.forEach((value, k) => (query[k] = value));

      let body: unknown = raw;
      const contentType = req.headers['content-type'] ?? '';
      if (contentType.includes('application/json') && raw) {
        try {
          body = JSON.parse(raw);
        } catch {
          body = raw; // leave malformed JSON as raw text
        }
      }

      const mockReq: MockRequest = {
        method: req.method ?? 'GET',
        path: urlObj.pathname,
        query,
        headers: req.headers,
        body,
      };
      this.requests.push(mockReq);

      const handler = this.routes.get(
        MockServer.key(mockReq.method, mockReq.path),
      );
      if (!handler) {
        MockServer.send(res, {
          status: 404,
          body: {
            error: `No mock registered for ${mockReq.method} ${mockReq.path}`,
          },
        });
        return;
      }

      MockServer.send(res, await handler(mockReq));
    } catch (err) {
      MockServer.send(res, {
        status: 500,
        body: { error: err instanceof Error ? err.message : 'mock error' },
      });
    }
  }

  /** Collect the request body as a UTF-8 string. */
  private static async readBody(req: http.IncomingMessage): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of req as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  /** Write a MockResponse to the wire (JSON-encoding object bodies). */
  private static send(res: http.ServerResponse, mock: MockResponse): void {
    const status = mock.status ?? 200;
    const headers = {
      'content-type': 'application/json',
      ...(mock.headers ?? {}),
    };
    res.writeHead(status, headers);
    const payload =
      typeof mock.body === 'string'
        ? mock.body
        : JSON.stringify(mock.body ?? null);
    res.end(payload);
  }
}
