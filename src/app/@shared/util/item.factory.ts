import dayjs from 'dayjs';
import {
  IBaseItem,
  IProduct,
  IShoppingItem,
  IStorageItem,
  ITaskItem,
  TTimestamp,
} from '../types';
import { createBaseItem } from './app.factory';

/**
 * Production factories for the grocery item types. Kept in @shared/util (not in
 * the individual feature domains) because the shared item-dialogs reducer seeds
 * its initial state with `createStorageItem` — a per-domain factory would invert
 * the @shared → domain dependency. Deterministic mocks live in @shared/testing.
 */

export function createStorageItem(
  name: string,
  category?: string | string[],
  quantity = 1,
  bestBefore?: TTimestamp
): IStorageItem {
  const base = createBaseItem(name, category);
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
    product.category,
    quantity,
    bestBefore
  );
}

export function createStorageItemFromShopping(
  shopping: IShoppingItem,
  quantity = 1
): IStorageItem {
  return createStorageItem(shopping.name, shopping.category, quantity);
}

export function createShoppingItem(
  name: string,
  category?: string | string[],
  quantity = 1
): IShoppingItem {
  const base = createBaseItem(name, category);
  return { ...base, quantity, state: 'active' };
}

export function createShoppingItemFromProduct(
  product: IProduct,
  quantity = 1
): IShoppingItem {
  return createShoppingItem(product.name, product.category, quantity);
}

export function createShoppingItemFromStorage(
  storage: IStorageItem,
  quantity = 1
): IShoppingItem {
  return createShoppingItem(storage.name, storage.category, quantity);
}

export function createProduct(
  name: string,
  category?: string | string[]
): IProduct {
  const base = createBaseItem(name, category);
  return {
    ...base,
    unit: 'pieces',
    packaging: 'loose',
    bestBeforeTimespan: 'forever',
    bestBeforeTimevalue: 1,
  };
}

export function createProductFrom(item: IBaseItem): IProduct {
  return createProduct(item.name, item.category);
}

export function createTaskItem(
  name: string,
  category?: string | string[],
  prio?: number
): ITaskItem {
  const base = createBaseItem(name, category);
  return { ...base, prio };
}
