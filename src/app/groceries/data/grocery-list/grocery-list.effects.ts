import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs';
import { IAppState, TItemListId } from '../../../@shared/types';
import {
  createProduct,
  createProductFrom,
  createShoppingItem,
  createShoppingItemFromProduct,
  createShoppingItemFromStorage,
  createStorageItem,
  createStorageItemFromProduct,
  createStorageItemFromShopping,
} from '../../../@shared/util/item.factory';
import { matchesItemExactly } from '../../../@shared/util/app.utils';
import { ProductsActions } from '../products.actions';
import { ShoppingActions } from '../shopping.actions';
import { StorageActions } from '../storage.actions';
import { GroceryListActions } from './grocery-list.actions';
import { QuickAddActions } from '../../../@shared/data/quick-add/quick-add.actions';
import {
  listIdByPrefix,
  searchQueryByListId,
  stateByListId,
  updatedSearchQuery,
  updateQuickAddState,
} from './grocery-list.utils';

// Grocery-only action groups. `_tasks` is deliberately NOT here — tasks is a
// sealed sibling domain with its own orchestrator (tasks/data/tasks-list.effects),
// so this multi-list engine now knows only the three grocery lists. A non-
// grocery listId is a programming error (the grocery facade only ever passes
// grocery ids), hence the throw.
export const actionsByListId = (listId: TItemListId) => {
  switch (listId) {
    case '_storage':
      return StorageActions;
    case '_products':
      return ProductsActions;
    case '_shopping':
      return ShoppingActions;
    default:
      throw new Error(`grocery engine: unexpected listId ${listId}`);
  }
};

/**
 * The grocery multi-list engine, folded into the `groceries` domain and
 * registered lazily via `groceriesLazyProviders` (was an eager shell
 * orchestrator). It routes the generic `GroceryListActions` (dispatched by the
 * grocery `IListPageFacade`) to the concrete storage/products/shopping action
 * groups by `:listId`, and owns the cross-list copy rules. Scoped to the three
 * grocery lists only — tasks has its own switch-free orchestrator.
 */
@Injectable({ providedIn: 'root' })
export class GroceryListEffects {
  #store = inject(Store<IAppState>);
  #actions$ = inject(Actions);

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

  addCategory = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addCategory),
      map(({ listId, category }) =>
        actionsByListId(listId).addCategory(category)
      )
    );
  });

  removeCategory = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.removeCategory),
      map(({ listId, category }) =>
        actionsByListId(listId).removeCategory(category)
      )
    );
  });

  updateFilter = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.updateFilter),
      map(({ listId, filterBy }) =>
        actionsByListId(listId).updateFilter(filterBy)
      )
    );
  });

  updateMode = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.updateMode),
      map(({ listId, mode }) => actionsByListId(listId).updateMode(mode))
    );
  });

  updateSort = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.updateSort),
      map(({ listId, sortBy, sortDir }) =>
        actionsByListId(listId).updateSort(sortBy, sortDir)
      )
    );
  });

  updateSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.updateSearch),
      map(({ searchQuery, listId }) =>
        actionsByListId(listId).updateSearch(searchQuery)
      )
    );
  });

  addProduct$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addProduct),
      map(({ item, listId }) => {
        switch (listId) {
          case '_storage':
            return StorageActions.addProduct(item);
          case '_shopping':
            return ShoppingActions.addProduct(item);
          default:
            return GroceryListActions.configurationError();
        }
      })
    );
  });

  addStorageItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addStorageItem),
      map(({ item, listId }) => {
        switch (listId) {
          case '_products':
            return ProductsActions.addStorageItem(item);
          case '_shopping':
            return ShoppingActions.addStorageItem(item);
          default:
            return GroceryListActions.configurationError();
        }
      })
    );
  });

  addShoppingItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addShoppingItem),
      map(({ item, listId }) => {
        switch (listId) {
          case '_storage':
            return StorageActions.addShoppingItem(item);
          case '_products':
            return ProductsActions.addShoppingItem(item);
          default:
            return GroceryListActions.configurationError();
        }
      })
    );
  });

  // Turn a "[X] Add Item From Search" into a concrete addItem for that list,
  // building the item from the list's current search query + filter.
  addItemFromSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        StorageActions.addItemFromSearch,
        ShoppingActions.addItemFromSearch,
        ProductsActions.addItemFromSearch
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
          default:
            return addProductFromSearch(state);
        }
      })
    );
  });

  // Resolve a "[X] Add Or Update Item" into addItem / updateItem depending on
  // whether it already exists.
  addOrUpdateItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        StorageActions.addOrUpdateItem,
        ShoppingActions.addOrUpdateItem,
        ProductsActions.addOrUpdateItem
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

  // Cross-list copy: a product added to storage/shopping is converted to the
  // target list's item shape.
  addItemFromProduct$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(StorageActions.addProduct, ShoppingActions.addProduct),
      map(({ item, type }) => {
        switch (type) {
          case '[Storage] Add Product':
            return StorageActions.addOrUpdateItem(
              createStorageItemFromProduct(item)
            );
          default:
            return ShoppingActions.addOrUpdateItem(
              createShoppingItemFromProduct(item)
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
        ShoppingActions.updateMode
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
        ShoppingActions.removeCategory
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
        ProductsActions.updateItem
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
        ProductsActions.enterPage
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
