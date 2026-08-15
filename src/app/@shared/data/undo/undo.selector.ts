import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UndoEntry, UndoState } from '../../model/undo.types';

export const UNDO_STATE_KEY = 'undo';

const selectUndoState = createFeatureSelector<UndoState>(UNDO_STATE_KEY);

export const selectUndoTop = createSelector(
  selectUndoState,
  (state): UndoEntry | undefined => state.entries.at(-1)
);
