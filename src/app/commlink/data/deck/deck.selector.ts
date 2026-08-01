import { createFeatureSelector } from '@ngrx/store';
import { IDeckState } from '../../model/deck.types';

// The slice holds three id lists and nothing derived — resolving them against
// the catalog needs the active theme, which is a signal rather than store
// state, so the projections live in `DeckFacade` over `commlink/util`.
export const DECK_STATE_KEY = 'deck';

export const selectDeckState =
  createFeatureSelector<IDeckState>(DECK_STATE_KEY);
