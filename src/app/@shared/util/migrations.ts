import { LoadedDatastore } from '../types';

// Fresh baseline (start-over, 2026-07-14): the current on-disk shapes ARE
// version 1. All pre-1 data-format migrations (targetPercentage→days,
// notifications backfill, and the globals→products key renames that lived in
// database.service.ts) were dropped when the store was reset. The framework
// below is kept alive so the format can evolve again — see `migrations`.
export const VERSION: string = '1';

type Migration = {
  from: string;
  to: string;
  apply: (data: LoadedDatastore) => LoadedDatastore;
};

// Intentionally empty at the fresh baseline. To evolve the persisted format:
// bump VERSION and append a step, e.g.
//   { from: '1', to: '2', apply: (data) => ({ ...data, /* transform */ }) }
// Each step receives the full datastore at version `from` and returns it at
// version `to`; steps apply in order until the persisted version matches VERSION.
export const migrations: Migration[] = [];

export const migrate = (
  data: LoadedDatastore,
  _target: string
): { data: LoadedDatastore; changed: boolean } => {
  // Empty at the fresh baseline, so this is a no-op pass-through. The version
  // anchor + stamping used to read the `settings` slice, which moved into
  // office-time/model when each context took ownership of its types (DDD review
  // #1) and is no longer part of LoadedDatastore. When a real step returns,
  // re-thread a version source (and its from/to gating) through here.
  let next = data;
  let changed = false;
  for (const step of migrations) {
    next = step.apply(next);
    changed = true;
  }
  return { data: next, changed };
};
