import { IDeckEntry, IDeckState } from '../model/deck.types';
import {
  isEntryVisible,
  moveEntry,
  orderEntries,
  resolveLabels,
  toggleIn,
  visibleEntries,
} from './deck.utils';

const entry = (id: string, module: IDeckEntry['module']): IDeckEntry => ({
  id,
  module,
  icon: 'icon',
  route: `/${id}`,
  titleKey: `page-title.${id}`,
  onDeck: true,
});

const CATALOG: readonly IDeckEntry[] = [
  entry('shopping', 'groceries'),
  entry('storage', 'groceries'),
  entry('cash', 'cash'),
];

const state = (overrides: Partial<IDeckState> = {}): IDeckState => ({
  order: [],
  hiddenEntries: [],
  hiddenModules: [],
  ...overrides,
});

describe('orderEntries', () => {
  it('falls back to catalog order when nothing is configured', () => {
    expect(orderEntries(CATALOG, []).map((e) => e.id)).toEqual([
      'shopping',
      'storage',
      'cash',
    ]);
  });

  it('follows the configured order', () => {
    expect(
      orderEntries(CATALOG, ['cash', 'storage', 'shopping']).map((e) => e.id)
    ).toEqual(['cash', 'storage', 'shopping']);
  });

  // Absence means default, which is what lets the catalog grow between releases
  // without a migration: an entry the config predates lands at the end.
  it('appends entries the configuration has never seen', () => {
    expect(orderEntries(CATALOG, ['cash']).map((e) => e.id)).toEqual([
      'cash',
      'shopping',
      'storage',
    ]);
  });

  // The other half of the same bargain: a released entry can be deleted.
  it('drops ids the catalog no longer carries', () => {
    expect(orderEntries(CATALOG, ['retired', 'cash']).map((e) => e.id)).toEqual(
      ['cash', 'shopping', 'storage']
    );
  });
});

describe('isEntryVisible', () => {
  it('hides an entry the user switched off', () => {
    const config = state({ hiddenEntries: ['cash'] });
    expect(isEntryVisible(config, entry('cash', 'cash'))).toBe(false);
  });

  it('hides every entry of a switched-off module', () => {
    const config = state({ hiddenModules: ['groceries'] });
    expect(isEntryVisible(config, entry('storage', 'groceries'))).toBe(false);
  });

  // The module flag cascades on read and is never written into the children, so
  // re-enabling a module restores what the user had configured underneath.
  it('leaves a child’s own flag untouched while its module is off', () => {
    const config = state({ hiddenModules: ['groceries'] });
    expect(config.hiddenEntries).toEqual([]);
    expect(isEntryVisible(state(), entry('storage', 'groceries'))).toBe(true);
  });
});

describe('visibleEntries', () => {
  it('applies the order and both flags at once', () => {
    const config = state({
      order: ['cash', 'storage', 'shopping'],
      hiddenEntries: ['storage'],
    });
    expect(visibleEntries(CATALOG, config).map((e) => e.id)).toEqual([
      'cash',
      'shopping',
    ]);
  });
});

describe('resolveLabels', () => {
  it('keys the codename off the active theme', () => {
    const resolved = resolveLabels('cyberpunk')(entry('shopping', 'groceries'));
    expect(resolved.nameKey).toBe('deck.cyberpunk.shopping.name');
    expect(resolved.descKey).toBe('deck.cyberpunk.shopping.desc');
  });

  it('follows a theme switch', () => {
    expect(
      resolveLabels('boomer')(entry('shopping', 'groceries')).nameKey
    ).toBe('deck.boomer.shopping.name');
  });
});

describe('toggleIn', () => {
  it('adds a value that is absent', () => {
    expect(toggleIn(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes a value that is present', () => {
    expect(toggleIn(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('moveEntry', () => {
  it('moves an entry down', () => {
    expect(moveEntry(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves an entry up', () => {
    expect(moveEntry(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('leaves the order alone when nothing moved', () => {
    expect(moveEntry(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });
});
