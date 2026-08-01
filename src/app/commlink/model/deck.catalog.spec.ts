import de from '../../../../public/i18n/de.json';
import en from '../../../../public/i18n/en.json';
import { TMarker, TTheme } from '../../@shared/model/app.types';
import { DECK_CATALOG, DECK_CHROME_FIELDS } from './deck.catalog';
import { DECK_CHROME_LABELS, DECK_MODULE_LABELS } from './deck.labels';

const THEMES: readonly TTheme[] = ['cyberpunk', 'boomer'];
const CATALOGS: Record<string, Record<string, string>> = { de, en };

const labelKeys = (theme: TTheme): TMarker[] =>
  DECK_CATALOG.flatMap((entry) => [
    entry.labels[theme].nameKey,
    entry.labels[theme].descKey,
  ]);

const chromeKeys = (theme: TTheme): TMarker[] =>
  DECK_CHROME_FIELDS.map((field) => DECK_CHROME_LABELS[theme][field]);

// Every key here is read off the declaration it verifies, never rebuilt by
// concatenation: a spec that re-derives `deck.<theme>.<id>.name` passes on a
// typo'd `marker(...)` literal while the UI shows the raw key.
describe('DECK_CATALOG', () => {
  // `translate` renders the raw key on a miss, so an incomplete theme would put
  // `deck.<theme>.<id>.name` on screen. Adding a theme is a compile error at
  // every entry now; this is what still catches a missing *message*.
  describe.each(Object.entries(CATALOGS))('the %s messages', (_, messages) => {
    it.each(THEMES)('name and describe every program under %s', (theme) => {
      const missing = labelKeys(theme).filter((key) => !(key in messages));
      expect(missing).toEqual([]);
    });

    // The HUD's own copy is voiced too — a theme that only brought codenames
    // would put a plain office deck back in Shadowrun German.
    it.each(THEMES)('voice the whole HUD chrome under %s', (theme) => {
      const missing = chromeKeys(theme).filter((key) => !(key in messages));
      expect(missing).toEqual([]);
    });

    it('label every module the catalog groups by', () => {
      const missing = Object.values(DECK_MODULE_LABELS).filter(
        (key) => !(key in messages)
      );
      expect(missing).toEqual([]);
    });

    // The badge is a bare number on screen; its accessible name comes from the
    // entry's own `metricKey`.
    it('name every metric a tile badges', () => {
      const missing = DECK_CATALOG.map((entry) => entry.metricKey)
        .filter((key): key is TMarker => !!key)
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

  // A badge with no accessible name reads as a naked number to a screen reader,
  // and the pairing is the one thing the type system cannot state: `metric` and
  // `metricKey` are independent optional fields.
  it('gives every badged tile a metric label', () => {
    const unnamed = DECK_CATALOG.filter(
      (entry) => !!entry.metric !== !!entry.metricKey
    ).map((entry) => entry.id);
    expect(unnamed).toEqual([]);
  });

  // The module axis of the config page is `TAppModule`, and the catalog is the
  // only thing that populates it — a module no entry carries would render a
  // toggle that switches nothing.
  it('labels no module the catalog does not use', () => {
    const used = new Set(DECK_CATALOG.map((entry) => entry.module));
    const unused = Object.keys(DECK_MODULE_LABELS).filter(
      (module) => !used.has(module as (typeof DECK_CATALOG)[number]['module'])
    );
    expect(unused).toEqual([]);
  });
});

// Beside DECK_CATALOG rather than beside deck.utils, where these two used to
// sit: the subject is the field list and the label block, both declared here.
describe('DECK_CHROME_LABELS', () => {
  // The point of a per-theme block: OK Boomer must not read "Rauschen" at a
  // plain office desk.
  it('gives the two themes distinct keys', () => {
    expect(DECK_CHROME_LABELS['cyberpunk']['noise']).not.toBe(
      DECK_CHROME_LABELS['boomer']['noise']
    );
  });

  it('covers every declared chrome field', () => {
    expect(Object.keys(DECK_CHROME_LABELS['boomer'])).toEqual([
      ...DECK_CHROME_FIELDS,
    ]);
  });
});
