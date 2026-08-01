import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs';
import {
  createGroceryItem,
  createProductFrom,
  createShoppingItemFromProduct,
  createShoppingItemFromStorage,
  createStorageItemFromProduct,
  createStorageItemFromShopping,
} from '../util/grocery.factory';
import { matchesItemExactly } from '../../@shared/util/app.utils';
import { IGroceriesState } from '../model/groceries.types';
import { TGroceryListId } from '../model/grocery-list.types';
import { selectGroceriesState } from './groceries/groceries.selector';
import { ProductsActions } from './products/products.actions';
import { ShoppingActions } from './shopping/shopping.actions';
import { StorageActions } from './storage/storage.actions';
import { GroceryListActions } from './grocery-list.actions';
import { updatedSearchQuery } from '../../@shared/util/item-lists/list.utils';
import { toastAddItemFailure } from '../../@shared/data/item-lists/item-list.effects.factory';
import {
  listIdByPrefix,
  searchQueryByListId,
  stateByListId,
} from '../util/grocery-list.utils';

// `_tasks` is absent from TGroceryListId — tasks is a sealed sibling with its own
// orchestrator, so this engine knows only the three grocery lists.
export const actionsByListId = (listId: TGroceryListId) => {
  switch (listId) {
    case '_storage': {
      return StorageActions;
    }
    case '_products': {
      return ProductsActions;
    }
    case '_shopping': {
      return ShoppingActions;
    }
  }
};

/**
 * The grocery multi-list engine, folded into the `groceries` domain and
 * registered lazily via `groceriesProviders` (was an eager shell
 * orchestrator). It routes the generic `GroceryListActions` (dispatched by the
 * grocery `IListPageFacade`) to the concrete storage/products/shopping action
 * groups by `:listId`, and owns the cross-list copy rules. Scoped to the three
 * grocery lists only — tasks has its own switch-free orchestrator.
 */
@Injectable({ providedIn: 'root' })
export class GroceryListEffects {
  readonly #store = inject(Store);
  readonly #actions$ = inject(Actions);
  readonly #lists$ = this.#store.select(selectGroceriesState);

  // The generic list-page action, routed to the concrete list's own from-search
  // action. Whether the affordance means "item" or "category" is the list page's
  // decision, made once in `ListPageComponent`.
  routeAddItemFromSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addItemFromSearch),
      map(({ listId }) => actionsByListId(listId).addItemFromSearch())
    );
  });

  updateFilter$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.updateFilter),
      map(({ listId, filterBy }) =>
        actionsByListId(listId).updateFilter(filterBy)
      )
    );
  });

  updateSort$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.updateSort),
      map(({ listId, sortBy, sortDirection }) =>
        actionsByListId(listId).updateSort(sortBy, sortDirection)
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

  // Turn a "[X] Add Item From Search" into a concrete addItem for that list,
  // building the item from the list's current search query + filter.
  buildItemFromSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        StorageActions.addItemFromSearch,
        ShoppingActions.addItemFromSearch,
        ProductsActions.addItemFromSearch
      ),
      withLatestFrom(this.#lists$),
      map(([action, state]) =>
        addItemFromSearch(state, listIdByPrefix(action.type))
      )
    );
  });

  // Resolve a "[X] addOrUpdateItem" into addItem / updateItem depending on
  // whether it already exists.
  addOrUpdateItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        StorageActions.addOrUpdateItem,
        ShoppingActions.addOrUpdateItem,
        ProductsActions.addOrUpdateItem
      ),
      withLatestFrom(this.#lists$),
      map(([action, state]) => {
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
          case StorageActions.addProduct.type: {
            return StorageActions.addOrUpdateItem(
              createStorageItemFromProduct(item)
            );
          }
          default: {
            return ShoppingActions.addOrUpdateItem(
              createShoppingItemFromProduct(item)
            );
          }
        }
      })
    );
  });

  addItemFromShopping$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(StorageActions.addShoppingItem, ProductsActions.addShoppingItem),
      map(({ item, type }) => {
        switch (type) {
          case StorageActions.addShoppingItem.type: {
            return StorageActions.addOrUpdateItem(
              createStorageItemFromShopping(item)
            );
          }
          default: {
            return ProductsActions.addOrUpdateItem(createProductFrom(item));
          }
        }
      })
    );
  });

  addItemFromStorage$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ShoppingActions.addStorageItem, ProductsActions.addStorageItem),
      map(({ item, type }) => {
        switch (type) {
          case ShoppingActions.addStorageItem.type: {
            return ShoppingActions.addOrUpdateItem(
              createShoppingItemFromStorage(item)
            );
          }
          default: {
            return ProductsActions.addOrUpdateItem(createProductFrom(item));
          }
        }
      })
    );
  });

  // After a list-mutating action, reset that list's search query. (Category
  // create-from-search clears via clearSearchAfterAddCategory$; the shared
  // category ops carry no listId so they can't route here.)
  clearSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        StorageActions.addItem,
        StorageActions.updateFilter,
        ProductsActions.addItem,
        ProductsActions.updateFilter,
        ShoppingActions.addItem,
        ShoppingActions.updateFilter
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
      withLatestFrom(this.#lists$),
      map(([action, state]) => {
        const listId = listIdByPrefix(action.type);
        const searchQuery = searchQueryByListId(state, listId);
        return actionsByListId(listId).updateSearch(
          updatedSearchQuery(action.item, searchQuery)
        );
      })
    );
  });
}

const addItemFromSearch = (state: IGroceriesState, listId: TGroceryListId) => {
  const list = stateByListId(state, listId);
  const item = createGroceryItem(listId, list.searchQuery ?? '', list.filterBy);
  const duplicate = matchesItemExactly(item, list.items);
  const actions = actionsByListId(listId);
  return duplicate
    ? actions.addItemFailure(<never>duplicate)
    : actions.addItem(<never>item);
};

/**
 * The message the three lists were missing. `addItemFromSearch` dispatches
 * `addItemFailure` per list (below), but nothing reacted to it here — so telling
 * the shopper "that name is already on the list" worked on tracking and tasks and
 * silently did nothing on all three grocery lists. One per list, because each
 * list's item type is its own.
 */
export const groceryListMessageEffects = {
  storageAddItemFailure$: toastAddItemFailure(StorageActions.addItemFailure),
  shoppingAddItemFailure$: toastAddItemFailure(ShoppingActions.addItemFailure),
  productsAddItemFailure$: toastAddItemFailure(ProductsActions.addItemFailure),
};
