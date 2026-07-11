import { LoadedDatastore } from '../types';

export const VERSION: string = '3';

type Migration = {
  from: string;
  to: string;
  apply: (data: LoadedDatastore) => LoadedDatastore;
};

// Append a new entry whenever VERSION (settings.reducer.ts) is bumped.
// Each step receives the full datastore at version `from` and returns it
// at version `to`. Steps are applied in order until the persisted version
// matches the target.
export const migrations: Migration[] = [
  {
    from: '1',
    to: '2',
    apply: (data) => {
      const officeTime = data.officeTime as
        | (NonNullable<LoadedDatastore['officeTime']> & {
            targetPercentage?: number;
          })
        | null
        | undefined;
      if (!officeTime) return data;
      const { targetPercentage, ...rest } = officeTime;
      const daysPerWeek = Math.min(
        5,
        Math.max(0, Math.round(((targetPercentage ?? 50) / 20) * 2) / 2)
      );
      return {
        ...data,
        officeTime: { ...rest, targetOfficeDaysPerWeek: daysPerWeek },
      };
    },
  },
  {
    from: '2',
    to: '3',
    apply: (data) => ({
      ...data,
      notifications: data.notifications ?? {
        items: [],
        doneCollapsed: true,
        lastViewedAt: '1970-01-01T00:00:00.000Z',
      },
    }),
  },
];

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
  // settingsActions.updateSettings will persist it.
  if (next.settings && next.settings.version !== target) {
    next = {
      ...next,
      settings: { ...next.settings, version: target },
    };
    changed = true;
  }

  return { data: next, changed };
};
