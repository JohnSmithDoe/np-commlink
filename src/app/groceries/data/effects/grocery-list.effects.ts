import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs';
import {
  createGroceryItem,
  createProductFrom,
  createShoppingItemFromProduct,
  createShoppingItemFromStorage,
  createStorageItemFromProduct,
  createStorageItemFromShopping,
} from '../../util/grocery.factory';
import { matchesItemExactly, uuidv4 } from '../../../@shared/util/app.utils';
import { IGroceriesState } from '../../model/groceries.types';
import { TGroceryListId } from '../../model/grocery-list.types';
import { selectGroceriesState } from '../selectors/groceries.selector';
import { ProductsActions } from '../actions/products.actions';
import { ShoppingActions } from '../actions/shopping.actions';
import { StorageActions } from '../actions/storage.actions';
import { GroceryListActions } from '../actions/grocery-list.actions';
import { GroceryCategoriesActions } from '../actions/grocery-categories.actions';
import { QuickAddActions } from '../actions/quick-add.actions';
import { updatedSearchQuery } from '../../../@shared/util/list/list.utils';
import {
  listIdByPrefix,
  searchQueryByListId,
  stateByListId,
  updateQuickAddState,
} from '../../util/grocery-list.utils';

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

  // The generic list-page action, routed to either "add a category" (categories
  // mode) or the concrete list's own from-search action.
  routeAddItemFromSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addItemFromSearch),
      withLatestFrom(this.#lists$),
      map(([action, state]) =>
        stateByListId(state, action.listId).mode === 'categories'
          ? GroceryListActions.addCategoryFromSearch(action.listId)
          : actionsByListId(action.listId).addItemFromSearch()
      )
    );
  });

  // Create a category from the active list's search box → mint one {id,name}
  // and add it to the shared catalog (all three grocery lists).
  addCategoryFromSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addCategoryFromSearch),
      withLatestFrom(this.#lists$),
      map(([action, state]) =>
        GroceryCategoriesActions.add({
          id: uuidv4(),
          name: stateByListId(state, action.listId).searchQuery ?? '',
        })
      )
    );
  });

  // Clear the originating list's search box after a create-from-search.
  clearSearchAfterAddCategory$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addCategoryFromSearch),
      map(({ listId }) => actionsByListId(listId).updateSearch(''))
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

  updateMode$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.updateMode),
      map(({ listId, mode }) => actionsByListId(listId).updateMode(mode))
    );
  });

  updateSort$ = createEffect(() => {
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
          case '_storage': {
            return StorageActions.addProduct(item);
          }
          case '_shopping': {
            return ShoppingActions.addProduct(item);
          }
          default: {
            return GroceryListActions.configurationError();
          }
        }
      })
    );
  });

  addStorageItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addStorageItem),
      map(({ item, listId }) => {
        switch (listId) {
          case '_products': {
            return ProductsActions.addStorageItem(item);
          }
          case '_shopping': {
            return ShoppingActions.addStorageItem(item);
          }
          default: {
            return GroceryListActions.configurationError();
          }
        }
      })
    );
  });

  addShoppingItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.addShoppingItem),
      map(({ item, listId }) => {
        switch (listId) {
          case '_storage': {
            return StorageActions.addShoppingItem(item);
          }
          case '_products': {
            return ProductsActions.addShoppingItem(item);
          }
          default: {
            return GroceryListActions.configurationError();
          }
        }
      })
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

  // After a list-mutating action, reset that list's search query. (Category
  // create-from-search clears via clearSearchAfterAddCategory$; the shared
  // category ops carry no listId so they can't route here.)
  clearSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        StorageActions.addItem,
        StorageActions.updateFilter,
        StorageActions.updateMode,
        ProductsActions.addItem,
        ProductsActions.updateFilter,
        ProductsActions.updateMode,
        ShoppingActions.addItem,
        ShoppingActions.updateFilter,
        ShoppingActions.updateMode
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
      withLatestFrom(this.#lists$),
      map(([action, state]) =>
        QuickAddActions.updateState(
          updateQuickAddState(state, listIdByPrefix(action.type))
        )
      )
    );
  });
}

export const addItemFromSearch = (
  state: IGroceriesState,
  listId: TGroceryListId
) => {
  const list = stateByListId(state, listId);
  const item = createGroceryItem(listId, list.searchQuery ?? '', list.filterBy);
  const duplicate = matchesItemExactly(item, list.items);
  const actions = actionsByListId(listId);
  return duplicate
    ? actions.addItemFailure(<never>duplicate)
    : actions.addItem(<never>item);
};
