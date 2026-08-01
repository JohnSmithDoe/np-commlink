import { createSelector } from '@ngrx/store';
import { IQuickAddState } from '../../model/list-settings.types';
import { updateQuickAddState } from '../../util/grocery-list.utils';
import { selectGroceriesState } from '../groceries/groceries.selector';
import { selectListIdParameter } from '../grocery-list.selector';
import { selectListSettingsState } from '../list-settings/list-settings.selector';

/**
 * The quick-add row's state, DERIVED rather than stored.
 *
 * `updateQuickAddState` is a pure function of the grocery slice and the active
 * list id, but its result used to live in a `quickAdd` slice of its own, written
 * by a `QuickAddActions.updateState` action and kept fresh by an effect that had
 * to enumerate every mutation able to change it. That list WAS the bug surface:
 * miss one and the row shows a stale suggestion with nothing to notice it, while
 * a selector cannot go stale by construction.
 *
 * The list id falls back to `_shopping` exactly as the facade's `#activeListId`
 * does — these are root singletons, read from whatever route is active.
 */
export const selectQuickAddState = createSelector(
  selectGroceriesState,
  selectListIdParameter,
  (state, listId): IQuickAddState =>
    updateQuickAddState(state, listId ?? '_shopping')
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
