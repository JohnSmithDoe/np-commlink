import { createReducer, on } from '@ngrx/store';
import { IDeckState } from '../../model/deck.types';
import { toggleIn } from '../../util/deck.utils';
import { DeckActions } from '../actions/deck.actions';

/**
 * An unconfigured deck: catalog order, nothing hidden. Absence is the default
 * throughout, so "factory settings" is the empty config rather than a
 * materialized copy of the catalog — which is also what `reset` restores.
 */
export const initialDeck: IDeckState = {
  order: [],
  hiddenEntries: [],
  hiddenModules: [],
};

export const deckReducer = createReducer(
  initialDeck,
  on(DeckActions.loaded, (state, { deck }): IDeckState => deck ?? state),
  on(DeckActions.reorder, (state, { order }): IDeckState => ({
    ...state,
    order,
  })),
  on(DeckActions.toggleEntry, (state, { id }): IDeckState => ({
    ...state,
    hiddenEntries: toggleIn(state.hiddenEntries, id),
  })),
  on(DeckActions.toggleModule, (state, { module }): IDeckState => ({
    ...state,
    hiddenModules: toggleIn(state.hiddenModules, module),
  })),
  on(DeckActions.reset, (): IDeckState => initialDeck)
);
