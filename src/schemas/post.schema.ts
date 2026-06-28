/**
 * =============================================================================
 * post.schema.ts — JSON Schema contract for a Post (JSONPlaceholder)
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   A JSON Schema declares the EXACT shape a response must have: which fields are
 *   required, their types, and whether extras are allowed. AJV validates a body
 *   against this in one call — catching API drift (missing field, wrong type)
 *   that field-by-field assertions miss.
 *
 * WHY `JSONSchemaType<Post>`:
 *   AJV's generic type cross-checks the schema against our TS model at COMPILE
 *   time. If the Post interface and this schema disagree, the build fails — the
 *   model and the contract can never silently diverge.
 * =============================================================================
 */
import type { JSONSchemaType } from 'ajv';
import type { Post } from '../models/post.model.js';

export const postSchema: JSONSchemaType<Post> = {
  type: 'object',
  required: ['id', 'userId', 'title', 'body'],
  additionalProperties: false, // reject unexpected fields — strict contract
  properties: {
    id: { type: 'integer' },
    userId: { type: 'integer' },
    title: { type: 'string' },
    body: { type: 'string' },
  },
};

/** Schema for an array of posts (the GET /posts collection response). */
export const postArraySchema: JSONSchemaType<Post[]> = {
  type: 'array',
  items: postSchema,
};
