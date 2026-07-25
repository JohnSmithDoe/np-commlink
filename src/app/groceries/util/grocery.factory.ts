import dayjs from 'dayjs';
import {
  IBaseItem,
  TCategoryId,
  TItemListId,
  TTimestamp,
} from '../../@shared/model/types';
import { createBaseItem } from '../../@shared/util/app.factory';
import { IProduct, IShoppingItem, IStorageItem } from '../model';

/**
 * Production factories for the grocery item types. Grocery-owned (moved out of
 * `@shared/util/item.factory` in the DDD god-file split); they build on the
 * shared-kernel `createBaseItem` seed. Deterministic mocks live in
 * `groceries/testing`.
 */

export function createStorageItem(
  name: string,
  categoryIds?: TCategoryId | TCategoryId[],
  quantity = 1,
  bestBefore?: TTimestamp
): IStorageItem {
  const base = createBaseItem(name, categoryIds);
  return { ...base, quantity, bestBefore };
}

export function createStorageItemFromProduct(
  product: IProduct,
  quantity = 1
): IStorageItem {
  let bestBefore: string | undefined;
  if (product.bestBeforeTimespan !== 'forever') {
    bestBefore = dayjs()
      .add(product.bestBeforeTimevalue ?? 1, product.bestBeforeTimespan)
      .format();
  }
  return createStorageItem(
    product.name,
    product.categoryIds,
    quantity,
    bestBefore
  );
}

export function createStorageItemFromShopping(
  shopping: IShoppingItem,
  quantity = 1
): IStorageItem {
  return createStorageItem(shopping.name, shopping.categoryIds, quantity);
}

export function createShoppingItem(
  name: string,
  categoryIds?: TCategoryId | TCategoryId[],
  quantity = 1
): IShoppingItem {
  const base = createBaseItem(name, categoryIds);
  return { ...base, quantity, state: 'active' };
}

export function createShoppingItemFromProduct(
  product: IProduct,
  quantity = 1
): IShoppingItem {
  return createShoppingItem(product.name, product.categoryIds, quantity);
}

export function createShoppingItemFromStorage(
  storage: IStorageItem,
  quantity = 1
): IShoppingItem {
  return createShoppingItem(storage.name, storage.categoryIds, quantity);
}

export function createProduct(
  name: string,
  categoryIds?: TCategoryId | TCategoryId[]
): IProduct {
  const base = createBaseItem(name, categoryIds);
  return {
    ...base,
    unit: 'pieces',
    packaging: 'loose',
    bestBeforeTimespan: 'forever',
    bestBeforeTimevalue: 1,
  };
}

export function createProductFrom(item: IBaseItem): IProduct {
  return createProduct(item.name, item.categoryIds);
}

/**
 * The one place the three grocery lists' item types are resolved from a listId —
 * used by the facade's "create from the search term" command, which is
 * route-keyed and so cannot know the concrete list at compile time.
 */
export function createGroceryItem(
  listId: TItemListId,
  name: string,
  categoryId: TCategoryId | undefined
): IBaseItem {
  switch (listId) {
    case '_storage': {
      return createStorageItem(name, categoryId);
    }
    case '_products': {
      return createProduct(name, categoryId);
    }
    case '_shopping': {
      return createShoppingItem(name, categoryId);
    }
    default: {
      throw new Error(`grocery dialogs: unexpected listId ${listId}`);
    }
  }
}
