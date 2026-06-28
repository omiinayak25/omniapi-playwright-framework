/**
 * =============================================================================
 * mutations.spec.ts — GraphQL mutations (GraphQLZero)
 * -----------------------------------------------------------------------------
 * CONCEPT:
 *   A mutation WRITES data and returns the requested fields of the result. We use
 *   GraphQLZero (a fake GraphQL API, like JSONPlaceholder) which accepts mutations
 *   and echoes a created resource. Variables carry the input object.
 * =============================================================================
 */
import { test, expect } from '../../src/fixtures/api.fixtures.js';
import { graphqlData } from '../../src/api-client/index.js';
import { HttpStatus } from '../../src/constants/http-status.js';

interface CreatedPost {
  createPost: { id: string; title: string; body: string };
}

test.describe('Phase 14 · GraphQL mutations', () => {
  test.describe.configure({ retries: 2 }); // external GraphQL endpoint can blip
  test('createPost mutation with variables returns the new resource', async ({
    graphqlZero,
  }) => {
    const mutation = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          id
          title
          body
        }
      }
    `;

    const res = await graphqlZero.mutate<CreatedPost>(mutation, {
      input: { title: 'OmniAPI Phase 14', body: 'GraphQL mutation test' },
    });

    expect(res.status).toBe(HttpStatus.OK);
    const data = graphqlData(res);
    expect(data.createPost.title).toBe('OmniAPI Phase 14');
    expect(data.createPost.body).toBe('GraphQL mutation test');
    expect(data.createPost.id).toBeTruthy(); // server assigned an id
  });
});
