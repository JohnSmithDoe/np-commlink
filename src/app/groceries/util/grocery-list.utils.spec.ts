import {
  addListItemOrIncreaseQuantity,
  addShoppinglistToStorage,
  listIdByPrefix,
  searchQueryByListId,
  stateByListId,
  updateQuickAddState,
} from './grocery-list.utils';
import {
  mockGroceriesState,
  mockShoppingItem,
  mockShoppingState,
  mockStorageItem,
  mockStorageState,
} from '../testing/groceries.test-data';

// Only the grocery-specific engine helpers — the ones that read a concrete list
// identity, cross-list state or a quantity. The domain-blind helpers these build
// on are pinned against a neutral probe in `@shared/util/list/list.utils.spec`.
describe('grocery list utils', () => {
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

  describe('listIdByPrefix', () => {
    it('maps an action-type prefix to a list id', () => {
      expect(listIdByPrefix('[Storage] addItem')).toBe('_storage');
      expect(listIdByPrefix('[Shopping] addItem')).toBe('_shopping');
      expect(listIdByPrefix('[Products] addItem')).toBe('_products');
    });

    it('throws for a non-grocery prefix', () => {
      expect(() => listIdByPrefix('[Tasks] addItem')).toThrow();
      expect(() => listIdByPrefix('[Unknown]')).toThrow();
    });
  });

  describe('stateByListId / searchQueryByListId', () => {
    const appState = mockGroceriesState({
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

    it('trims the search query of a list', () => {
      expect(searchQueryByListId(appState, '_storage')).toBe('milk');
    });
  });

  describe('updateQuickAddState', () => {
    it('allows adding a local and a global item for a new storage search', () => {
      const state = mockGroceriesState({
        storage: mockStorageState({
          searchQuery: 'Milk',
        }),
      });
      const result = updateQuickAddState(state, '_storage');
      expect(result.searchQuery).toBe('Milk');
      expect(result.color).toBe('primary');
      expect(result.canAddLocal).toBe(true);
      expect(result.canAddProduct).toBe(true);
    });

    it('disallows adding a local item that already exists exactly', () => {
      const state = mockGroceriesState({
        storage: mockStorageState({
          searchQuery: 'Milk',
          items: [mockStorageItem({ name: 'Milk' })],
        }),
      });
      expect(updateQuickAddState(state, '_storage').canAddLocal).toBe(false);
    });

    it('never offers a global item for the globals or tasks list', () => {
      const productsState = mockGroceriesState({
        products: mockStorageState({ searchQuery: 'Milk' }) as never,
      });
      expect(
        updateQuickAddState(productsState, '_products').canAddProduct
      ).toBe(false);
    });

    it('shows nothing for an empty search', () => {
      const state = mockGroceriesState({
        storage: mockStorageState({ searchQuery: ' '.repeat(3) }),
      });
      const result = updateQuickAddState(state, '_storage');
      expect(result.canAddLocal).toBe(false);
      expect(result.canAddProduct).toBe(false);
    });
  });
});
