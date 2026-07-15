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
export const selectQuickAddCanAddProduct = createSelector(
  selectQuickAddState,
  selectListSettingsState,
  (state, settings): boolean =>
    !!state.canAddProduct && settings.showQuickAddProduct
);
export const selectQuickAddCanAddCategory = createSelector(
  selectQuickAddState,
  selectListSettingsState,
  (state, settings): boolean =>
    state.canAddCategory && settings.showQuickAddCategory
);
