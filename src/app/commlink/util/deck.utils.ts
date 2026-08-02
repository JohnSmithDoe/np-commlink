import { Theme } from '../../@shared/model/app.types';
import {
  DeckEntry,
  DeckProgram,
  DeckState,
  DeckEntryId,
} from '../model/deck.types';

export function orderEntries(
  catalog: readonly DeckEntry[],
  order: readonly DeckEntryId[]
): DeckEntry[] {
  const byId = new Map(catalog.map((entry) => [entry.id, entry]));
  const configured = order
    .map((id) => byId.get(id))
    .filter((entry): entry is DeckEntry => entry !== undefined);

  const configuredIds = new Set(order);
  const added = catalog.filter((entry) => !configuredIds.has(entry.id));

  return [...configured, ...added];
}

export const isEntryVisible = (state: DeckState, entry: DeckEntry): boolean =>
  !state.hiddenModules.includes(entry.module) &&
  !state.hiddenEntries.includes(entry.id);

export const visibleEntries = (
  catalog: readonly DeckEntry[],
  state: DeckState
): DeckEntry[] =>
  orderEntries(catalog, state.order).filter((entry) =>
    isEntryVisible(state, entry)
  );

export const resolveLabels =
  (theme: Theme) =>
  (entry: DeckEntry): DeckProgram => ({ ...entry, ...entry.labels[theme] });

export const toggleIn = <T>(list: readonly T[], value: T): T[] =>
  list.includes(value)
    ? list.filter((entry) => entry !== value)
    : [...list, value];
