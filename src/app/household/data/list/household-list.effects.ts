/* ─── why ─────────────────────────────────────────────────────────
 * What is left is genuinely multi-list: a page addresses `:listId` and the
 * engine has to name the slice. The list FLOW is not multi-list at all,
 * and comes from `createItemListEffects` once per slice.
 *
 * That was the last reason the domain needed `<never>`: the hand-rolled
 * versions fanned out over a union of three action groups, so nothing
 * could type the item they carried. `createHouseholdItem` stays because
 * its one remaining caller is genuinely list-agnostic.
 * ───────────────────────────────────────────────────────────────── */

import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs';
import {
  clearSearchAfter,
  createItemListEffects,
} from '../../../@shared/data/item-lists/item-list.effects.factory';
import { categoryFilterFromRoute } from '../../../@shared/data/item-lists/category-filter.effects';
import { ItemListRouteActions } from '../../../@shared/data/actions/item-list-route.actions';
import {
  selectActiveHouseholdListId,
  selectDrilledCategory,
} from './household-list.selector';
import {
  createProduct,
  createProductFrom,
  createShoppingItem,
  createShoppingItemFromProduct,
  createShoppingItemFromStorage,
  createStorageItem,
  createStorageItemFromProduct,
  createStorageItemFromShopping,
} from '../../util/household.factory';
import { HouseholdListId } from '../../model/household-list.types';
import { ProductsActions } from '../products/products.actions';
import { selectProductsState } from '../products/products.selector';
import { ShoppingActions } from '../shopping/shopping.actions';
import { selectShoppingState } from '../shopping/shopping.selector';
import { StorageActions } from '../storage/storage.actions';
import { selectStorageState } from '../storage/storage.selector';
import { HouseholdListActions } from './household-list.actions';

export const actionsByListId = (listId: HouseholdListId) => {
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

@Injectable({ providedIn: 'root' })
export class HouseholdListEffects {
  readonly #actions$ = inject(Actions);

  routeAddItemFromSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(HouseholdListActions.addItemFromSearch),
      map(({ listId }) => actionsByListId(listId).addItemFromSearch())
    );
  });

  updateFilter$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(HouseholdListActions.updateFilter),
      map(({ listId, filterBy }) =>
        actionsByListId(listId).updateFilter(filterBy)
      )
    );
  });

  updateSort$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(HouseholdListActions.updateSort),
      map(({ listId, sortBy, sortDirection }) =>
        actionsByListId(listId).updateSort(sortBy, sortDirection)
      )
    );
  });

  updateSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(HouseholdListActions.updateSearch),
      map(({ searchQuery, listId }) =>
        actionsByListId(listId).updateSearch(searchQuery)
      )
    );
  });

  storageFromProduct$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(StorageActions.addProduct),
      map(({ item }) =>
        StorageActions.addOrUpdateItem(createStorageItemFromProduct(item))
      )
    );
  });

  shoppingFromProduct$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ShoppingActions.addProduct),
      map(({ item }) =>
        ShoppingActions.addOrUpdateItem(createShoppingItemFromProduct(item))
      )
    );
  });

  storageFromShopping$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(StorageActions.addShoppingItem),
      map(({ item }) =>
        StorageActions.addOrUpdateItem(createStorageItemFromShopping(item))
      )
    );
  });

  productFromShopping$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ProductsActions.addShoppingItem),
      map(({ item }) =>
        ProductsActions.addOrUpdateItem(createProductFrom(item))
      )
    );
  });

  shoppingFromStorage$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ShoppingActions.addStorageItem),
      map(({ item }) =>
        ShoppingActions.addOrUpdateItem(createShoppingItemFromStorage(item))
      )
    );
  });

  productFromStorage$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ProductsActions.addStorageItem),
      map(({ item }) =>
        ProductsActions.addOrUpdateItem(createProductFrom(item))
      )
    );
  });
}

export const householdRouteFilterEffects = {
  drilledFilter$: categoryFilterFromRoute(
    selectDrilledCategory,
    ({ listId, categoryId }) =>
      categoryId
        ? HouseholdListActions.updateFilter(listId, categoryId)
        : undefined
  ),

  clearFilter$: createEffect(
    (actions$ = inject(Actions), store = inject(Store)) => {
      return actions$.pipe(
        ofType(ItemListRouteActions.clearCategoryFilter),
        withLatestFrom(store.select(selectActiveHouseholdListId)),
        map(([, listId]) =>
          HouseholdListActions.updateFilter(listId, undefined)
        )
      );
    },
    { functional: true }
  ),
};

export const shoppingListEffects = {
  ...createItemListEffects({
    actions: ShoppingActions,
    select: selectShoppingState,
    create: (name, filterBy) => createShoppingItem(name, filterBy),
    undoableDelete: ShoppingActions.removeItem,
  }),

  clearSearch$: clearSearchAfter(ShoppingActions.updateSearch, [
    ShoppingActions.addItem,
    ShoppingActions.updateFilter,
  ]),
};

export const storageListEffects = {
  ...createItemListEffects({
    actions: StorageActions,
    select: selectStorageState,
    create: (name, filterBy) => createStorageItem(name, filterBy),
    undoableDelete: StorageActions.removeItem,
  }),

  clearSearch$: clearSearchAfter(StorageActions.updateSearch, [
    StorageActions.addItem,
    StorageActions.updateFilter,
  ]),
};

export const productsListEffects = {
  ...createItemListEffects({
    actions: ProductsActions,
    select: selectProductsState,
    create: (name, filterBy) => createProduct(name, filterBy),
    undoableDelete: ProductsActions.removeItem,
  }),

  clearSearch$: clearSearchAfter(ProductsActions.updateSearch, [
    ProductsActions.addItem,
    ProductsActions.updateFilter,
  ]),
};
