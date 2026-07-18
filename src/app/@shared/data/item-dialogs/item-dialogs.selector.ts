import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IBaseItem, ICategoriesState, IItemDialogState } from '../../types';

// Domain-blind edit-dialog kernel. Exposes the generic OPEN-command state +
// item (each context casts to its own item type in its OWN data module) and the
// category-RENAME state. The category-selection selectors are gone — that flow
// is local to the pure-ui categories-dialog now (dialog refactor).
export const selectEditState =
  createFeatureSelector<IItemDialogState<IBaseItem>>('itemDialogs');

export const selectEditItem = createSelector(
  selectEditState,
  (state): IBaseItem | undefined => state.item
);

export const selectCategoriesState = createSelector(
  selectEditState,
  (state): ICategoriesState => state.category
);
