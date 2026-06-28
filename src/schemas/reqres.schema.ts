/**
 * =============================================================================
 * reqres.schema.ts — JSON Schema for the ReqRes collection-records response
 * -----------------------------------------------------------------------------
 * Validates { data: [ { id, project_id, data: {...} }, ... ], meta: {...} }.
 * additionalProperties:true — ReqRes returns extra record metadata we tolerate.
 * =============================================================================
 */
import type { SchemaObject } from 'ajv';

export const reqresRecordsSchema: SchemaObject = {
  type: 'object',
  required: ['data', 'meta'],
  additionalProperties: true,
  properties: {
    data: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'project_id', 'data'],
        additionalProperties: true,
        properties: {
          id: { type: 'string' },
          project_id: { type: 'integer' },
          data: { type: 'object' },
        },
      },
    },
    meta: { type: 'object' },
  },
};
