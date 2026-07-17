import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  IBaseItem,
  ICategoriesState,
  IItemDialogState,
  TAllItemTypes,
} from '../../types';
import { matchesSearchString } from '../../util/app.utils';

// Domain-blind edit-dialog kernel: this shared slice exposes only the generic
// edit state + item. Each consuming context (groceries, tasks) casts these to
// its own item type in its OWN data module (e.g. groceries/data/
// item-dialogs.selector) — the kernel never references a domain item type.
export const selectEditState =
  createFeatureSelector<IItemDialogState<TAllItemTypes>>('itemDialogs');

export const selectEditItem = createSelector(
  selectEditState,
  (state): IBaseItem | undefined => state.item
);
export const selectCategoriesState = createSelector(
  selectEditState,
  (state): ICategoriesState => state.category
);

export const selectAllCategories = createSelector(
  selectEditState,
  (state) => state.category.categories
);
export const selectSelectedCategories = createSelector(
  selectEditState,
  (state) => state.category.selection
);
export const selectCategories = createSelector(
  selectEditState,
  selectAllCategories,
  (state, allCategories) => {
    return !state.category.searchQuery || !state.category.searchQuery.length
      ? allCategories
      : allCategories.filter((cat) =>
          matchesSearchString(cat, state.category.searchQuery)
        );
  }
);
export const selectContainsSearchResult = createSelector(
  selectEditState,
  selectCategories,
  (state, current) =>
    state.category.searchQuery &&
    state.category.searchQuery.length &&
    current.includes(state.category.searchQuery)
);
