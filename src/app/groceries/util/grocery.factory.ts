import dayjs from 'dayjs';
import { TTimestamp } from '../../@shared/model/app.types';
import { IBaseItem } from '../../@shared/model/base-item.types';
import { TCategoryId } from '../../@shared/model/category.types';
import { createBaseItem } from '../../@shared/util/app.factory';
import { uuidv4 } from '../../@shared/util/app.utils';
import {
  IProduct,
  IShoppingItem,
  IStorageItem,
  TGroceryListId,
} from '../model/grocery-list.types';
import { IRecipe, IRecipeIngredient } from '../model/recipe.types';

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

const DEFAULT_SERVINGS = 2;
const DEFAULT_PREP_MINUTES = 30;

export function createRecipe(name: string): IRecipe {
  return {
    ...createBaseItem(name),
    ingredients: [],
    steps: '',
    servings: DEFAULT_SERVINGS,
    prepMinutes: DEFAULT_PREP_MINUTES,
  };
}

/**
 * A fresh ingredient line for `product`. The line's unit is seeded from the
 * product's own unit (milk → ml) — the cook can still override it, because the
 * cooking unit belongs to the line.
 */
export function createRecipeIngredient(product: IProduct): IRecipeIngredient {
  return {
    id: uuidv4(),
    productId: product.id,
    amount: 1,
    unit: product.unit,
  };
}

/**
 * Step a quantity by `diff`, floored at zero — the stepper buttons must not be
 * able to drive a list item negative.
 */
export function withQuantityChangedBy<T extends { quantity: number }>(
  item: T,
  diff: number
): T {
  return { ...item, quantity: Math.max(0, item.quantity + diff) };
}

/**
 * The one place the three grocery lists' item types are resolved from a listId —
 * used by the facade's "create from the search term" command, which is
 * route-keyed and so cannot know the concrete list at compile time.
 */
export function createGroceryItem(
  listId: TGroceryListId,
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
  }
}
