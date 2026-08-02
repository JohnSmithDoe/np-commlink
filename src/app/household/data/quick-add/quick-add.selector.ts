import { createSelector } from '@ngrx/store';
import { QuickAddState } from '../../model/list-settings.types';
import { deriveQuickAddState } from '../../util/household-list.utils';
import { selectHouseholdState } from '../household.selector';
import { selectActiveHouseholdListId } from '../list/household-list.selector';
import { selectListSettingsState } from '../list-settings/list-settings.selector';

export const selectQuickAddState = createSelector(
  selectHouseholdState,
  selectActiveHouseholdListId,
  (state, listId): QuickAddState => deriveQuickAddState(state, listId)
);

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
