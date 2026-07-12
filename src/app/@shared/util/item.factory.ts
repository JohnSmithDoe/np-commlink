import dayjs from 'dayjs';
import {
  IBaseItem,
  IGlobalItem,
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

export function createStorageItemFromGlobal(
  global: IGlobalItem,
  quantity = 1
): IStorageItem {
  let bestBefore: string | undefined;
  if (global.bestBeforeTimespan !== 'forever') {
    bestBefore = dayjs()
      .add(global.bestBeforeTimevalue ?? 1, global.bestBeforeTimespan)
      .format();
  }
  return createStorageItem(global.name, global.category, quantity, bestBefore);
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

export function createShoppingItemFromGlobal(
  global: IGlobalItem,
  quantity = 1
): IShoppingItem {
  return createShoppingItem(global.name, global.category, quantity);
}

export function createShoppingItemFromStorage(
  storage: IStorageItem,
  quantity = 1
): IShoppingItem {
  return createShoppingItem(storage.name, storage.category, quantity);
}

export function createGlobalItem(
  name: string,
  category?: string | string[]
): IGlobalItem {
  const base = createBaseItem(name, category);
  return {
    ...base,
    unit: 'pieces',
    packaging: 'loose',
    bestBeforeTimespan: 'forever',
    bestBeforeTimevalue: 1,
  };
}

export function createGlobalItemFrom(item: IBaseItem): IGlobalItem {
  return createGlobalItem(item.name, item.category);
}

export function createTaskItem(
  name: string,
  category?: string | string[],
  prio?: number
): ITaskItem {
  const base = createBaseItem(name, category);
  return { ...base, prio };
}
