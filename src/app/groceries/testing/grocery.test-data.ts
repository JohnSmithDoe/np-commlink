import {
  IGroceryLists,
  IListSettings,
  IProduct,
  IProductsState,
  IQuickAddState,
  IShoppingItem,
  IShoppingState,
  IStorageItem,
  IStorageState,
} from '../model';
import { TEST_TIMESTAMP } from '../../@shared/testing/test-data';

// Deterministic grocery fixtures (type:testing), moved out of the shared
// test-data god-file so `@shared/testing` no longer imports a domain type
// (DDD review #1). Stable ids/timestamps keep equality assertions repeatable.

// Grocery list feature-flags + quick-add UI-state fixtures. They live here (not
// in the shared kit) because @shared/testing is domain:shared and may not
// reference the grocery-owned IListSettings / IQuickAddState (settings re-scope).
export function mockListSettings(
  overrides: Partial<IListSettings> = {}
): IListSettings {
  return {
    showQuickAdd: false,
    showQuickAddProduct: false,
    showQuickAddCategory: false,
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
  overrides: Partial<IQuickAddState> = {}
): IQuickAddState {
  return {
    canAddLocal: false,
    canAddProduct: false,
    canAddCategory: false,
    searchQuery: undefined,
    ...overrides,
  };
}

export function mockStorageItem(
  overrides: Partial<IStorageItem> = {}
): IStorageItem {
  return {
    id: 'storage-1',
    name: 'Milk',
    createdAt: TEST_TIMESTAMP,
    quantity: 1,
    ...overrides,
  };
}

export function mockShoppingItem(
  overrides: Partial<IShoppingItem> = {}
): IShoppingItem {
  return {
    id: 'shopping-1',
    name: 'Bread',
    createdAt: TEST_TIMESTAMP,
    quantity: 1,
    state: 'active',
    ...overrides,
  };
}

export function mockProduct(overrides: Partial<IProduct> = {}): IProduct {
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
  overrides: Partial<IStorageState> = {}
): IStorageState {
  return {
    id: '_storage',
    title: 'Storage',
    items: [],
    categories: [],
    mode: 'alphabetical',
    ...overrides,
  };
}

export function mockShoppingState(
  overrides: Partial<IShoppingState> = {}
): IShoppingState {
  return {
    id: '_shopping',
    title: 'Shopping Items',
    items: [],
    categories: [],
    mode: 'alphabetical',
    showActionSheet: false,
    ...overrides,
  };
}

export function mockProductsState(
  overrides: Partial<IProductsState> = {}
): IProductsState {
  return {
    id: '_products',
    title: 'Product Items',
    items: [],
    categories: [],
    mode: 'alphabetical',
    ...overrides,
  };
}

// The grocery slice bundle the cross-list engine helpers (stateByListId,
// updateQuickAddState, filterBySearchQuery, …) now take instead of IAppState
// (the grocery slices left IAppState in the god-file split).
export function mockGroceryLists(
  overrides: Partial<IGroceryLists> = {}
): IGroceryLists {
  return {
    storage: mockStorageState(),
    products: mockProductsState(),
    shopping: mockShoppingState(),
    listSettings: mockListSettings(),
    ...overrides,
  };
}
