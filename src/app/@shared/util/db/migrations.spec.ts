import { LoadedDatastore } from '../../model/types';
import { migrate, migrations, VERSION } from './migrations';

// The fresh baseline (2026-07-14) drops every pre-1 data-format step but keeps
// the framework. These specs pin the framework's generic behaviour so a future
// step can be added with confidence — they do NOT assert any specific transform.
describe('migrate', () => {
  it('has no data-format steps at the fresh baseline (framework kept alive)', () => {
    expect(migrations).toEqual([]);
  });

  it('is a no-op pass-through while there are no steps', () => {
    const store = { tracking: null } as unknown as LoadedDatastore;

    const { data, changed } = migrate(store, VERSION);

    expect(changed).toBe(false);
    expect(data).toBe(store);
  });
});
