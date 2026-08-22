/* ─── why ─────────────────────────────────────────────────────────
 * The `./handbook/` prefix is relative for the reason the translate
 * loader's `./i18n/` is: an absolute `/handbook/` 404s under the
 * `/np-commlink/` base Pages serves from, and the APK resolves the
 * document's own directory. Both bases survive only relative.
 * ───────────────────────────────────────────────────────────────── */

import { HANDBOOK_GROUPS } from '../model/handbook.consts';
import { HandbookEntry, HandbookGroup } from '../model/handbook.types';

const ASSET_BASE = './handbook/';
const MARKUP = /<[^>]*>/g;

export const HANDBOOK_INDEX_URL = `${ASSET_BASE}index.json`;

export const handbookPageUrl = (slug: string): string =>
  `${ASSET_BASE}pages/${slug}.json`;

export const handbookImageUrl = (fileName: string): string =>
  `${ASSET_BASE}img/${fileName}`;

export const plainTextOf = (html: string): string =>
  html.replaceAll(MARKUP, '').trim();

export interface HandbookGroupView {
  group: HandbookGroup;
  entries: HandbookEntry[];
}

export const groupHandbookEntries = (
  entries: readonly HandbookEntry[]
): HandbookGroupView[] =>
  HANDBOOK_GROUPS.map((group) => ({
    group,
    entries: entries.filter((entry) => entry.group === group),
  })).filter((view) => view.entries.length > 0);

export const handbookNeighbours = (
  entries: readonly HandbookEntry[],
  slug: string
): { previous?: HandbookEntry; next?: HandbookEntry } => {
  const at = entries.findIndex((entry) => entry.slug === slug);
  if (at === -1) return {};
  return { previous: entries[at - 1], next: entries[at + 1] };
};
