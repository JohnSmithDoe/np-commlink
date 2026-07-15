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
  target: string
): { data: LoadedDatastore; changed: boolean } => {
  let next = data;
  let changed = false;
  let current = data.settings?.version;

  for (const step of migrations) {
    if (step.from !== current) continue;
    next = step.apply(next);
    current = step.to;
    changed = true;
  }

  // If a settings-page slice exists but its version drifted (e.g. last step
  // didn't quite land on target), stamp it. For fresh users (settings-page
  // is null) we deliberately do nothing — the reducer's initialState
  // is the single source of truth for defaults, and the first
  // SettingsActions.updateSettings will persist it.
  if (next.settings && next.settings.version !== target) {
    next = {
      ...next,
      settings: { ...next.settings, version: target },
    };
    changed = true;
  }

  return { data: next, changed };
};
