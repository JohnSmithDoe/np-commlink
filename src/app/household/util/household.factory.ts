import dayjs from 'dayjs';
import { Timestamp } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';
import { CategoryId } from '../../@shared/model/category.types';
import { createBaseItem } from '../../@shared/util/app.factory';
import { uuidv4 } from '../../@shared/util/app.utils';
import {
  HouseholdListId,
  Product,
  ProductLinked,
  ShoppingItem,
  StorageItem,
} from '../model/household-list.types';
import { Recipe, RecipeIngredient } from '../model/recipe.types';

export function createStorageItem(
  name: string,
  categoryIds?: CategoryId | CategoryId[],
  quantity = 1,
  bestBefore?: Timestamp
): StorageItem {
  const base = createBaseItem(name, categoryIds);
  return { ...base, quantity, bestBefore };
}

function linkedToProduct<T extends ProductLinked>(
  item: T,
  productId: string | undefined
): T {
  return productId === undefined ? item : { ...item, productId };
}

export function createStorageItemFromProduct(
  product: Product,
  quantity = 1
): StorageItem {
  let bestBefore: string | undefined;
  if (product.bestBeforeTimespan !== 'forever') {
    bestBefore = dayjs()
      .add(product.bestBeforeTimevalue ?? 1, product.bestBeforeTimespan)
      .format();
  }
  return linkedToProduct(
    createStorageItem(product.name, product.categoryIds, quantity, bestBefore),
    product.id
  );
}

export function createStorageItemFromShopping(
  shopping: ShoppingItem,
  quantity = 1
): StorageItem {
  return linkedToProduct(
    createStorageItem(shopping.name, shopping.categoryIds, quantity),
    shopping.productId
  );
}

export function createShoppingItem(
  name: string,
  categoryIds?: CategoryId | CategoryId[],
  quantity = 1
): ShoppingItem {
  const base = createBaseItem(name, categoryIds);
  return { ...base, quantity, state: 'active' };
}

export function createShoppingItemFromProduct(
  product: Product,
  quantity = 1
): ShoppingItem {
  return linkedToProduct(
    createShoppingItem(product.name, product.categoryIds, quantity),
    product.id
  );
}

export function createShoppingItemFromStorage(
  storage: StorageItem,
  quantity = 1
): ShoppingItem {
  return linkedToProduct(
    createShoppingItem(storage.name, storage.categoryIds, quantity),
    storage.productId
  );
}

export function createProduct(
  name: string,
  categoryIds?: CategoryId | CategoryId[]
): Product {
  const base = createBaseItem(name, categoryIds);
  return {
    ...base,
    unit: 'pieces',
    packaging: 'loose',
    bestBeforeTimespan: 'forever',
    bestBeforeTimevalue: 1,
  };
}

export function createProductFrom(item: BaseItem): Product {
  return createProduct(item.name, item.categoryIds);
}

const DEFAULT_SERVINGS = 2;
const DEFAULT_PREP_MINUTES = 30;

export function createRecipe(name: string): Recipe {
  return {
    ...createBaseItem(name),
    ingredients: [],
    steps: '',
    servings: DEFAULT_SERVINGS,
    prepMinutes: DEFAULT_PREP_MINUTES,
  };
}

export function createRecipeIngredient(product: Product): RecipeIngredient {
  return {
    id: uuidv4(),
    productId: product.id,
    amount: 1,
    unit: product.unit,
  };
}

export function withQuantityChangedBy<T extends { quantity: number }>(
  item: T,
  diff: number
): T {
  return { ...item, quantity: Math.max(0, item.quantity + diff) };
}

export function createHouseholdItem(
  listId: HouseholdListId,
  name: string,
  categoryId: CategoryId | undefined
): BaseItem {
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
