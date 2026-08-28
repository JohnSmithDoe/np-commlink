import { DECK_CATALOG } from '../model/deck.catalog';
import { DeckEntry } from '../model/deck.types';
import { programIconFor, programReturnFor } from './program-route';

describe('programIconFor', () => {
  it('gives a program its catalog glyph, on its own route and inside it', () => {
    expect(programIconFor(DECK_CATALOG, '/cash')).toBe('wallet-outline');
    expect(programIconFor(DECK_CATALOG, '/cash/report')).toBe('wallet-outline');
  });

  it('answers nothing for a route no program owns', () => {
    expect(programIconFor(DECK_CATALOG, '/nowhere')).toBeUndefined();
  });

  it('matches whole segments, so a longer name is not the same program', () => {
    expect(programIconFor(DECK_CATALOG, '/cashflow')).toBeUndefined();
  });

  it('does not lend a sub-page program its glyph on the profile-scoped path', () => {
    expect(programIconFor(DECK_CATALOG, '/vitals/iching')).toBe(
      'layers-outline'
    );
    expect(programIconFor(DECK_CATALOG, '/vitals/iching/cast')).toBe(
      'disc-outline'
    );
    expect(programIconFor(DECK_CATALOG, '/vitals/profile/x/iching')).toBe(
      'pulse-outline'
    );
    expect(programIconFor(DECK_CATALOG, '/vitals/profile/x/iching/cast')).toBe(
      'pulse-outline'
    );
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

describe('programReturnFor', () => {
  it('marks a program own route, so nothing offers to leave it', () => {
    expect(programReturnFor(DECK_CATALOG, '/cash')).toEqual({
      isProgram: true,
    });
    expect(programReturnFor(DECK_CATALOG, '/cash/spending')).toEqual({
      isProgram: true,
    });
  });

  it('names the program a child page sits inside', () => {
    expect(programReturnFor(DECK_CATALOG, '/cash/report')).toEqual({
      isProgram: false,
      parent: { route: '/cash', titleKey: 'page-title.cash' },
    });
  });

  it('leaves a page the catalog does not know free to name its own parent', () => {
    expect(programReturnFor(DECK_CATALOG, '/tasks/categories')).toEqual({
      isProgram: false,
    });
  });
});
