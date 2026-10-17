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
  de: async () => {
    const { EMOJI_DATA_DE } = await import('./emoji.data.de');
    return EMOJI_DATA_DE;
  },
  en: async () => {
    const { EMOJI_DATA_EN } = await import('./emoji.data.en');
    return EMOJI_DATA_EN;
  },
  fr: async () => {
    const { EMOJI_DATA_FR } = await import('./emoji.data.fr');
    return EMOJI_DATA_FR;
  },
};

const toEntry = (data: EmojiData): EmojiEntry => {
  return {
    ...data,
    keywords: `${data.label} ${data.tags}`.toLowerCase(),
  };
};

export const toGroups = (data: EmojiDataByGroup): EmojiGroup[] => {
  return EMOJI_GROUP_IDS.map((id) => {
    return {
      id,
      entries: (data[id] ?? []).map((entry) => toEntry(entry)),
    };
  });
};

const pending = new Map<Language, Promise<EmojiGroup[]>>();

const loadGroups = async (language: Language): Promise<EmojiGroup[]> => {
  let data: EmojiDataByGroup;
  try {
    data = await DATA_BY_LANGUAGE[language]();
  } catch (error) {
    pending.delete(language);
    throw error;
  }
  return toGroups(data);
};

export const loadEmojiCatalog = (language: Language): Promise<EmojiGroup[]> => {
  const cached = pending.get(language);
  if (cached) return cached;
  const load = loadGroups(language);
  pending.set(language, load);
  return load;
};

export const emojiMatching = (query: string) => {
  const isMatches = matcherFor(query);
  return (entry: EmojiEntry) => isMatches(entry.keywords);
};
