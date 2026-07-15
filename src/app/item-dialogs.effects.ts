import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs';
import { IAppState, IBaseItem, TItemListId } from './@shared/types';
import {
  createProduct,
  createShoppingItem,
  createStorageItem,
  createTaskItem,
} from './@shared/util/item.factory';
import { actionsByListId } from './grocery-list.effects';

import {
  filterByByListId,
  searchQueryByListId,
  stateByListId,
} from './groceries/data/grocery-list/grocery-list.utils';
import { ProductsActions } from './groceries/data/products.actions';
import { ShoppingActions } from './groceries/data/shopping.actions';
import { StorageActions } from './groceries/data/storage.actions';
import {
  CategoriesActions,
  ItemDialogsActions,
} from './@shared/data/item-dialogs/item-dialogs.actions';
import {
  selectEditProductState,
  selectEditState,
} from './@shared/data/item-dialogs/item-dialogs.selector';

function createItemByListId(
  listId: TItemListId,
  name: string,
  category: string | undefined
) {
  let item: IBaseItem;
  switch (listId) {
    case '_storage':
      item = createStorageItem(name, category);
      break;
    case '_products':
      item = createProduct(name, category);
      break;
    case '_shopping':
      item = createShoppingItem(name, category);
      break;
    case '_tasks':
      item = createTaskItem(name, category);
      break;
  }
  return item;
}

@Injectable({ providedIn: 'root' })
export class ItemDialogsEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);

  showCategories$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.showDialog),
      withLatestFrom(this.#store, (action, state) => ({ action, state })),
      map(({ state }: { state: IAppState }) => {
        const categories = stateByListId(
          state,
          state.itemDialogs.listId
        ).categories;
        return CategoriesActions.updateSelection(
          state.itemDialogs.item,
          categories
        );
      })
    );
  });

  confirmCategories$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.confirmChanges),
      withLatestFrom(this.#store, (action, state) => ({ action, state })),
      map(({ state }: { state: IAppState }) => {
        const updateData: Partial<IBaseItem> = {
          category: state.itemDialogs.category.selection,
        };
        return ItemDialogsActions.updateItem(updateData);
      })
    );
  });
  addCategoryFromDialogSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.addCategoryFromDialogSearch),
      withLatestFrom(this.#store, (action, state) => ({ action, state })),
      map(({ state }: { state: IAppState }) => {
        const category = state.itemDialogs.category.searchQuery?.trim();
        return CategoriesActions.addCategory(category ?? '');
      })
    );
  });

  addCategoryToLlist$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.addCategory),
      withLatestFrom(this.#store, (action, state) => ({ action, state })),
      map(({ state, action }) => {
        return actionsByListId(state.itemDialogs.listId).addCategory(
          action.category
        );
      })
    );
  });

  showCreateProductDialogWithSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ItemDialogsActions.showCreateAndAddProductDialog),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        const searchQuery = searchQueryByListId(state, action.listId);
        const filterBy = filterByByListId(state, action.listId);
        return ItemDialogsActions.showEditDialog(
          createProduct(searchQuery ?? '', filterBy),
          '_products',
          action.listId
        );
      })
    );
  });

  confirmItemChanges$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ItemDialogsActions.confirmChanges),
      concatLatestFrom(() => this.#store.select(selectEditState)),
      map(([_, state]) => {
        const localActions = actionsByListId(state.listId);
        return localActions.addOrUpdateItem(<any>state.item);
      })
    );
  });

  confirmEditCategoryChanges$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.confirmEditChanges),
      concatLatestFrom(() => this.#store.select(selectEditState)),
      map(([_, state]) => {
        const localActions = actionsByListId(state.listId);
        return localActions.updateCategory(
          state.category.original ?? '',
          state.category.editItem ?? ''
        );
      })
    );
  });

  confirmProductItemChangesAndAddToList$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ItemDialogsActions.confirmChanges),
      concatLatestFrom(() => this.#store.select(selectEditProductState)),
      filter(
        ([_, state]) =>
          state.listId === '_products' && !!state.addToAdditionalList
      ),
      map(([_, state]) => {
        switch (state.addToAdditionalList!) {
          case '_storage':
            return StorageActions.addProduct(state.item);
          case '_products':
          case '_tasks':
            return ProductsActions.addItemFailure(state.item);
          case '_shopping':
            return ShoppingActions.addProduct(state.item);
        }
      })
    );
  });
  showCreateDialogWithSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ItemDialogsActions.showCreateDialogWithSearch),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        const localState = stateByListId(state, action.listId);
        const name = localState.searchQuery ?? '';
        if (localState.mode === 'categories') {
          return CategoriesActions.showEditDialog(name, action.listId);
        } else {
          const category = localState.filterBy;
          const item = createItemByListId(action.listId, name, category);
          return ItemDialogsActions.showEditDialog(item, action.listId);
        }
      })
    );
  });
}
