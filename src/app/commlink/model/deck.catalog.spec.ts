import de from '../../../../public/i18n/de.json';
import en from '../../../../public/i18n/en.json';
import { TTheme } from '../../@shared/model/app.types';
import { DECK_CATALOG } from './deck.catalog';

const THEMES: readonly TTheme[] = ['cyberpunk', 'boomer'];
const CATALOGS: Record<string, Record<string, string>> = { de, en };

const labelKeys = (theme: TTheme): string[] =>
  DECK_CATALOG.flatMap((entry) => [
    `deck.${theme}.${entry.id}.name`,
    `deck.${theme}.${entry.id}.desc`,
  ]);

describe('DECK_CATALOG', () => {
  // `translate` renders the raw key on a miss, so an incomplete theme would put
  // `deck.<theme>.<id>.name` on screen. Adding a theme therefore means adding
  // its whole codename block — enforced here rather than remembered.
  describe.each(Object.entries(CATALOGS))('the %s messages', (_, messages) => {
    it.each(THEMES)('name and describe every program under %s', (theme) => {
      const missing = labelKeys(theme).filter((key) => !(key in messages));
      expect(missing).toEqual([]);
    });

    it('label every module the catalog groups by', () => {
      const modules = new Set(DECK_CATALOG.map((entry) => entry.module));
      const missing = [...modules]
        .map((module) => `deck.module.${module}`)
        .filter((key) => !(key in messages));
      expect(missing).toEqual([]);
    });

    it('title every entry the side menu renders', () => {
      const missing = DECK_CATALOG.map((entry) => entry.titleKey).filter(
        (key) => !(key in messages)
      );
      expect(missing).toEqual([]);
    });
  });

  // Ids are the persisted config's only reference to a program, so a duplicate
  // would make two entries share one user's visibility choice.
  it('gives every entry a unique id', () => {
    const ids = DECK_CATALOG.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
