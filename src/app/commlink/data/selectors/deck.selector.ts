import { createFeatureSelector } from '@ngrx/store';
import { IDeckState } from '../../model/deck.types';

// The slice holds three id lists and nothing derived — resolving them against
// the catalog needs the active theme, which is a signal rather than store
// state, so the projections live in `DeckFacade` over `commlink/util`.
export const selectDeckState = createFeatureSelector<IDeckState>('deck');
