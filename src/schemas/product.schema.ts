/**
 * =============================================================================
 * product.schema.ts — JSON Schema contract for a Product (DummyJSON)
 * -----------------------------------------------------------------------------
 * REAL-WORLD NOTE — additionalProperties: true
 *   DummyJSON returns MANY fields (rating, tags, images, reviews, meta, ...).
 *   We only contract the subset our tests depend on, so we ALLOW extra fields
 *   (additionalProperties: true). This is the pragmatic choice for third-party
 *   APIs you don't control: validate what you rely on, tolerate what you don't.
 *   (For YOUR OWN API, prefer additionalProperties:false to catch leaks.)
 * =============================================================================
 */
import type { SchemaObject } from 'ajv';

export const productSchema: SchemaObject = {
  type: 'object',
  required: ['id', 'title', 'price', 'description', 'category', 'stock'],
  additionalProperties: true, // tolerate the many fields we don't assert on
  properties: {
    id: { type: 'integer' },
    title: { type: 'string' },
    price: { type: 'number' },
    description: { type: 'string' },
    category: { type: 'string' },
    stock: { type: 'integer' },
  },
};
