import de from '../../../../public/i18n/de.json';
import en from '../../../../public/i18n/en.json';
import { Marker, Skin } from '../../@shared/model/app.types';
import { DECK_CATALOG, DECK_CHROME_FIELDS } from './deck.catalog';
import { DECK_CHROME_LABELS, DECK_MODULE_LABELS } from './deck.labels';

const SKINS: readonly Skin[] = ['cyberpunk', 'boomer'];
const CATALOGS: Record<string, Record<string, string>> = { de, en };

const labelKeys = (skin: Skin): Marker[] =>
  DECK_CATALOG.flatMap((entry) => [
    entry.labels[skin].nameKey,
    entry.labels[skin].descKey,
  ]);

const chromeKeys = (skin: Skin): Marker[] =>
  DECK_CHROME_FIELDS.map((field) => DECK_CHROME_LABELS[skin][field]);

describe('DECK_CATALOG', () => {
  describe.each(Object.entries(CATALOGS))('the %s messages', (_, messages) => {
    it.each(SKINS)('name and describe every program under %s', (skin) => {
      const missing = labelKeys(skin).filter((key) => !(key in messages));
      expect(missing).toEqual([]);
    });

    it.each(SKINS)('voice the whole HUD chrome under %s', (skin) => {
      const missing = chromeKeys(skin).filter((key) => !(key in messages));
      expect(missing).toEqual([]);
    });

    it('label every module the catalog groups by', () => {
      const missing = Object.values(DECK_MODULE_LABELS).filter(
        (key) => !(key in messages)
      );
      expect(missing).toEqual([]);
    });

    it('name every metric a tile badges', () => {
      const missing = DECK_CATALOG.map((entry) => entry.metricKey)
        .filter((key): key is Marker => !!key)
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

  it('gives every entry a unique id', () => {
    const ids = DECK_CATALOG.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every badged tile a metric label', () => {
    const unnamed = DECK_CATALOG.filter(
      (entry) => !!entry.metric !== !!entry.metricKey
    ).map((entry) => entry.id);
    expect(unnamed).toEqual([]);
  });

  it('labels no module the catalog does not use', () => {
    const used = new Set(DECK_CATALOG.map((entry) => entry.module));
    const unused = Object.keys(DECK_MODULE_LABELS).filter(
      (module) => !used.has(module as (typeof DECK_CATALOG)[number]['module'])
    );
    expect(unused).toEqual([]);
  });
});

describe('DECK_CHROME_LABELS', () => {
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
