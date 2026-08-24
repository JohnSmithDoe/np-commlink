/* ─── why ─────────────────────────────────────────────────────────
 * Longest route wins. `/household` is not a program but `/household/storage`
 * is, and three entries share that prefix — matching in catalog order would
 * hand the storage list whichever one happens to be declared first.
 *
 * Matching is per SEGMENT rather than per character, so `/cash` cannot claim
 * a later `/cashflow`. A wrong glyph is silent where a missing one is not,
 * which is the whole failure mode worth defending against here.
 * ───────────────────────────────────────────────────────────────── */
import { DeckEntry } from '../model/deck.types';

const longestRouteFirst = (a: DeckEntry, b: DeckEntry): number =>
  b.route.length - a.route.length;

export const programIconFor = (
  catalog: readonly DeckEntry[],
  url: string
): string | undefined => {
  const path = url.replace(/[#?].*$/, '');
  return catalog
    .toSorted(longestRouteFirst)
    .find(({ route }) => path === route || path.startsWith(`${route}/`))?.icon;
};
