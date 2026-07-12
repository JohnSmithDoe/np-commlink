import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  IBaseItem,
  ICategoriesState,
  IEditGlobalItemState,
  IItemDialogState,
  IEditShoppingItemState,
  IEditStorageItemState,
  IEditTaskItemState,
  IGlobalItem,
  IShoppingItem,
  IStorageItem,
  ITaskItem,
  TAllItemTypes,
} from '../../types';
import { matchesSearchString } from '../../util/app.utils';

export const selectEditState =
  createFeatureSelector<IItemDialogState<TAllItemTypes>>('itemDialogs');

export const selectEditGlobalState =
  createFeatureSelector<IEditGlobalItemState>('itemDialogs');

export const selectEditShoppingState =
  createFeatureSelector<IEditShoppingItemState>('itemDialogs');

export const selectEditStorageState =
  createFeatureSelector<IEditStorageItemState>('itemDialogs');

export const selectEditTaskState =
  createFeatureSelector<IEditTaskItemState>('itemDialogs');

export const selectEditStorageItem = createSelector(
  selectEditStorageState,
  (state): IStorageItem | undefined => state.item
);

export const selectEditTaskItem = createSelector(
  selectEditTaskState,
  (state): ITaskItem | undefined => state.item
);
export const selectEditGlobalItem = createSelector(
  selectEditGlobalState,
  (state): IGlobalItem | undefined => state.item
);

export const selectEditShoppingItem = createSelector(
  selectEditShoppingState,
  (state): IShoppingItem | undefined => state.item
);

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
