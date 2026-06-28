/**
 * =============================================================================
 * schema.validator.ts — SchemaValidator (AJV wrapper, SINGLETON + cache)
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   Validating a whole response body against a JSON Schema in ONE call is the
 *   strongest defense against API drift. AJV is the fastest, most standard JSON
 *   Schema engine. This class wraps it with: format support (date/email/uri),
 *   readable error messages, and a compiled-schema CACHE.
 *
 * WHY SINGLETON + CACHE:
 *   AJV's `compile()` builds a validator function (non-trivial cost). Compiling
 *   the same schema on every assertion would be wasteful. One shared AJV
 *   instance + a cache keyed by schema reference means each schema compiles
 *   exactly once, then validations are near-instant.
 *
 * HOW IT WORKS:
 *   validate(schema, data) -> { valid, errors }. Errors are flattened into
 *   human-readable strings like "/price must be number".
 * =============================================================================
 */
import Ajv from 'ajv';
import type { AnySchema, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
}

export class SchemaValidator {
  private static instance: SchemaValidator | undefined;

  private readonly ajv: Ajv;

  /** Cache compiled validators, keyed by the schema object reference. */
  private readonly cache = new Map<AnySchema, ValidateFunction>();

  private constructor() {
    this.ajv = new Ajv({
      allErrors: true, // report EVERY violation, not just the first
      strict: false, // tolerate vendor schema keywords we don't control
    });
    addFormats(this.ajv); // enable "date", "email", "uri", etc. formats
  }

  public static getInstance(): SchemaValidator {
    SchemaValidator.instance ??= new SchemaValidator();
    return SchemaValidator.instance;
  }

  /** Validate `data` against `schema`; returns validity + readable errors. */
  public validate(schema: AnySchema, data: unknown): ValidationResult {
    const validateFn = this.getValidator(schema);
    const valid = validateFn(data);
    if (valid) return { valid: true, errors: [] };

    const errors = (validateFn.errors ?? []).map(
      (e) => `${e.instancePath || '/'} ${e.message ?? 'is invalid'}`,
    );
    return { valid: false, errors };
  }

  /** Compile-once: return the cached validator or build & cache a new one. */
  private getValidator(schema: AnySchema): ValidateFunction {
    let validateFn = this.cache.get(schema);
    if (!validateFn) {
      validateFn = this.ajv.compile(schema);
      this.cache.set(schema, validateFn);
    }
    return validateFn;
  }
}
