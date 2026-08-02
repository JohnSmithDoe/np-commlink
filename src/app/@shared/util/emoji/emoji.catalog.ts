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

let pending: Promise<EmojiGroup[]> | undefined;

export const loadEmojiCatalog = (language: Language): Promise<EmojiGroup[]> =>
  (pending ??= DATA_BY_LANGUAGE[language]().then(toGroups));

export const emojiMatching = (query: string) => {
  const matches = matcherFor(query);
  return (entry: EmojiEntry) => matches(entry.keywords);
};
