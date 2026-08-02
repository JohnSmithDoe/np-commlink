import { CategoryList } from '../../@shared/model/category.types';
import { HouseholdState } from '../model/household.types';
import {
  HOUSEHOLD_CATEGORIES_LIST_ID,
  PRODUCTS_LIST_ID,
  SHOPPING_LIST_ID,
  STORAGE_LIST_ID,
  Product,
  ProductsState,
  ShoppingItem,
  ShoppingState,
  StorageItem,
  StorageState,
} from '../model/household-list.types';
import { ListSettings, QuickAddState } from '../model/list-settings.types';
import {
  Recipe,
  RecipeIngredient,
  RECIPES_LIST_ID,
  RecipesState,
} from '../model/recipe.types';
import { TEST_TIMESTAMP } from '../../@shared/testing/test-data';

export function mockListSettings(
  overrides: Partial<ListSettings> = {}
): ListSettings {
  return {
    showQuickAdd: false,
    showQuickAddProduct: false,
    showProductsInStorage: false,
    showShoppingInStorage: false,
    showProductsInShopping: false,
    showStorageInShopping: false,
    showStorageInProducts: false,
    showShoppingInProducts: false,
    ...overrides,
  };
}

export function mockQuickAddState(
  overrides: Partial<QuickAddState> = {}
): QuickAddState {
  return {
    canAddLocal: false,
    canAddProduct: false,
    searchQuery: undefined,
    ...overrides,
  };
}

export function mockStorageItem(
  overrides: Partial<StorageItem> = {}
): StorageItem {
  return {
    id: 'storage-1',
    name: 'Milk',
    createdAt: TEST_TIMESTAMP,
    quantity: 1,
    ...overrides,
  };
}

export function mockShoppingItem(
  overrides: Partial<ShoppingItem> = {}
): ShoppingItem {
  return {
    id: 'shopping-1',
    name: 'Bread',
    createdAt: TEST_TIMESTAMP,
    quantity: 1,
    state: 'active',
    ...overrides,
  };
}

export function mockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    name: 'Sugar',
    createdAt: TEST_TIMESTAMP,
    unit: 'pieces',
    packaging: 'loose',
    bestBeforeTimespan: 'forever',
    bestBeforeTimevalue: 1,
    ...overrides,
  };
}

export function mockStorageState(
  overrides: Partial<StorageState> = {}
): StorageState {
  return {
    id: STORAGE_LIST_ID,
    items: [],
    ...overrides,
  };
}

export function mockShoppingState(
  overrides: Partial<ShoppingState> = {}
): ShoppingState {
  return {
    id: SHOPPING_LIST_ID,
    items: [],
    showActionSheet: false,
    ...overrides,
  };
}

export function mockProductsState(
  overrides: Partial<ProductsState> = {}
): ProductsState {
  return {
    id: PRODUCTS_LIST_ID,
    items: [],
    ...overrides,
  };
}

export function mockRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recipe-1',
    name: 'Pancakes',
    createdAt: TEST_TIMESTAMP,
    ingredients: [],
    steps: '',
    servings: 2,
    prepMinutes: 30,
    ...overrides,
  };
}

export function mockRecipeIngredient(
  overrides: Partial<RecipeIngredient> = {}
): RecipeIngredient {
  return {
    id: 'ingredient-1',
    productId: 'product-1',
    amount: 1,
    unit: 'pieces',
    ...overrides,
  };
}

export function mockRecipesState(
  overrides: Partial<RecipesState> = {}
): RecipesState {
  return {
    id: RECIPES_LIST_ID,
    items: [],
    ...overrides,
  };
}

export function mockHouseholdCategoryList(
  overrides: Partial<CategoryList> = {}
): CategoryList {
  return { id: HOUSEHOLD_CATEGORIES_LIST_ID, items: [], ...overrides };
}

export function mockHouseholdState(
  overrides: Partial<HouseholdState> = {}
): HouseholdState {
  return {
    storage: mockStorageState(),
    products: mockProductsState(),
    shopping: mockShoppingState(),
    recipes: mockRecipesState(),
    listSettings: mockListSettings(),
    categories: mockHouseholdCategoryList(),
    ...overrides,
  };
}
