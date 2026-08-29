import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UndoEntry, UndoState } from '../../model/undo.types';

export const UNDO_STATE_KEY = 'undo';

const selectUndoState = createFeatureSelector<UndoState>(UNDO_STATE_KEY);

export const selectUndoEntries = createSelector(
  selectUndoState,
  (state): readonly UndoEntry[] => state.entries
);
