import { LoadedDatastore } from '../types';
import { migrate, migrations, VERSION } from './migrations';

// The fresh baseline (2026-07-14) drops every pre-1 data-format step but keeps
// the framework. These specs pin the framework's generic behaviour so a future
// step can be added with confidence — they do NOT assert any specific transform.
describe('migrate', () => {
  it('has no data-format steps at the fresh baseline (framework kept alive)', () => {
    expect(migrations).toEqual([]);
  });

  it('is a no-op when the store is already at the current version', () => {
    const current = {
      settings: { showTotalTime: false, version: VERSION },
    } as unknown as LoadedDatastore;

    const { data, changed } = migrate(current, VERSION);

    expect(changed).toBe(false);
    expect(data).toBe(current);
  });

  it('normalizes a drifted version stamp up to the current version', () => {
    const drifted = {
      settings: { showTotalTime: false, version: '0' },
    } as unknown as LoadedDatastore;

    const { data, changed } = migrate(drifted, VERSION);

    expect(changed).toBe(true);
    expect(data.settings?.version).toBe(VERSION);
  });

  it('leaves a fresh user (no settings slice) untouched', () => {
    const fresh = { settings: null } as unknown as LoadedDatastore;

    const { data, changed } = migrate(fresh, VERSION);

    expect(changed).toBe(false);
    expect(data.settings).toBeNull();
  });
});
