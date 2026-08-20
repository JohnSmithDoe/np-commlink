/* ─── why ─────────────────────────────────────────────────────────
 * A cold install ships an EMPTY deck, so the user's first act is choosing
 * programs rather than deleting someone else's choice. A curated shortlist
 * loses to the question it re-opens on every feature that lands — "does
 * this one belong?" — argued per feature and never checkable. Empty is a
 * RULE, not a list: it cannot go stale or quietly widen with the catalog.
 *
 * Nothing is stranded, which is what makes it legal. Two entrances are
 * unconditional — the drawer's static `/settings` row and the grid's
 * `@empty` node — and everything else hangs off the config page, the
 * `onDeck: false` entries included, which a grid-shaped default could
 * never have offered anyway.
 * ───────────────────────────────────────────────────────────────── */

import { createReducer, on } from '@ngrx/store';
import { DECK_CATALOG } from '../../model/deck.catalog';
import { DeckState } from '../../model/deck.types';
import { toggleIn } from '../../util/deck.utils';
import { DeckActions } from './deck.actions';

export const initialDeck: DeckState = {
  order: [],
  hiddenEntries: DECK_CATALOG.map((entry) => entry.id),
};

export const deckReducer = createReducer(
  initialDeck,
  on(DeckActions.loaded, (state, { deck }): DeckState => deck ?? state),
  on(DeckActions.reorder, (state, { order }): DeckState => ({
    ...state,
    order,
  })),
  on(DeckActions.toggleEntry, (state, { id }): DeckState => ({
    ...state,
    hiddenEntries: toggleIn(state.hiddenEntries, id),
  })),
  on(DeckActions.reset, (): DeckState => initialDeck)
);
