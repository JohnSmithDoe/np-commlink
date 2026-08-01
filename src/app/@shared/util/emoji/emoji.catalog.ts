import { TLanguage } from '../../model/app.types';
import { matcherFor } from '../app.utils';

export type TEmojiGroupId =
  | 'smileys'
  | 'people'
  | 'nature'
  | 'food'
  | 'travel'
  | 'activities'
  | 'objects'
  | 'symbols';

export const EMOJI_GROUP_IDS = [
  'smileys',
  'people',
  'nature',
  'food',
  'travel',
  'activities',
  'objects',
  'symbols',
] as const satisfies readonly TEmojiGroupId[];

/** One emoji as the generated modules ship it. */
type TEmojiData = {
  glyph: string;
  /** The CLDR name, verbatim — what a screen reader announces for the cell. */
  label: string;
  /** Only the CLDR synonyms the label does not already contain. */
  tags: string;
};

export type TEmojiEntry = TEmojiData & {
  /** Label and tags as one lowercase haystack, built once per session. */
  keywords: string;
};

export type TEmojiGroup = {
  id: TEmojiGroupId;
  entries: readonly TEmojiEntry[];
};

type TEmojiDataByGroup = Readonly<Record<string, readonly TEmojiData[]>>;

/**
 * Both language modules sit behind `import()`, so neither reaches a route
 * chunk: they are fetched when the picker first opens, and only for the active
 * language.
 */
const DATA_BY_LANGUAGE: Record<TLanguage, () => Promise<TEmojiDataByGroup>> = {
  de: () => import('./emoji.data.de').then((module) => module.EMOJI_DATA_DE),
  en: () => import('./emoji.data.en').then((module) => module.EMOJI_DATA_EN),
};

// The haystack is assembled once at load rather than per keystroke, and the
// generated data keeps it out of the payload: repeating the label inside a
// keywords field costs ~7K gzip per language for something a concat rebuilds.
const toEntry = (data: TEmojiData): TEmojiEntry => ({
  ...data,
  keywords: `${data.label} ${data.tags}`.toLowerCase(),
});

export const toGroups = (data: TEmojiDataByGroup): TEmojiGroup[] =>
  EMOJI_GROUP_IDS.map((id) => ({
    id,
    entries: (data[id] ?? []).map((entry) => toEntry(entry)),
  }));

/**
 * Memoised on the promise, not the value, so concurrent openers share one
 * import instead of racing two.
 *
 * Deliberately not keyed by language: switching restarts the app
 * (`SettingsEffects.restartOnLanguageChange$`), so this can never be observed
 * holding the wrong one.
 */
let pending: Promise<TEmojiGroup[]> | undefined;

export const loadEmojiCatalog = (language: TLanguage): Promise<TEmojiGroup[]> =>
  (pending ??= DATA_BY_LANGUAGE[language]().then(toGroups));

/**
 * Substring matching, like every other search surface here — which is what lets
 * a German compound resolve from its label alone ("hund" finds "Hundegesicht"),
 * and why a tag repeating a label word is dropped at build time.
 */
export const emojiMatching = (query: string) => {
  const matches = matcherFor(query);
  return (entry: TEmojiEntry) => matches(entry.keywords);
};
