import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  RitualCompletion,
  RitualPromptId,
  RitualReminder,
  RitualState,
} from '../model/ritual.types';

export const RITUAL_STATE_KEY = 'ritual';

export const selectRitualState =
  createFeatureSelector<RitualState>(RITUAL_STATE_KEY);

export const selectRitualCompletions = createSelector(
  selectRitualState,
  (state): RitualCompletion[] => state.completions
);

export const selectRitualCount = createSelector(
  selectRitualCompletions,
  (completions): number => completions.length
);

export const selectDismissedPrompts = createSelector(
  selectRitualState,
  (state): RitualPromptId[] => state.dismissed
);

export const selectRitualReminder = createSelector(
  selectRitualState,
  (state): RitualReminder => state.reminder
);
