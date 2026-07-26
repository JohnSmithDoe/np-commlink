import { TTheme } from '../../@shared/model/app.types';
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
 * Boomer), so the theme is an axis of the key rather than a second label field
 * on the catalog — a third theme is then a JSON block, not a code change.
 */
export const resolveLabels =
  (theme: TTheme) =>
  (entry: IDeckEntry): IDeckProgram => ({
    ...entry,
    nameKey: `deck.${theme}.${entry.id}.name`,
    descKey: `deck.${theme}.${entry.id}.desc`,
  });

export const toggleIn = <T>(list: readonly T[], value: T): T[] =>
  list.includes(value)
    ? list.filter((entry) => entry !== value)
    : [...list, value];

export function moveEntry(
  order: readonly TDeckEntryId[],
  from: number,
  to: number
): TDeckEntryId[] {
  const next = [...order];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}
