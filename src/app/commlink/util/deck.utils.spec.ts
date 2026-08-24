import { DashboardState } from '../model/dashboard.types';
import { DeckEntry, DeckState } from '../model/deck.types';
import { DECK_CHROME_LABELS } from '../model/deck.labels';
import {
  badgeLabel,
  badgeValue,
  entriesOnDeck,
  groupByModule,
  groupingModules,
  setIn,
  nodeStatusKey,
  programStatus,
  resonanceRatingOf,
  isEntryVisible,
  isFactoryDeck,
  moveOnDeck,
  orderEntries,
  resolveLabels,
  toggleIn,
} from './deck.utils';

const entry = (id: string, module: DeckEntry['module']): DeckEntry => ({
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

const CATALOG: readonly DeckEntry[] = [
  entry('shopping', 'household'),
  entry('storage', 'household'),
  entry('cash', 'cash'),
];

const state = (overrides: Partial<DeckState> = {}): DeckState => ({
  order: [],
  visibleEntries: [],
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

  it('appends entries the configuration has never seen', () => {
    expect(
      orderEntries(CATALOG, ['cash']).map((ordered) => ordered.id)
    ).toEqual(['cash', 'shopping', 'storage']);
  });

  it('drops ids the catalog no longer carries', () => {
    expect(
      orderEntries(CATALOG, ['retired', 'cash']).map((ordered) => ordered.id)
    ).toEqual(['cash', 'shopping', 'storage']);
  });
});

describe('groupingModules', () => {
  it('names only the modules that hold more than one program', () => {
    expect([...groupingModules(CATALOG)]).toEqual(['household']);
  });
});

describe('isEntryVisible', () => {
  it('shows an entry the user switched on', () => {
    const config = state({ visibleEntries: ['cash'] });
    expect(isEntryVisible(config, entry('cash', 'cash'))).toBe(true);
  });

  it('hides an entry nothing names, so a new one arrives off', () => {
    expect(isEntryVisible(state(), entry('storage', 'household'))).toBe(false);
  });
});

describe('entriesOnDeck', () => {
  it('applies the order and the visible set at once', () => {
    const config = state({
      order: ['cash', 'storage', 'shopping'],
      visibleEntries: ['cash', 'shopping'],
    });
    expect(entriesOnDeck(CATALOG, config).map((ordered) => ordered.id)).toEqual(
      ['cash', 'shopping']
    );
  });

  it('is empty on a cold deck, whatever the catalog holds', () => {
    expect(entriesOnDeck(CATALOG, state())).toEqual([]);
  });
});

describe('moveOnDeck', () => {
  const order = ['cash', 'storage', 'shopping', 'tasks'];
  const visible = ['cash', 'shopping', 'tasks'];

  it('swaps a program with the next one the deck actually shows', () => {
    expect(moveOnDeck(order, visible, 'cash', 1)).toEqual([
      'shopping',
      'storage',
      'cash',
      'tasks',
    ]);
  });

  it('leaves a hidden entry where it sits, so the config order does not shift', () => {
    expect(moveOnDeck(order, visible, 'shopping', -1)[1]).toBe('storage');
  });

  it('refuses to move the first program earlier or the last one later', () => {
    expect(moveOnDeck(order, visible, 'cash', -1)).toEqual(order);
    expect(moveOnDeck(order, visible, 'tasks', 1)).toEqual(order);
  });

  it('is inert for an id the deck is not showing', () => {
    expect(moveOnDeck(order, visible, 'storage', 1)).toEqual(order);
    expect(moveOnDeck(order, visible, 'nothing', -1)).toEqual(order);
  });
});

describe('resolveLabels', () => {
  const shopping = entry('shopping', 'household');

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

const reporting = (overrides: Partial<DeckEntry>): DeckEntry => ({
  ...entry('shopping', 'household'),
  ...overrides,
});

describe('badgeValue', () => {
  const telemetry: DashboardState = {
    bySource: {
      shopping: { source: 'shopping', metrics: { active: 3 } },
      cash: { source: 'cash', metrics: { balance: '1234' } },
    },
  };

  it('reads the metric the catalog entry names', () => {
    expect(
      badgeValue(telemetry, reporting({ source: 'shopping', metric: 'active' }))
    ).toBe(3);
  });

  it('coerces a reported string to the number a badge renders', () => {
    expect(
      badgeValue(telemetry, reporting({ source: 'cash', metric: 'balance' }))
    ).toBe(1234);
  });

  it('is null for an entry that reports nothing', () => {
    expect(badgeValue(telemetry, reporting({}))).toBeNull();
    expect(badgeValue(telemetry, reporting({ source: 'shopping' }))).toBeNull();
  });

  it('is null for a source that has not reported yet, which is not zero', () => {
    expect(
      badgeValue(telemetry, reporting({ source: 'tasks', metric: 'open' }))
    ).toBeNull();
  });
});

describe('programStatus', () => {
  const silent: DashboardState = { bySource: {} };

  it('reports a source-less entry’s declared status', () => {
    expect(programStatus(reporting({}), silent, 'probing')).toBe('online');
  });

  it('reports standby for a telemetry-backed entry whose source is silent', () => {
    expect(
      programStatus(reporting({ source: 'tracking' }), silent, 'probing')
    ).toBe('standby');
  });

  it('reports what the read-model holds once the source has reported', () => {
    const reported: DashboardState = {
      bySource: {
        tracking: { source: 'tracking', metrics: {}, status: 'online' },
      },
    };

    expect(
      programStatus(reporting({ source: 'tracking' }), reported, 'probing')
    ).toBe('online');
  });

  it.each([
    ['available', 'online'],
    ['downloadable', 'standby'],
    ['downloading', 'standby'],
    ['probing', 'standby'],
    ['unavailable', 'offline'],
  ] as const)(
    'maps a %s on-device model to a %s tile',
    (reported, expected) => {
      expect(
        programStatus(reporting({ needsLanguageModel: true }), silent, reported)
      ).toBe(expected);
    }
  );
});

describe('badgeLabel', () => {
  it('renders a plain count for a non-currency entry', () => {
    expect(badgeLabel(reporting({}), 7, 'cyberpunk', 'de')).toBe('7');
  });

  it('renders the themed currency label for a currency entry', () => {
    expect(
      badgeLabel(reporting({ currency: true }), 1234, 'cyberpunk', 'de')
    ).toBe('¥ 1234 nyen');
    expect(
      badgeLabel(reporting({ currency: true }), 1234, 'boomer', 'de')
    ).toContain('€');
  });
});

describe('nodeStatusKey', () => {
  it('names the status word in the active theme’s register', () => {
    expect(nodeStatusKey(DECK_CHROME_LABELS['cyberpunk'], 'standby')).toBe(
      'deck.cyberpunk.chrome.node-standby'
    );
    expect(nodeStatusKey(DECK_CHROME_LABELS['boomer'], 'standby')).toBe(
      'deck.boomer.chrome.node-standby'
    );
  });
});

describe('isFactoryDeck', () => {
  const factory: DeckState = {
    order: [],
    visibleEntries: ['shopping', 'storage'],
  };

  it('recognizes the factory deck itself', () => {
    expect(isFactoryDeck(factory, factory)).toBe(true);
  });

  it('reads a toggle as custom, in either direction', () => {
    expect(
      isFactoryDeck({ ...factory, visibleEntries: ['shopping'] }, factory)
    ).toBe(false);
    expect(
      isFactoryDeck(
        { ...factory, visibleEntries: ['shopping', 'storage', 'tasks'] },
        factory
      )
    ).toBe(false);
  });

  it('ignores the order the entries were toggled in', () => {
    expect(
      isFactoryDeck(
        { ...factory, visibleEntries: ['storage', 'shopping'] },
        factory
      )
    ).toBe(true);
  });

  it('reads a drag as custom, because that order is the choice', () => {
    expect(isFactoryDeck({ ...factory, order: ['storage'] }, factory)).toBe(
      false
    );
  });
});

describe('setIn', () => {
  it('adds every id that is missing and keeps the rest untouched', () => {
    expect(setIn(['cash'], ['shopping', 'cash', 'storage'], true)).toEqual([
      'cash',
      'shopping',
      'storage',
    ]);
  });

  it('removes every id it is handed', () => {
    expect(
      setIn(['cash', 'shopping', 'storage'], ['cash', 'storage'], false)
    ).toEqual(['shopping']);
  });
});

const configured = (hidden: string[] = []) =>
  groupByModule(
    CATALOG.map(resolveLabels('cyberpunk')).map((program) => ({
      ...program,
      hidden: hidden.includes(program.id),
    }))
  );

describe('groupByModule', () => {
  it('keeps catalog order and collects a module into one group', () => {
    expect(configured().map((group) => group.module)).toEqual([
      'household',
      'cash',
    ]);
    expect(configured()[0].programs.map((p) => p.id)).toEqual([
      'shopping',
      'storage',
    ]);
  });

  it('marks a module of one as ungrouped, so it stays a plain row', () => {
    expect(configured().map((group) => group.grouped)).toEqual([true, false]);
  });

  it('derives the module state from its children', () => {
    const [household] = configured(['storage']);
    expect(household.visibleCount).toBe(1);
    expect(household.allVisible).toBe(false);
    expect(configured()[0].allVisible).toBe(true);
  });
});

describe('resonanceRatingOf', () => {
  it('scales a percentage onto the deck’s six-point rating', () => {
    expect(resonanceRatingOf(0)).toBe('0.0');
    expect(resonanceRatingOf(50)).toBe('3.0');
    expect(resonanceRatingOf(100)).toBe('6.0');
  });
});
