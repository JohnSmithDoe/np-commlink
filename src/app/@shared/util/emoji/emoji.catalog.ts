/* ─── why ─────────────────────────────────────────────────────────
 * The load memo is keyed BY LANGUAGE, and it has to be: a single
 * `pending` promise ignored the argument it was called with, so the
 * first language loaded won forever and switching the app's language
 * kept the old labels until a reload. The offline spec is what surfaced
 * it — it induces a failure through an unknown language and only saw it
 * when no other spec had warmed the memo first.
 * ───────────────────────────────────────────────────────────────── */
import { Language } from '../../model/app.types';
import { matcherFor } from '../app.utils';

export type EmojiGroupId =
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
] as const satisfies readonly EmojiGroupId[];

export const isGroupId = (value: unknown): value is EmojiGroupId =>
  EMOJI_GROUP_IDS.includes(value as EmojiGroupId);

type EmojiData = {
  glyph: string;
  label: string;
  tags: string;
};

export type EmojiEntry = EmojiData & {
  keywords: string;
};

export type EmojiGroup = {
  id: EmojiGroupId;
  entries: readonly EmojiEntry[];
};

type EmojiDataByGroup = Readonly<Record<string, readonly EmojiData[]>>;

const DATA_BY_LANGUAGE: Record<Language, () => Promise<EmojiDataByGroup>> = {
  de: () => import('./emoji.data.de').then((module) => module.EMOJI_DATA_DE),
  en: () => import('./emoji.data.en').then((module) => module.EMOJI_DATA_EN),
  fr: () => import('./emoji.data.fr').then((module) => module.EMOJI_DATA_FR),
};

const toEntry = (data: EmojiData): EmojiEntry => ({
  ...data,
  keywords: `${data.label} ${data.tags}`.toLowerCase(),
});

export const toGroups = (data: EmojiDataByGroup): EmojiGroup[] =>
  EMOJI_GROUP_IDS.map((id) => ({
    id,
    entries: (data[id] ?? []).map((entry) => toEntry(entry)),
  }));

const pending = new Map<Language, Promise<EmojiGroup[]>>();

export const loadEmojiCatalog = (language: Language): Promise<EmojiGroup[]> => {
  const cached = pending.get(language);
  if (cached) return cached;
  const load = DATA_BY_LANGUAGE[language]()
    .then(toGroups)
    .catch((error: unknown) => {
      pending.delete(language);
      throw error;
    });
  pending.set(language, load);
  return load;
};

export const emojiMatching = (query: string) => {
  const matches = matcherFor(query);
  return (entry: EmojiEntry) => matches(entry.keywords);
};
