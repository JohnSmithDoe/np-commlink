import { DECK_CATALOG } from '../model/deck.catalog';
import { DeckEntry } from '../model/deck.types';
import { programIconFor } from './program-icon';

describe('programIconFor', () => {
  it('gives a program its catalog glyph, on its own route and inside it', () => {
    expect(programIconFor(DECK_CATALOG, '/cash')).toBe('wallet-outline');
    expect(programIconFor(DECK_CATALOG, '/cash/report')).toBe('wallet-outline');
  });

  it('answers nothing for a route no program owns', () => {
    expect(programIconFor(DECK_CATALOG, '/data')).toBeUndefined();
  });

  it('matches whole segments, so a longer name is not the same program', () => {
    expect(programIconFor(DECK_CATALOG, '/cashflow')).toBeUndefined();
  });

  it('ignores the query and the fragment', () => {
    expect(programIconFor(DECK_CATALOG, '/tasks/list?filter=_home')).toBe(
      'checkbox-outline'
    );
  });

  it('prefers the longest matching route', () => {
    const nested = [
      { route: '/a', icon: 'shallow' },
      { route: '/a/b', icon: 'deep' },
    ] as unknown as readonly DeckEntry[];

    expect(programIconFor(nested, '/a/b/c')).toBe('deep');
  });
});
