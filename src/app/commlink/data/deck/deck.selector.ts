import { createFeatureSelector } from '@ngrx/store';
import { DeckState } from '../../model/deck.types';

export const DECK_STATE_KEY = 'deck';

export const selectDeckState = createFeatureSelector<DeckState>(DECK_STATE_KEY);
