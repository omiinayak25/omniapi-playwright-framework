/**
 * =============================================================================
 * random.ts — Randomness & unique-id helpers
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   Unique, varied test data prevents collisions on stateful APIs and widens
 *   coverage. UUIDs are also the basis for correlation IDs (Phase 20). We expose
 *   tiny, intention-revealing helpers so tests/builders never inline raw
 *   `Math.random()` math.
 *
 * DESIGN NOTE:
 *   `randomUUID` is built into Node's crypto — zero dependency, RFC-4122 v4.
 *   For richer data (names, emails, prices) we use Faker in the factory; these
 *   helpers cover the primitives Faker is overkill for.
 * =============================================================================
 */
import { randomUUID } from 'node:crypto';

/** A unique RFC-4122 v4 UUID, e.g. for correlation IDs or unique field values. */
export function uuid(): string {
  return randomUUID();
}

/** Inclusive random integer in [min, max]. */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick one element from a non-empty array (throws on empty — fail fast). */
export function pickOne<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('[random.pickOne] Cannot pick from an empty array');
  }
  const item = items[randomInt(0, items.length - 1)];
  // noUncheckedIndexedAccess: index is provably in-range, but satisfy the compiler.
  return item as T;
}
