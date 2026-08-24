/* ─── why ─────────────────────────────────────────────────────────
 * A cold install ships an EMPTY deck, so the user's first act is choosing
 * programs rather than deleting someone else's choice. A curated shortlist
 * loses to the question it re-opens on every feature that lands — "does
 * this one belong?" — argued per feature and never checkable. Empty is a
 * RULE, not a list: it cannot go stale or quietly widen with the catalog.
 *
 * The state stores what is VISIBLE, which is what makes that a rule and
 * not a promise. Held the other way round the empty deck was a LIST — the
 * whole catalog, restated — and absence therefore meant shown: a catalog
 * entry nobody had ever seen was on by default, and renaming an id
 * switched its program on for everyone. Now absence means hidden, and
 * both of those cost nothing.
 *
 * A document from before that flip is DISCARDED, not migrated: it names
 * the ids to hide, which under the new reading are the only ones that
 * would show. There is no rung — every holder lands on the cold-install
 * deck and picks again. The guard is what keeps that from being a crash,
 * since `loaded` is handed whatever was on disk under a `DeckState` cast.
 *
 * Nothing is stranded, which is what makes empty legal. Two entrances are
 * unconditional — the drawer's static `/settings` row and the grid's
 * `@empty` node — and everything else hangs off the config page, the
 * `onDeck: false` entries included, which a grid-shaped default could
 * never have offered anyway.
 * ───────────────────────────────────────────────────────────────── */

import { createReducer, on } from '@ngrx/store';
import { DeckState } from '../../model/deck.types';
import { setIn, toggleIn } from '../../util/deck.utils';
import { DeckActions } from './deck.actions';

export const initialDeck: DeckState = {
  order: [],
  visibleEntries: [],
};

const isCurrentShape = (deck: DeckState): boolean =>
  Array.isArray((deck as Partial<DeckState>).visibleEntries) &&
  Array.isArray((deck as Partial<DeckState>).order);

export const deckReducer = createReducer(
  initialDeck,
  on(DeckActions.loaded, (state, { deck }): DeckState => {
    if (!deck) return state;
    return isCurrentShape(deck) ? deck : initialDeck;
  }),
  on(DeckActions.reorder, (state, { order }): DeckState => ({
    ...state,
    order,
  })),
  on(DeckActions.toggleEntry, (state, { id }): DeckState => ({
    ...state,
    visibleEntries: toggleIn(state.visibleEntries, id),
  })),
  on(DeckActions.setEntries, (state, { ids, visible }): DeckState => ({
    ...state,
    visibleEntries: setIn(state.visibleEntries, ids, visible),
  })),
  on(DeckActions.reset, (): DeckState => initialDeck)
);
