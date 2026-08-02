/* ─── why ─────────────────────────────────────────────────────────
 * What is left here is the part that is genuinely multi-list: a page
 * addresses `:listId` and the engine has to name the slice. The list
 * FLOW — build from search, add-or-update, clear search, follow a rename
 * — is not multi-list at all and now comes from `createItemListEffects`
 * three times, once per slice, exactly as tasks and the catalog do it.
 *
 * That was also the last reason the domain needed `<never>`. The
 * hand-rolled versions fanned out over a union of three action groups, so
 * nothing could type the item they carried; a per-slice invocation is
 * typed from `T`, and the three casts went with the fan-out.
 * `createHouseholdItem` stays, because the one caller left is genuinely
 * list-agnostic: the facade seeds a create-dialog knowing only `:listId`.
 * ───────────────────────────────────────────────────────────────── */

import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs';
import {
  clearSearchAfter,
  createItemListEffects,
} from '../../../@shared/data/item-lists/item-list.effects.factory';
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

export const shoppingListEffects = {
  ...createItemListEffects({
    actions: ShoppingActions,
    select: selectShoppingState,
    create: (name, filterBy) => createShoppingItem(name, filterBy),
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
  }),

  clearSearch$: clearSearchAfter(ProductsActions.updateSearch, [
    ProductsActions.addItem,
    ProductsActions.updateFilter,
  ]),
};
