import dayjs from 'dayjs';
import { IBaseItem, TTimestamp } from '../../@shared/types';
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
