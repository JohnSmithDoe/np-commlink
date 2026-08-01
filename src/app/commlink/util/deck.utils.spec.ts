import { IDeckEntry, IDeckState } from '../model/deck.types';
import {
  isEntryVisible,
  orderEntries,
  resolveLabels,
  toggleIn,
  visibleEntries,
} from './deck.utils';

const entry = (id: string, module: IDeckEntry['module']): IDeckEntry => ({
  id,
  module,
  icon: 'hardware-chip-outline',
  route: `/${id}`,
  titleKey: `page-title.${id}`,
  labels: {
    cyberpunk: { nameKey: `${id}.cyber.name`, descKey: `${id}.cyber.desc` },
    boomer: { nameKey: `${id}.plain.name`, descKey: `${id}.plain.desc` },
  },
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
    expect(orderEntries(CATALOG, []).map((ordered) => ordered.id)).toEqual([
      'shopping',
      'storage',
      'cash',
    ]);
  });

  it('follows the configured order', () => {
    expect(
      orderEntries(CATALOG, ['cash', 'storage', 'shopping']).map(
        (ordered) => ordered.id
      )
    ).toEqual(['cash', 'storage', 'shopping']);
  });

  // Absence means default, which is what lets the catalog grow between releases
  // without a migration: an entry the config predates lands at the end.
  it('appends entries the configuration has never seen', () => {
    expect(
      orderEntries(CATALOG, ['cash']).map((ordered) => ordered.id)
    ).toEqual(['cash', 'shopping', 'storage']);
  });

  // The other half of the same bargain: a released entry can be deleted.
  it('drops ids the catalog no longer carries', () => {
    expect(
      orderEntries(CATALOG, ['retired', 'cash']).map((ordered) => ordered.id)
    ).toEqual(['cash', 'shopping', 'storage']);
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
    expect(
      visibleEntries(CATALOG, config).map((ordered) => ordered.id)
    ).toEqual(['cash', 'shopping']);
  });
});

describe('resolveLabels', () => {
  const shopping = entry('shopping', 'groceries');

  it('lifts the active theme’s pair onto the program', () => {
    expect(resolveLabels('cyberpunk')(shopping)).toMatchObject(
      shopping.labels.cyberpunk
    );
  });

  it('follows a theme switch', () => {
    expect(resolveLabels('boomer')(shopping).nameKey).toBe(
      shopping.labels.boomer.nameKey
    );
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
