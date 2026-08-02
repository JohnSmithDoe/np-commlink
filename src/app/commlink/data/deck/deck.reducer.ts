import { createReducer, on } from '@ngrx/store';
import { DeckState } from '../../model/deck.types';
import { toggleIn } from '../../util/deck.utils';
import { DeckActions } from './deck.actions';

export const initialDeck: DeckState = {
  order: [],
  hiddenEntries: [],
  hiddenModules: [],
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
  on(DeckActions.toggleModule, (state, { module }): DeckState => ({
    ...state,
    hiddenModules: toggleIn(state.hiddenModules, module),
  })),
  on(DeckActions.reset, (): DeckState => initialDeck)
);
