import { LoadedDatastore } from '../types';
import { migrate, VERSION } from './migrations';

// A minimally-shaped datastore at a given schema version. The migration only
// touches `settings.version`, `officeTime` and `notifications`, so the other
// slices can stay loose.
const storeAtV1 = (): LoadedDatastore =>
  ({
    settings: { showTotalTime: false, version: '1' },
    officeTime: { targetPercentage: 60 },
    tracking: null,
    notifications: undefined,
  }) as unknown as LoadedDatastore;

describe('migrate', () => {
  it('walks a v1 store up to the current version', () => {
    const { data, changed } = migrate(storeAtV1(), VERSION);

    expect(changed).toBe(true);
    expect(data.settings?.version).toBe(VERSION);
  });

  it('converts the legacy targetPercentage into office days per week', () => {
    const { data } = migrate(storeAtV1(), VERSION);
    const officeTime = data.officeTime as Record<string, unknown>;

    // round((60/20)*2)/2 === 3
    expect(officeTime['targetOfficeDaysPerWeek']).toBe(3);
    expect(officeTime['targetPercentage']).toBeUndefined();
  });

  it('backfills a default notifications slice (v2 -> v3)', () => {
    const { data } = migrate(storeAtV1(), VERSION);
    expect(data.notifications).toEqual({
      items: [],
      doneCollapsed: true,
      lastViewedAt: '1970-01-01T00:00:00.000Z',
    });
  });

  it('is a no-op when the store is already current', () => {
    const current = {
      settings: { showTotalTime: false, version: VERSION },
      notifications: { items: [], doneCollapsed: true, lastViewedAt: 'x' },
    } as unknown as LoadedDatastore;

    const { data, changed } = migrate(current, VERSION);
    expect(changed).toBe(false);
    expect(data).toBe(current);
  });

  it('leaves a fresh user (no settings slice) untouched', () => {
    const fresh = { settings: null } as unknown as LoadedDatastore;
    const { data, changed } = migrate(fresh, VERSION);
    expect(changed).toBe(false);
    expect(data.settings).toBeNull();
  });
});
