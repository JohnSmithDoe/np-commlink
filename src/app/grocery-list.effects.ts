import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs';
import { IAppState, TItemListId } from './@shared/types';
import {
  createProduct,
  createProductFrom,
  createShoppingItem,
  createShoppingItemFromGlobal,
  createShoppingItemFromStorage,
  createStorageItem,
  createStorageItemFromGlobal,
  createStorageItemFromShopping,
  createTaskItem,
} from './@shared/util/item.factory';
import { matchesItemExactly } from './@shared/util/app.utils';
import { ProductsActions } from './groceries/data/products.actions';
import { ShoppingActions } from './groceries/data/shopping.actions';
import { StorageActions } from './groceries/data/storage.actions';
import { TasksActions } from './tasks/data/tasks.actions';
import { GroceryListActions } from './groceries/data/grocery-list/grocery-list.actions';
import { QuickAddActions } from './@shared/data/quick-add/quick-add.actions';
import {
  listIdByPrefix,
  searchQueryByListId,
  stateByListId,
  updatedSearchQuery,
  updateQuickAddState,
} from './groceries/data/grocery-list/grocery-list.utils';

export const actionsByListId = (listId: TItemListId) => {
  //prettier-ignore
  switch (listId) {
    case '_storage':
      return StorageActions;
    case '_products':
      return ProductsActions;
    case '_shopping':
      return ShoppingActions;
    case '_tasks':
      return TasksActions;
  }
};

@Injectable({ providedIn: 'root' })
export class GroceryListEffects {
  #store = inject(Store<IAppState>);
  #actions$ = inject(Actions);
  // 'Add Item From Search': (listId:TItemListId) => ({ listId }),
  addItemFromSearch = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addItemFromSearch),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        const isCategoryMode =
          stateByListId(state, action.listId).mode === 'categories';
        return isCategoryMode
          ? GroceryListActions.addCategoryFromSearch(action.listId)
          : actionsByListId(action.listId).addItemFromSearch();
      })
    );
  });
  // 'Add Category From Search': (listId:TItemListId) => ({ listId }),
  addCategoryFromSearch = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addCategoryFromSearch),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        const category = stateByListId(state, action.listId).searchQuery ?? '';
        return actionsByListId(action.listId).addCategory(category);
      })
    );
  });

  //  'Add Category': (listId:TItemListId, category: TItemListCategory) => ({ listId, category }),
  addCategory = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addCategory),
      map(({ listId, category }) =>
        actionsByListId(listId).addCategory(category)
      )
    );
  });

  //  'Remove Category': (listId:TItemListId, category: TItemListCategory) => ({ listId, category }),
  removeCategory = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.removeCategory),
      map(({ listId, category }) =>
        actionsByListId(listId).removeCategory(category)
      )
    );
  });

  // 'Update Filter': (listId:TItemListId, filterBy?: string) => ({ filterBy, listId }),
  updateFilter = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.updateFilter),
      map(({ listId, filterBy }) =>
        actionsByListId(listId).updateFilter(filterBy)
      )
    );
  });
  // 'Update Mode': (listId:TItemListId, mode?: TItemListMode) => ({ mode, listId }),
  updateMode = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.updateMode),
      map(({ listId, mode }) => actionsByListId(listId).updateMode(mode))
    );
  });
  // 'Update Sort': (listId:TItemListId, sortBy?:
  updateSort = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.updateSort),
      map(({ listId, sortBy, sortDir }) =>
        actionsByListId(listId).updateSort(sortBy, sortDir)
      )
    );
  });
  // 'Update Search': (listId:TItemListId, searchQuery?: string) => ({ searchQuery, listId }),
  updateSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.updateSearch),
      map(({ searchQuery, listId }) =>
        actionsByListId(listId).updateSearch(searchQuery)
      )
    );
  });
  // 'Add Product': (listId:TItemListId, item: IProduct) => ({ item, listId }),
  addProduct$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addProduct),
      map(({ item, listId }) => {
        switch (listId) {
          case '_storage':
            return StorageActions.addProduct(item);
          case '_shopping':
            return ShoppingActions.addProduct(item);
          case '_products':
          case '_tasks':
          default:
            return GroceryListActions.configurationError();
        }
      })
    );
  });
  // 'Add Storage Item': (listId:TItemListId, item: IStorageItem) => ({ item, listId }),
  addStorageItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addStorageItem),
      map(({ item, listId }) => {
        switch (listId) {
          case '_products':
            return ProductsActions.addStorageItem(item);
          case '_shopping':
            return ShoppingActions.addStorageItem(item);
          case '_storage':
          case '_tasks':
          default:
            return GroceryListActions.configurationError();
        }
      })
    );
  });
  // 'Add Shopping Item': (listId:TItemListId, item: IShoppingItem) => ({ item, listId }),
  addShoppingItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addShoppingItem),
      map(({ item, listId }) => {
        switch (listId) {
          case '_storage':
            return StorageActions.addShoppingItem(item);
          case '_products':
            return ProductsActions.addShoppingItem(item);
          case '_shopping':
          case '_tasks':
          default:
            return GroceryListActions.configurationError();
        }
      })
    );
  });

  // --- item-manipulation orchestration (folded from kitchen-bot's
  // ApplicationEffects; each list dispatches its own [X] action and these
  // generic effects create/route the item using the list-id prefix). ---

  // Turn a "[X] Add Item From Search" into a concrete addItem for that list,
  // building the item from the list's current search query + filter.
  addItemFromSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        StorageActions.addItemFromSearch,
        ShoppingActions.addItemFromSearch,
        ProductsActions.addItemFromSearch,
        TasksActions.addItemFromSearch
      ),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        switch (action.type) {
          case '[Storage] Add Item From Search':
            return addStorageItemFromSearch(state);
          case '[Shopping] Add Item From Search':
            return addShoppingItemFromSearch(state);
          case '[Products] Add Item From Search':
            return addProductFromSearch(state);
          default:
            return addTaskItemFromSearch(state);
        }
      })
    );
  });

  // Resolve a "[X] Add Or Update Item" (from the edit dialogs and the copy
  // effects below) into addItem / updateItem depending on whether it exists.
  addOrUpdateItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        StorageActions.addOrUpdateItem,
        ShoppingActions.addOrUpdateItem,
        ProductsActions.addOrUpdateItem,
        TasksActions.addOrUpdateItem
      ),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        const listId = listIdByPrefix(action.type);
        const localState = stateByListId(state, listId);
        const actions = actionsByListId(listId);
        return matchesItemExactly(action.item, localState.items)
          ? actions.updateItem(action.item)
          : actions.addItem(<never>action.item);
      })
    );
  });

  // Cross-list copy: a global item added to storage/shopping is converted to
  // the target list's item shape.
  addItemFromGlobal$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(StorageActions.addProduct, ShoppingActions.addProduct),
      map(({ item, type }) => {
        switch (type) {
          case '[Storage] Add Product':
            return StorageActions.addOrUpdateItem(
              createStorageItemFromGlobal(item)
            );
          default:
            return ShoppingActions.addOrUpdateItem(
              createShoppingItemFromGlobal(item)
            );
        }
      })
    );
  });

  addItemFromShopping$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(StorageActions.addShoppingItem, ProductsActions.addShoppingItem),
      map(({ item, type }) => {
        switch (type) {
          case '[Storage] Add Shopping Item':
            return StorageActions.addOrUpdateItem(
              createStorageItemFromShopping(item)
            );
          default:
            return ProductsActions.addOrUpdateItem(createProductFrom(item));
        }
      })
    );
  });

  addItemFromStorage$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ShoppingActions.addStorageItem, ProductsActions.addStorageItem),
      map(({ item, type }) => {
        switch (type) {
          case '[Shopping] Add Storage Item':
            return ShoppingActions.addOrUpdateItem(
              createShoppingItemFromStorage(item)
            );
          default:
            return ProductsActions.addOrUpdateItem(createProductFrom(item));
        }
      })
    );
  });

  // Leaving categories mode clears any active category filter.
  clearFilter$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        StorageActions.updateMode,
        ProductsActions.updateMode,
        ShoppingActions.updateMode,
        TasksActions.updateMode
      ),
      filter(({ mode }) => mode !== 'categories'),
      map(({ type }) => actionsByListId(listIdByPrefix(type)).updateFilter())
    );
  });

  // After a list-mutating action, reset that list's search query.
  clearSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        StorageActions.addItem,
        StorageActions.updateFilter,
        StorageActions.updateMode,
        StorageActions.addCategory,
        StorageActions.removeCategory,
        ProductsActions.addItem,
        ProductsActions.updateFilter,
        ProductsActions.updateMode,
        ProductsActions.addCategory,
        ProductsActions.removeCategory,
        ShoppingActions.addItem,
        ShoppingActions.updateFilter,
        ShoppingActions.updateMode,
        ShoppingActions.addCategory,
        ShoppingActions.removeCategory,
        TasksActions.addItem,
        TasksActions.updateFilter,
        TasksActions.updateMode,
        TasksActions.addCategory,
        TasksActions.removeCategory
      ),
      map(({ type }) => actionsByListId(listIdByPrefix(type)).updateSearch(''))
    );
  });

  // Keep the search query in sync when an item is renamed.
  updateSearchOnItemChange$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        StorageActions.updateItem,
        ShoppingActions.updateItem,
        ProductsActions.updateItem,
        TasksActions.updateItem
      ),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        const listId = listIdByPrefix(action.type);
        const searchQuery = searchQueryByListId(state, listId);
        return actionsByListId(listId).updateSearch(
          updatedSearchQuery(action.item, searchQuery)
        );
      })
    );
  });

  // Recompute the quick-add button state whenever a list's search/mode changes.
  updateQuickAdd$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        ShoppingActions.updateSearch,
        ShoppingActions.enterPage,
        ShoppingActions.updateMode,
        StorageActions.updateSearch,
        StorageActions.updateMode,
        StorageActions.enterPage,
        ProductsActions.updateSearch,
        ProductsActions.updateMode,
        ProductsActions.enterPage,
        TasksActions.updateSearch,
        TasksActions.updateMode,
        TasksActions.enterPage
      ),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) =>
        QuickAddActions.updateState(
          updateQuickAddState(state, listIdByPrefix(action.type))
        )
      )
    );
  });
}

export const addStorageItemFromSearch = (state: IAppState) => {
  const storageItem = createStorageItem(
    state.storage.searchQuery ?? '',
    state.storage.filterBy
  );
  const foundStorageItem = matchesItemExactly(storageItem, state.storage.items);
  return foundStorageItem
    ? StorageActions.addItemFailure(foundStorageItem)
    : StorageActions.addItem(storageItem);
};
export const addShoppingItemFromSearch = (state: IAppState) => {
  const shoppingItem = createShoppingItem(
    state.shopping.searchQuery ?? '',
    state.shopping.filterBy
  );
  const foundShoppingItem = matchesItemExactly(
    shoppingItem,
    state.shopping.items
  );
  return foundShoppingItem
    ? ShoppingActions.addItemFailure(foundShoppingItem)
    : ShoppingActions.addItem(shoppingItem);
};
export const addProductFromSearch = (state: IAppState) => {
  const item = createProduct(
    state.products.searchQuery ?? '',
    state.products.filterBy
  );
  const found = matchesItemExactly(item, state.products.items);
  return found
    ? ProductsActions.addItemFailure(found)
    : ProductsActions.addItem(item);
};
export const addTaskItemFromSearch = (state: IAppState) => {
  const item = createTaskItem(
    state.tasks.searchQuery ?? '',
    state.tasks.filterBy
  );
  const found = matchesItemExactly(item, state.tasks.items);
  return found
    ? TasksActions.addItemFailure(found)
    : TasksActions.addItem(item);
};
