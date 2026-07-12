import { IStorageItem, IStorageState } from '../../types';
import {
  addListCategory,
  addListItem,
  addListItemOrIncreaseQuantity,
  addShoppinglistToStorage,
  categoriesFromList,
  filterByByListId,
  listIdByPrefix,
  removeListCategory,
  removeListItem,
  removeListItems,
  searchQueryByListId,
  stateByListId,
  updateCategories,
  updatedSearchQuery,
  updateListItem,
  updateListMode,
  updateListSort,
  updateQuickAddState,
} from './grocery-list.utils';
import {
  mockAppState,
  mockShoppingItem,
  mockShoppingState,
  mockStorageItem,
  mockStorageState,
} from '../../testing/test-data';

describe('item-list.utils', () => {
  describe('categoriesFromList', () => {
    it('collects the unique categories from all items', () => {
      const items = [
        mockStorageItem({ id: 'a', category: ['Dairy', 'Fresh'] }),
        mockStorageItem({ id: 'b', category: ['Dairy'] }),
        mockStorageItem({ id: 'c' }),
      ];
      expect(categoriesFromList(items)).toEqual(['Dairy', 'Fresh']);
    });
  });

  describe('updateCategories', () => {
    it('merges item categories with the existing list categories (deduped)', () => {
      const state = mockStorageState({
        items: [mockStorageItem({ category: ['Fresh'] })],
        categories: ['Dairy'],
      });
      expect(updateCategories(state).categories).toEqual(['Fresh', 'Dairy']);
    });
  });

  describe('addListItem', () => {
    it('prepends the item and refreshes categories', () => {
      const existing = mockStorageItem({ id: 'a', name: 'Milk' });
      const state = mockStorageState({ items: [existing] });
      const added = mockStorageItem({
        id: 'b',
        name: 'Bread',
        category: ['Bakery'],
      });
      const result = addListItem(state, added);
      expect(result.items[0]).toBe(added);
      expect(result.items).toHaveLength(2);
      expect(result.categories).toContain('Bakery');
    });

    it('ignores an item with a blank name', () => {
      const state = mockStorageState();
      expect(addListItem(state, mockStorageItem({ name: '  ' }))).toBe(state);
    });
  });

  describe('removeListItem / removeListItems', () => {
    it('removes a single item by id', () => {
      const a = mockStorageItem({ id: 'a' });
      const b = mockStorageItem({ id: 'b' });
      const state = mockStorageState({ items: [a, b] });
      expect(removeListItem(state, a).items).toEqual([b]);
    });

    it('removes multiple items by id', () => {
      const a = mockStorageItem({ id: 'a' });
      const b = mockStorageItem({ id: 'b' });
      const c = mockStorageItem({ id: 'c' });
      const state = mockStorageState({ items: [a, b, c] });
      expect(removeListItems(state, [a, c]).items).toEqual([b]);
    });
  });

  describe('updateListItem', () => {
    it('updates a matching item', () => {
      const a = mockStorageItem({ id: 'a', quantity: 1 });
      const state = mockStorageState({ items: [a] });
      const result = updateListItem<IStorageState, IStorageItem>(state, {
        ...a,
        quantity: 9,
      });
      expect(result.items[0].quantity).toBe(9);
    });

    it('returns the state unchanged for a missing item / undefined dto', () => {
      const state = mockStorageState({ items: [mockStorageItem({ id: 'a' })] });
      expect(
        updateListItem<IStorageState, IStorageItem>(state, undefined)
      ).toBe(state);
      const untouched = updateListItem<IStorageState, IStorageItem>(
        state,
        mockStorageItem({ id: 'missing', name: 'x' })
      );
      expect(untouched.items[0].id).toBe('a');
    });
  });

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
      expect(result.items.find((i) => i.name === 'Milk')?.quantity).toBe(3);
      expect(result.items.find((i) => i.name === 'Bread')?.quantity).toBe(3);
    });
  });

  describe('updateListSort', () => {
    it('returns undefined without a sortBy', () => {
      expect(updateListSort(undefined)).toBeUndefined();
    });

    it('honours an explicit direction', () => {
      expect(updateListSort('name', 'desc')).toEqual({
        sortBy: 'name',
        sortDir: 'desc',
      });
    });

    it('keeps the current direction', () => {
      expect(updateListSort('name', 'keep', 'desc')).toEqual({
        sortBy: 'name',
        sortDir: 'desc',
      });
    });

    it('toggles the direction', () => {
      expect(updateListSort('name', 'toggle', 'asc')?.sortDir).toBe('desc');
      expect(updateListSort('name', 'toggle', 'desc')?.sortDir).toBe('asc');
    });

    it('defaults to asc', () => {
      expect(updateListSort('name')?.sortDir).toBe('asc');
    });
  });

  describe('updateListMode', () => {
    it('resets the sort when the mode changes', () => {
      const state = mockStorageState({
        mode: 'alphabetical',
        sort: { sortBy: 'name', sortDir: 'desc' },
      });
      const result = updateListMode(state, 'categories');
      expect(result.mode).toBe('categories');
      expect(result.sort).toEqual({ sortBy: 'name', sortDir: 'asc' });
    });

    it('toggles the sort when the mode stays the same', () => {
      const state = mockStorageState({
        mode: 'alphabetical',
        sort: { sortBy: 'name', sortDir: 'asc' },
      });
      expect(updateListMode(state, 'alphabetical').sort?.sortDir).toBe('desc');
    });

    it('clears the filter in categories mode and defaults undefined mode to alphabetical', () => {
      const state = mockStorageState({
        mode: 'alphabetical',
        filterBy: 'Dairy',
      });
      expect(updateListMode(state, 'categories').filterBy).toBeUndefined();
      expect(updateListMode(state, undefined).mode).toBe('alphabetical');
    });
  });

  describe('addListCategory', () => {
    it('prepends a new category', () => {
      const state = mockStorageState({ categories: ['Dairy'] });
      expect(addListCategory(state, 'Bakery').categories).toEqual([
        'Bakery',
        'Dairy',
      ]);
    });

    it('ignores an empty or duplicate category', () => {
      const state = mockStorageState({ categories: ['Dairy'] });
      expect(addListCategory(state, '')).toBe(state);
      expect(addListCategory(state, 'Dairy')).toBe(state);
    });
  });

  describe('removeListCategory', () => {
    it('removes the category from the list and every item', () => {
      const state = mockStorageState({
        categories: ['Dairy', 'Fresh'],
        items: [mockStorageItem({ category: ['Dairy', 'Fresh'] })],
      });
      const result = removeListCategory(state, 'Dairy');
      expect(result.categories).toEqual(['Fresh']);
      expect(result.items[0].category).toEqual(['Fresh']);
    });
  });

  describe('updatedSearchQuery', () => {
    it('keeps the query when the item name still contains it', () => {
      expect(updatedSearchQuery(mockStorageItem({ name: 'Milk' }), 'Mil')).toBe(
        'Mil'
      );
    });

    it('clears the query when the item name no longer contains it', () => {
      expect(
        updatedSearchQuery(mockStorageItem({ name: 'Bread' }), 'Milk')
      ).toBeUndefined();
    });
  });

  describe('listIdByPrefix', () => {
    it('maps an action-type prefix to a list id', () => {
      expect(listIdByPrefix('[Storage] Add Item')).toBe('_storage');
      expect(listIdByPrefix('[Shopping] Add Item')).toBe('_shopping');
      expect(listIdByPrefix('[Globals] Add Item')).toBe('_globals');
      expect(listIdByPrefix('[Tasks] Add Item')).toBe('_tasks');
    });

    it('throws for an unknown prefix', () => {
      expect(() => listIdByPrefix('[Unknown]')).toThrow();
    });
  });

  describe('stateByListId / searchQueryByListId / filterByByListId', () => {
    const appState = mockAppState({
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

    it('trims the search query / filter of a list', () => {
      expect(searchQueryByListId(appState, '_storage')).toBe('milk');
      expect(filterByByListId(appState, '_storage')).toBe('Dairy');
    });
  });

  describe('updateQuickAddState', () => {
    it('allows adding a local and a global item for a new storage search', () => {
      const state = mockAppState({
        storage: mockStorageState({
          searchQuery: 'Milk',
          mode: 'alphabetical',
        }),
      });
      const result = updateQuickAddState(state, '_storage');
      expect(result.searchQuery).toBe('Milk');
      expect(result.color).toBe('storage');
      expect(result.canAddLocal).toBe(true);
      expect(result.canAddGlobal).toBe(true);
      expect(result.canAddCategory).toBe(false);
    });

    it('disallows adding a local item that already exists exactly', () => {
      const state = mockAppState({
        storage: mockStorageState({
          searchQuery: 'Milk',
          items: [mockStorageItem({ name: 'Milk' })],
        }),
      });
      expect(updateQuickAddState(state, '_storage').canAddLocal).toBe(false);
    });

    it('offers category creation in categories mode', () => {
      const state = mockAppState({
        storage: mockStorageState({ searchQuery: 'Dairy', mode: 'categories' }),
      });
      const result = updateQuickAddState(state, '_storage');
      expect(result.canAddCategory).toBe(true);
      expect(result.canAddLocal).toBe(false);
    });

    it('never offers a global item for the globals or tasks list', () => {
      const globalsState = mockAppState({
        globals: mockStorageState({ searchQuery: 'Milk' }) as never,
      });
      expect(updateQuickAddState(globalsState, '_globals').canAddGlobal).toBe(
        false
      );
    });

    it('shows nothing for an empty search', () => {
      const state = mockAppState({
        storage: mockStorageState({ searchQuery: '   ' }),
      });
      const result = updateQuickAddState(state, '_storage');
      expect(result.canAddLocal).toBe(false);
      expect(result.canAddGlobal).toBe(false);
    });
  });
});
