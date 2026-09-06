/* ─── why ─────────────────────────────────────────────────────────
 * Longest route wins. `/household` is not a program but `/household/storage`
 * is, and three entries share that prefix — matching in catalog order would
 * hand the storage list whichever one happens to be declared first.
 *
 * Matching is per SEGMENT rather than per character, so `/cash` cannot claim
 * a later `/cashflow`. A wrong glyph is silent where a missing one is not,
 * which is the whole failure mode worth defending against here.
 *
 * The two readers want opposite answers on an EXACT match: a program wears
 * its own glyph, and a program has nowhere to return to. So the match is made
 * once and only the return reader asks whether it was exact.
 * ───────────────────────────────────────────────────────────────── */
import { ProgramReturn } from '../../@shared/util/program-return.token';
import { ProgramSibling } from '../../@shared/util/program-siblings.token';
import { DeckEntry } from '../model/deck.types';

const longestRouteFirst = (a: DeckEntry, b: DeckEntry): number =>
  b.route.length - a.route.length;

const pathOf = (url: string): string => url.replace(/[#?].*$/, '');

const entryFor = (
  catalog: readonly DeckEntry[],
  path: string
): DeckEntry | undefined =>
  catalog
    .toSorted(longestRouteFirst)
    .find(({ route }) => path === route || path.startsWith(`${route}/`));

const segmentBelow = (route: string, prefix: string): string | undefined => {
  if (!route.startsWith(`${prefix}/`)) return undefined;
  const segment = route.slice(prefix.length + 1);
  return segment.includes('/') ? undefined : segment;
};

export const programSiblingsFor = (
  catalog: readonly DeckEntry[],
  prefix: string
): ProgramSibling[] =>
  catalog.flatMap((entry) => {
    const segment = segmentBelow(entry.route, prefix);
    return segment
      ? [{ id: entry.id, segment, icon: entry.icon, titleKey: entry.titleKey }]
      : [];
  });

export const programIconFor = (
  catalog: readonly DeckEntry[],
  url: string
): string | undefined => entryFor(catalog, pathOf(url))?.icon;

export const programReturnFor = (
  catalog: readonly DeckEntry[],
  url: string
): ProgramReturn => {
  const path = pathOf(url);
  const entry = entryFor(catalog, path);
  if (!entry) return { isProgram: false };
  if (entry.route === path) return { isProgram: true };
  return {
    isProgram: false,
    parent: { route: entry.route, titleKey: entry.titleKey },
  };
};
