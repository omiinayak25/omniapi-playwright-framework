/**
 * =============================================================================
 * graphql-client.ts — GraphQLClient (thin GraphQL layer over the ApiClient)
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   GraphQL has its own conventions: ONE endpoint, always POST, body
 *   { query, variables }, and a { data, errors } response envelope where
 *   FAILURES come back with HTTP 200. This client encapsulates those rules so
 *   tests express GraphQL operations cleanly and never re-implement the envelope.
 *
 * DESIGN:
 *   It REUSES the ApiClient (Facade) for transport, logging, and timing — GraphQL
 *   is just a POST. `graphqlData()` unwraps `data`, throwing on `errors`, so a
 *   GraphQL-level failure fails the test loudly instead of returning null data.
 * =============================================================================
 */
import type { ApiClient } from './api-client.js';
import type { ApiResponse } from './api-client.types.js';

/** A single GraphQL error entry. */
export interface GraphQLError {
  readonly message: string;
  readonly path?: (string | number)[];
  readonly extensions?: Record<string, unknown>;
}

/** The standard GraphQL response envelope. */
export interface GraphQLResponse<T> {
  readonly data: T | null;
  readonly errors?: GraphQLError[];
}

/** Variables map for a GraphQL operation. */
export type GraphQLVariables = Record<string, unknown>;

export class GraphQLClient {
  /**
   * @param client    Underlying HTTP Facade (Dependency Injection).
   * @param endpoint  The GraphQL endpoint path (e.g. '/' or '/api').
   */
  public constructor(
    private readonly client: ApiClient,
    private readonly endpoint: string,
  ) {}

  /** Execute a GraphQL query. */
  public query<T>(
    query: string,
    variables?: GraphQLVariables,
  ): Promise<ApiResponse<GraphQLResponse<T>>> {
    return this.execute<T>(query, variables);
  }

  /** Execute a GraphQL mutation (same transport as a query). */
  public mutate<T>(
    mutation: string,
    variables?: GraphQLVariables,
  ): Promise<ApiResponse<GraphQLResponse<T>>> {
    return this.execute<T>(mutation, variables);
  }

  private execute<T>(
    operation: string,
    variables?: GraphQLVariables,
  ): Promise<ApiResponse<GraphQLResponse<T>>> {
    return this.client.post<GraphQLResponse<T>>(this.endpoint, {
      data: { query: operation, ...(variables ? { variables } : {}) },
    });
  }
}

/**
 * Unwrap a GraphQL response: return `data`, or THROW with the joined error
 * messages if the operation reported errors (or returned null data). This turns
 * GraphQL's "200 with errors" into a real failure signal.
 */
export function graphqlData<T>(res: ApiResponse<GraphQLResponse<T>>): T {
  const { data, errors } = res.body;
  if (errors && errors.length > 0) {
    throw new Error(
      `[GraphQL] Operation returned errors:\n  - ${errors
        .map((e) => e.message)
        .join('\n  - ')}`,
    );
  }
  if (data === null) {
    throw new Error('[GraphQL] Operation returned null data with no errors');
  }
  return data;
}
