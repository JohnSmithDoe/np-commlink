import { LoadedDatastore } from '../types';

// Schema version of the persisted docs. Bumped 1→2 for the category `{id,name}`
// epic: items/txns/rules now reference categories BY ID and the catalog holds
// objects, which is incompatible with the old name-string docs. Rather than a
// data migration (per the repo's fresh-baseline convention), DatabaseService
// clears the store once when the stored version ≠ VERSION and re-stamps it — a
// one-time reset on first v2 load. The step-based framework below stays for a
// future format that DOES want an in-place migration.
export const VERSION: string = '2';

type Migration = {
  from: string;
  to: string;
  apply: (data: LoadedDatastore) => LoadedDatastore;
};

// Intentionally empty at the fresh baseline. To evolve the persisted format: bump VERSION and append a step, e.g.
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
