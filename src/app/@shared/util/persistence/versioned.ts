/**
 * Per-domain persisted-schema versioning (migrate-on-read).
 *
 * Each bounded context wraps its slice state in a {@link Versioned} envelope on
 * save and unwraps + migrates it on load, so a domain can evolve its own data
 * structure without the destructive global wipe. The logic is a pure,
 * domain-agnostic runner: `v` is a monotonically increasing integer and `data`
 * is whatever shape the domain owns. The load/save effect builders
 * (`@shared/data/effects/persisted-slice.effects.factory`) call these helpers
 * with the app-wide `APP_VERSION` (@shared/model/app.consts); a context supplies
 * only its own migration ladder from `<domain>/data`.
 *
 * Versioning is app-level, migration is domain-level: one version counter for
 * the whole store, one ladder per persisted slice. Replaces the old global
 * datastore-wide migrate() at the per-key grain.
 */

/** A persisted document tagged with the schema version it was written at. */
interface Versioned<T> {
  v: number;
  data: T;
}

/**
 * One forward migration step. `ladder[i]` migrates a document from schema
 * version `i + 1` to `i + 2` (so `ladder[0]` is v1 → v2). Kept `unknown` in and
 * out so a context declares its ladder as a plain data array without importing
 * @ngrx or its own runtime — it is pure data.
 */
export type MigrationStep = (data: unknown) => unknown;

const isVersioned = (raw: unknown): raw is Versioned<unknown> =>
  typeof raw === 'object' &&
  raw !== null &&
  'v' in raw &&
  'data' in raw &&
  typeof (raw as { v: unknown }).v === 'number';

/** Wrap a slice value in the current-version envelope for persistence. */
export const wrapVersioned = <T>(v: number, data: T): Versioned<T> => ({
  v,
  data,
});

/**
 * Bring a persisted document up to `current` and return its migrated data.
 *
 * - `null`/`undefined` (absent key) → `null`, so the reducer falls back to its
 *   initialState on `loaded(null)` — a fresh install.
 * - A legacy bare document (no `{ v, data }` envelope) is treated as version 1,
 *   the pre-versioning baseline.
 * - Applies the ladder steps for versions `[stored, current)` in order. A hop
 *   with no registered step passes through unchanged. A document already at (or
 *   above) `current` is returned as-is — never downgraded.
 *
 * A step that throws propagates to the caller: the load effect treats it as a
 * non-destructive empty load (`loaded(null)`) and leaves the bytes on disk for
 * a fixed build to retry — it must never wipe.
 */
export function runMigrations<T>(
  raw: unknown,
  current: number,
  ladder: MigrationStep[]
): T | null {
  if (raw === null || raw === undefined) return null;
  const stored = isVersioned(raw) ? raw.v : 1;
  let data: unknown = isVersioned(raw) ? raw.data : raw;
  for (let from = stored; from < current; from++) {
    const step = ladder[from - 1];
    if (step) data = step(data);
  }
  return data as T;
}
