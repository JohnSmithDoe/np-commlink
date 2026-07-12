import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IQuickAddState } from '../../types';
import { selectListSettingsState } from '../list-settings/list-settings.selector';

export const selectQuickAddState =
  createFeatureSelector<IQuickAddState>('quickadd');

export const selectQuickAddCanAddLocal = createSelector(
  selectQuickAddState,
  selectListSettingsState,
  (state, settings): boolean => !!state.canAddLocal && settings.showQuickAdd
);
export const selectQuickAddCanAddGlobal = createSelector(
  selectQuickAddState,
  selectListSettingsState,
  (state, settings): boolean =>
    !!state.canAddGlobal && settings.showQuickAddGlobal
);
export const selectQuickAddCanAddCategory = createSelector(
  selectQuickAddState,
  selectListSettingsState,
  (state, settings): boolean =>
    state.canAddCategory && settings.showQuickAddCategory
);
