import { DECK_CATALOG } from '../model/deck.catalog';
import { DeckEntry } from '../model/deck.types';
import { programContextFor, programSiblingsFor } from './program-route';

const iconFor = (url: string, catalog: readonly DeckEntry[] = DECK_CATALOG) =>
  programContextFor(catalog, url).icon;

const returnFor = (url: string) => {
  const { isProgram, parent } = programContextFor(DECK_CATALOG, url);
  return parent ? { isProgram, parent } : { isProgram };
};

const segmentsUnder = (prefix: string) =>
  programSiblingsFor(DECK_CATALOG, prefix).map((sibling) => sibling.segment);

describe('the program glyph', () => {
  it('gives a program its catalog glyph, on its own route and inside it', () => {
    expect(iconFor('/cash/accounts')).toBe('wallet-outline');
    expect(iconFor('/cash/accounts/a1')).toBe('wallet-outline');
  });

  it('answers nothing for a route no program owns', () => {
    expect(iconFor('/nowhere')).toBeUndefined();
  });

  it('matches whole segments, so a longer name is not the same program', () => {
    expect(iconFor('/cashflow')).toBeUndefined();
  });

  it('does not lend a sub-page program its glyph on the profile-scoped path', () => {
    expect(iconFor('/vitals/iching')).toBe('layers-outline');
    expect(iconFor('/vitals/iching/cast')).toBe('disc-outline');
    expect(iconFor('/vitals/profiles/x/iching')).toBe('pulse-outline');
    expect(iconFor('/vitals/profiles/x/iching/cast')).toBe('pulse-outline');
  });

  it('ignores the query and the fragment', () => {
    expect(iconFor('/tasks/list?filter=_home')).toBe('checkbox-outline');
  });

  it('prefers the longest matching route', () => {
    const nested = [
      { route: '/a', icon: 'shallow' },
      { route: '/a/b', icon: 'deep' },
    ] as unknown as readonly DeckEntry[];

    expect(iconFor('/a/b/c', nested)).toBe('deep');
  });
});

describe('the way back out', () => {
  it('marks a program own route, so nothing offers to leave it', () => {
    expect(returnFor('/cash/accounts')).toEqual({ isProgram: true });
    expect(returnFor('/cash/spending')).toEqual({ isProgram: true });
  });

  it('names the program a child page sits inside', () => {
    expect(returnFor('/cash/accounts/a1')).toEqual({
      isProgram: false,
      parent: { route: '/cash/accounts', titleKey: 'page-title.cash' },
    });
  });

  it('leaves a page the catalog does not know free to name its own parent', () => {
    expect(returnFor('/tasks/categories')).toEqual({ isProgram: false });
    expect(returnFor('/cash/report')).toEqual({ isProgram: false });
  });
});

describe('the programs beside this one', () => {
  it('takes every program exactly one segment below the shell', () => {
    expect(segmentsUnder('/trackplay')).toEqual([
      'games',
      'players',
      'dice',
      'board',
    ]);
  });

  it('leaves a program deeper down inside its tab own stack', () => {
    expect(segmentsUnder('/vitals')).toContain('iching');
    expect(segmentsUnder('/vitals')).not.toContain('cast');
  });

  it('answers with nothing for a prefix no program sits under', () => {
    expect(segmentsUnder('/nowhere')).toEqual([]);
  });

  it('does not take the shell own route for one of its tabs', () => {
    expect(segmentsUnder('/cash')).not.toContain('');
  });
});
