/**
 * Deterministic, human-readable name for a persisted generation run (TASK-017 §6).
 *
 * Format: `Generation-YYYY-MM-DD-HH-MM-SS-mmm` in UTC.
 *
 * The task's example (`Generation-2026-08-29-04-30-15`) stops at seconds; the
 * milliseconds segment is added so two generations started within the same
 * second do not collide on the `uq_generation_contexts_name` unique constraint.
 * The name is still fully derived from the creation timestamp and needs no user
 * input. Pass the same `Date` used for the context's `createdAt` so the name and
 * the stored timestamp always agree.
 */
export function buildGenerationName(date: Date): string {
  const pad = (value: number, length = 2) => String(value).padStart(length, "0");

  return [
    "Generation",
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    pad(date.getUTCMilliseconds(), 3),
  ].join("-");
}
