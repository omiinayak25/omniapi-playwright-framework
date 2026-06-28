/**
 * =============================================================================
 * booking.schema.ts — JSON Schema contract for a Booking (Restful Booker)
 * -----------------------------------------------------------------------------
 * WHY `SchemaObject` (not JSONSchemaType):
 *   Booking has an OPTIONAL field (additionalneeds) and a NESTED object
 *   (bookingdates). AJV's strict JSONSchemaType<T> fights `exactOptionalProperty
 *   Types`, so for responses with optional/nested fields we declare a plain (but
 *   still fully valid) JSON Schema. JSONSchemaType is reserved for clean models
 *   like Post where the compile-time model coupling is friction-free.
 *
 * NESTED VALIDATION:
 *   `bookingdates` is validated as its own object with its own required keys —
 *   schemas compose, so deeply nested structures are checked end to end.
 * =============================================================================
 */
import type { SchemaObject } from 'ajv';

export const bookingSchema: SchemaObject = {
  type: 'object',
  required: [
    'firstname',
    'lastname',
    'totalprice',
    'depositpaid',
    'bookingdates',
  ],
  additionalProperties: false,
  properties: {
    firstname: { type: 'string' },
    lastname: { type: 'string' },
    totalprice: { type: 'number' },
    depositpaid: { type: 'boolean' },
    bookingdates: {
      type: 'object',
      required: ['checkin', 'checkout'],
      additionalProperties: false,
      properties: {
        checkin: { type: 'string' },
        checkout: { type: 'string' },
      },
    },
    additionalneeds: { type: 'string' }, // optional: present but not in `required`
  },
};

/**
 * A STRICT booking schema with value constraints (lengths, ranges, date format).
 * Used for negative/boundary testing: it rejects empty strings, nulls, wrong
 * types, and out-of-range numbers that the permissive demo APIs would accept.
 * This lets us test validation DETERMINISTICALLY at the contract layer.
 */
export const bookingStrictSchema: SchemaObject = {
  type: 'object',
  required: [
    'firstname',
    'lastname',
    'totalprice',
    'depositpaid',
    'bookingdates',
  ],
  additionalProperties: false,
  properties: {
    firstname: { type: 'string', minLength: 1, maxLength: 50 },
    lastname: { type: 'string', minLength: 1, maxLength: 50 },
    totalprice: { type: 'integer', minimum: 1, maximum: 100000 },
    depositpaid: { type: 'boolean' },
    bookingdates: {
      type: 'object',
      required: ['checkin', 'checkout'],
      additionalProperties: false,
      properties: {
        checkin: { type: 'string', format: 'date' },
        checkout: { type: 'string', format: 'date' },
      },
    },
    additionalneeds: { type: 'string' },
  },
};
