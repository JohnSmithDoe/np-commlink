import { filterBySearchQuery } from './household-search.utils';
import { mockCategory } from '../../@shared/testing/test-data';
import {
  mockHouseholdCategoryList,
  mockHouseholdState,
  mockListSettings,
  mockProduct,
  mockProductsState,
  mockShoppingItem,
  mockShoppingState,
  mockStorageItem,
  mockStorageState,
} from '../testing/household.test-data';

describe('household cross-list search', () => {
  it('returns undefined without a search query', () => {
    const lists = mockHouseholdState();
    expect(filterBySearchQuery(lists, lists.storage)).toBeUndefined();
  });

  it('returns the list items matching the query and flags an exact match', () => {
    const listState = mockStorageState({
      searchQuery: 'Milk',
      items: [
        mockStorageItem({ id: 'a', name: 'Milk' }),
        mockStorageItem({ id: 'b', name: 'Milkshake' }),
        mockStorageItem({ id: 'c', name: 'Bread' }),
      ],
    });
    const lists = mockHouseholdState({ storage: listState });
    const result = filterBySearchQuery(lists, listState);
    expect(result?.listItems.map((index) => index.name)).toEqual([
      'Milk',
      'Milkshake',
    ]);
    expect(result?.exactMatch?.name).toBe('Milk');
    expect(result?.searchTerm).toBe('Milk');
  });

  it('includes matching global items when the setting is enabled', () => {
    const listState = mockStorageState({
      searchQuery: 'Sug',
      items: [mockStorageItem({ id: 'a', name: 'Salt' })],
    });
    const lists = mockHouseholdState({
      storage: listState,
      products: mockProductsState({
        items: [mockProduct({ name: 'Sugar' })],
      }),
      listSettings: mockListSettings({ showProductsInStorage: true }),
    });
    const result = filterBySearchQuery(lists, listState);
    expect(result?.products?.map((index) => index.name)).toEqual(['Sugar']);
  });

  it('omits global items when the setting is disabled', () => {
    const listState = mockStorageState({
      searchQuery: 'Sug',
      items: [mockStorageItem({ id: 'a', name: 'Salt' })],
    });
    const lists = mockHouseholdState({
      storage: listState,
      products: mockProductsState({
        items: [mockProduct({ name: 'Sugar' })],
      }),
      listSettings: mockListSettings({ showProductsInStorage: false }),
    });
    expect(filterBySearchQuery(lists, listState)?.products).toBeUndefined();
  });

  it('decorates the products list with the storage and shopping buckets', () => {
    const listState = mockProductsState({
      searchQuery: 'Sug',
      items: [mockProduct({ id: 'p', name: 'Sugarcane' })],
    });
    const lists = mockHouseholdState({
      products: listState,
      storage: mockStorageState({
        items: [mockStorageItem({ id: 's', name: 'Sugar cubes' })],
      }),
      shopping: mockShoppingState({
        items: [mockShoppingItem({ id: 'h', name: 'Sugar syrup' })],
      }),
      listSettings: mockListSettings({
        showStorageInProducts: true,
        showShoppingInProducts: true,
      }),
    });
    const result = filterBySearchQuery(lists, listState);
    expect(result?.storageItems?.map((item) => item.name)).toEqual([
      'Sugar cubes',
    ]);
    expect(result?.shoppingItems?.map((item) => item.name)).toEqual([
      'Sugar syrup',
    ]);
  });

  it('decorates the shopping list with the products and storage buckets', () => {
    const listState = mockShoppingState({
      searchQuery: 'Sug',
      items: [mockShoppingItem({ id: 'h', name: 'Sugar syrup' })],
    });
    const lists = mockHouseholdState({
      shopping: listState,
      products: mockProductsState({
        items: [mockProduct({ id: 'p', name: 'Sugarcane' })],
      }),
      storage: mockStorageState({
        items: [mockStorageItem({ id: 's', name: 'Sugar cubes' })],
      }),
      listSettings: mockListSettings({
        showProductsInShopping: true,
        showStorageInShopping: true,
      }),
    });
    const result = filterBySearchQuery(lists, listState);
    expect(result?.products?.map((item) => item.name)).toEqual(['Sugarcane']);
    expect(result?.storageItems?.map((item) => item.name)).toEqual([
      'Sugar cubes',
    ]);
  });

  it('decorates the storage list with the shopping bucket', () => {
    const listState = mockStorageState({
      searchQuery: 'Sug',
      items: [],
    });
    const lists = mockHouseholdState({
      storage: listState,
      shopping: mockShoppingState({
        items: [mockShoppingItem({ id: 'h', name: 'Sugar syrup' })],
      }),
      listSettings: mockListSettings({ showShoppingInStorage: true }),
    });
    expect(
      filterBySearchQuery(lists, listState)?.shoppingItems?.map(
        (item) => item.name
      )
    ).toEqual(['Sugar syrup']);
  });

  it('suppresses a name already in the list or in an earlier bucket', () => {
    const listState = mockStorageState({
      searchQuery: 'Sugar',
      items: [mockStorageItem({ id: 's', name: 'Sugar' })],
    });
    const lists = mockHouseholdState({
      storage: listState,
      products: mockProductsState({
        items: [
          mockProduct({ id: 'p1', name: 'Sugar' }),
          mockProduct({ id: 'p2', name: 'Sugar syrup' }),
        ],
      }),
      shopping: mockShoppingState({
        items: [mockShoppingItem({ id: 'h', name: 'Sugar syrup' })],
      }),
      listSettings: mockListSettings({
        showProductsInStorage: true,
        showShoppingInStorage: true,
      }),
    });
    const result = filterBySearchQuery(lists, listState);
    expect(result?.products?.map((item) => item.name)).toEqual(['Sugar syrup']);
    expect(result?.shoppingItems).toEqual([]);
  });

  it('suggests a cross-list item whose category matches the query', () => {
    const listState = mockStorageState({ searchQuery: 'dair', items: [] });
    const lists = mockHouseholdState({
      storage: listState,
      categories: mockHouseholdCategoryList({
        items: [mockCategory({ id: 'c', name: 'Dairy' })],
      }),
      products: mockProductsState({
        items: [mockProduct({ id: 'p', name: 'Butter', categoryIds: ['c'] })],
      }),
      listSettings: mockListSettings({ showProductsInStorage: true }),
    });
    expect(
      filterBySearchQuery(lists, listState)?.products?.map((item) => item.name)
    ).toEqual(['Butter']);
  });

  it('leaves a non-household list undecorated', () => {
    const listState = mockStorageState({
      id: '_tracking' as never,
      searchQuery: 'Sug',
      items: [],
    });
    const lists = mockHouseholdState({
      products: mockProductsState({
        items: [mockProduct({ id: 'p', name: 'Sugar' })],
      }),
      listSettings: mockListSettings({ showProductsInStorage: true }),
    });
    expect(filterBySearchQuery(lists, listState)?.products).toBeUndefined();
  });
});
