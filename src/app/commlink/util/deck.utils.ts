import { TTheme } from '../../@shared/model/app.types';
import { TDeckChrome } from '../model/deck.catalog';
import { DECK_CHROME_LABELS } from '../model/deck.labels';
import {
  IDeckEntry,
  IDeckProgram,
  IDeckState,
  TDeckEntryId,
} from '../model/deck.types';

/**
 * The catalog in the user's order: configured entries first, in their saved
 * sequence, then anything the catalog has gained since. Ids the catalog no
 * longer carries drop out here — which is the whole reason a released entry can
 * be added or removed without a migration hop.
 */
export function orderEntries(
  catalog: readonly IDeckEntry[],
  order: readonly TDeckEntryId[]
): IDeckEntry[] {
  const byId = new Map(catalog.map((entry) => [entry.id, entry]));
  const configured = order
    .map((id) => byId.get(id))
    .filter((entry): entry is IDeckEntry => entry !== undefined);

  const configuredIds = new Set(order);
  const added = catalog.filter((entry) => !configuredIds.has(entry.id));

  return [...configured, ...added];
}

/**
 * A module's flag cascades at *read* time and is never written into its
 * entries — so disabling `groceries` and re-enabling it restores whatever the
 * user had configured underneath instead of flattening it.
 */
export const isEntryVisible = (state: IDeckState, entry: IDeckEntry): boolean =>
  !state.hiddenModules.includes(entry.module) &&
  !state.hiddenEntries.includes(entry.id);

export const visibleEntries = (
  catalog: readonly IDeckEntry[],
  state: IDeckState
): IDeckEntry[] =>
  orderEntries(catalog, state.order).filter((entry) =>
    isEntryVisible(state, entry)
  );

/**
 * Codenames are theme-dependent (MARKET on the deck, plain wording under OK
 * Boomer), so the entry carries a label pair per theme and this picks one.
 */
export const resolveLabels =
  (theme: TTheme) =>
  (entry: IDeckEntry): IDeckProgram => ({ ...entry, ...entry.labels[theme] });

/**
 * The same bargain for the deck's own chrome: the HUD readouts, the kicker and
 * the tile status words are voiced too, so a theme fills the slots rather than
 * the template branching on which theme is active.
 */
export const resolveChrome = (theme: TTheme): TDeckChrome =>
  DECK_CHROME_LABELS[theme];

export const toggleIn = <T>(list: readonly T[], value: T): T[] =>
  list.includes(value)
    ? list.filter((entry) => entry !== value)
    : [...list, value];
