import {
  addListItemOrIncreaseQuantity,
  addShoppinglistToStorage,
  SOURCE_PREFIX_BY_LIST_ID,
  stateByListId,
  storageStatusColor,
  deriveQuickAddState,
} from './household-list.utils';
import {
  mockHouseholdState,
  mockShoppingItem,
  mockShoppingState,
  mockStorageItem,
  mockStorageState,
} from '../testing/household.test-data';

const color = (quantity: number, minAmount?: number) =>
  storageStatusColor(mockStorageItem({ quantity, minAmount }));

describe('household list utils', () => {
  describe('addListItemOrIncreaseQuantity', () => {
    it('adds a new item when not present', () => {
      const state = mockStorageState();
      const result = addListItemOrIncreaseQuantity(
        state,
        mockStorageItem({ name: 'Milk', quantity: 1 })
      );
      expect(result.items).toHaveLength(1);
    });

    it('increases the quantity by one for an existing item', () => {
      const existing = mockStorageItem({ id: 'a', name: 'Milk', quantity: 2 });
      const state = mockStorageState({ items: [existing] });
      const result = addListItemOrIncreaseQuantity(
        state,
        mockStorageItem({ id: 'a', name: 'Milk', quantity: 5 })
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(3);
    });

    it('adds the incoming quantity when byOne is false', () => {
      const existing = mockStorageItem({ id: 'a', name: 'Milk', quantity: 2 });
      const state = mockStorageState({ items: [existing] });
      const result = addListItemOrIncreaseQuantity(
        state,
        mockStorageItem({ id: 'a', name: 'Milk', quantity: 5 }),
        false
      );
      expect(result.items[0].quantity).toBe(7);
    });
  });

  describe('addShoppinglistToStorage', () => {
    it('adds new items and merges quantities of existing ones', () => {
      const state = mockStorageState({
        items: [mockStorageItem({ name: 'Milk', quantity: 1 })],
      });
      const result = addShoppinglistToStorage(state, [
        mockShoppingItem({ name: 'Milk', quantity: 2 }),
        mockShoppingItem({ id: 's2', name: 'Bread', quantity: 3 }),
      ]);
      expect(
        result.items.find((index) => index.name === 'Milk')?.quantity
      ).toBe(3);
      expect(
        result.items.find((index) => index.name === 'Bread')?.quantity
      ).toBe(3);
    });
  });

  describe('SOURCE_PREFIX_BY_LIST_ID', () => {
    it('names the action source each list publishes under', () => {
      expect(SOURCE_PREFIX_BY_LIST_ID).toEqual({
        _storage: '[Storage]',
        _shopping: '[Shopping]',
        _products: '[Products]',
      });
    });
  });

  describe('stateByListId', () => {
    const appState = mockHouseholdState({
      storage: mockStorageState({
        searchQuery: '  milk  ',
        filterBy: '  Dairy ',
      }),
      shopping: mockShoppingState({ searchQuery: 'bread' }),
    });

    it('returns the correct slice', () => {
      expect(stateByListId(appState, '_storage')).toBe(appState.storage);
      expect(stateByListId(appState, '_shopping')).toBe(appState.shopping);
    });
  });

  describe('deriveQuickAddState', () => {
    it('allows adding a local and a global item for a new storage search', () => {
      const state = mockHouseholdState({
        storage: mockStorageState({
          searchQuery: 'Milk',
        }),
      });
      const result = deriveQuickAddState(state, '_storage');
      expect(result.searchQuery).toBe('Milk');
      expect(result.color).toBe('primary');
      expect(result.canAddLocal).toBe(true);
      expect(result.canAddProduct).toBe(true);
    });

    it('disallows adding a local item that already exists exactly', () => {
      const state = mockHouseholdState({
        storage: mockStorageState({
          searchQuery: 'Milk',
          items: [mockStorageItem({ name: 'Milk' })],
        }),
      });
      expect(deriveQuickAddState(state, '_storage').canAddLocal).toBe(false);
    });

    it('never offers a global item for the globals or tasks list', () => {
      const productsState = mockHouseholdState({
        products: mockStorageState({ searchQuery: 'Milk' }) as never,
      });
      expect(
        deriveQuickAddState(productsState, '_products').canAddProduct
      ).toBe(false);
    });

    it('shows nothing for an empty search', () => {
      const state = mockHouseholdState({
        storage: mockStorageState({ searchQuery: ' '.repeat(3) }),
      });
      const result = deriveQuickAddState(state, '_storage');
      expect(result.canAddLocal).toBe(false);
      expect(result.canAddProduct).toBe(false);
    });
  });

  describe('storageStatusColor', () => {
    it('is neutral for a row that declares no minimum', () => {
      expect(color(0)).toBe('success');
      expect(color(7)).toBe('success');
    });

    it('warns at the minimum and alarms below it', () => {
      expect(color(1, 2)).toBe('danger');
      expect(color(2, 2)).toBe('warning');
      expect(color(3, 2)).toBe('success');
    });

    it('treats a zero minimum as no minimum, not as a breach', () => {
      expect(color(0, 0)).toBe('success');
    });
  });
});
