import { IStorageItem, IStorageState } from '../../model';
import {
  addListCategory,
  addListCategoryObject,
  addListItem,
  addListItemOrIncreaseQuantity,
  addShoppinglistToStorage,
  filterByByListId,
  listIdByPrefix,
  removeListCategory,
  removeListItem,
  removeListItems,
  searchQueryByListId,
  stateByListId,
  updatedSearchQuery,
  updateListCategory,
  updateListItem,
  updateListMode,
  updateListSort,
  updateQuickAddState,
} from './grocery-list.utils';
import { mockCategory } from '../../../@shared/testing/test-data';
import {
  mockGroceryLists,
  mockShoppingItem,
  mockShoppingState,
  mockStorageItem,
  mockStorageState,
} from '../../testing/grocery.test-data';

describe('item-list.utils', () => {
  describe('addListItem', () => {
    it('prepends the item without deriving categories', () => {
      const existing = mockStorageItem({ id: 'a', name: 'Milk' });
      const state = mockStorageState({ items: [existing] });
      const added = mockStorageItem({
        id: 'b',
        name: 'Bread',
        categoryIds: ['bakery'],
      });
      const result = addListItem(state, added);
      expect(result.items[0]).toBe(added);
      expect(result.items).toHaveLength(2);
      // The catalog is authoritative — adding an item never mints a category.
      expect(result.categories).toEqual([]);
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
      expect(
        result.items.find((index) => index.name === 'Milk')?.quantity
      ).toBe(3);
      expect(
        result.items.find((index) => index.name === 'Bread')?.quantity
      ).toBe(3);
    });
  });

  describe('updateListSort', () => {
    it('returns undefined without a sortBy', () => {
      expect(updateListSort()).toBeUndefined();
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
      expect(updateListMode(state).mode).toBe('alphabetical');
    });
  });

  describe('addListCategory', () => {
    it('mints a new {id,name} category and prepends it', () => {
      const state = mockStorageState({
        categories: [mockCategory({ id: 'dairy', name: 'Dairy' })],
      });
      // The minted id is a uuid — assert on the resolved names, not the id.
      expect(
        addListCategory(state, 'Bakery').categories.map((c) => c.name)
      ).toEqual(['Bakery', 'Dairy']);
    });

    it('ignores an empty or duplicate (case-insensitive) category', () => {
      const state = mockStorageState({
        categories: [mockCategory({ id: 'dairy', name: 'Dairy' })],
      });
      expect(addListCategory(state, '')).toBe(state);
      expect(addListCategory(state, 'dairy')).toBe(state);
    });
  });

  describe('addListCategoryObject', () => {
    it('prepends a pre-minted {id,name} category', () => {
      const state = mockStorageState({
        categories: [mockCategory({ id: 'dairy', name: 'Dairy' })],
      });
      expect(
        addListCategoryObject(state, { id: 'bake', name: 'Bakery' }).categories
      ).toEqual([
        { id: 'bake', name: 'Bakery' },
        { id: 'dairy', name: 'Dairy' },
      ]);
    });

    it('is a no-op on a duplicate id, a case-insensitive duplicate name, or a blank name', () => {
      const state = mockStorageState({
        categories: [mockCategory({ id: 'dairy', name: 'Dairy' })],
      });
      expect(addListCategoryObject(state, { id: 'dairy', name: 'X' })).toBe(
        state
      );
      expect(addListCategoryObject(state, { id: 'new', name: 'dairy' })).toBe(
        state
      );
      expect(addListCategoryObject(state, { id: 'new', name: '  ' })).toBe(
        state
      );
    });
  });

  describe('updateListCategory', () => {
    it('renames in place, keeping the id and leaving items untouched', () => {
      const state = mockStorageState({
        categories: [mockCategory({ id: 'dairy', name: 'Dairy' })],
        items: [mockStorageItem({ categoryIds: ['dairy'] })],
      });
      const result = updateListCategory(state, 'dairy', 'Fridge');
      expect(result.categories).toEqual([{ id: 'dairy', name: 'Fridge' }]);
      expect(result.items[0].categoryIds).toEqual(['dairy']);
    });

    it('merges onto an existing name: drops the entry and remaps item refs, deduped', () => {
      const state = mockStorageState({
        categories: [
          mockCategory({ id: 'fresh', name: 'Fresh' }),
          mockCategory({ id: 'dairy', name: 'Dairy' }),
        ],
        items: [mockStorageItem({ categoryIds: ['dairy', 'fresh'] })],
      });
      const result = updateListCategory(state, 'dairy', 'fresh');
      expect(result.categories.map((c) => c.id)).toEqual(['fresh']);
      expect(result.items[0].categoryIds).toEqual(['fresh']);
    });

    it('is a no-op for a blank new name or an unknown id', () => {
      const state = mockStorageState({
        categories: [mockCategory({ id: 'dairy', name: 'Dairy' })],
      });
      expect(updateListCategory(state, 'dairy', '  ')).toBe(state);
      expect(updateListCategory(state, 'nope', 'X')).toBe(state);
    });
  });

  describe('removeListCategory', () => {
    it('removes the category by id from the catalog and strips it off every item', () => {
      const state = mockStorageState({
        categories: [
          mockCategory({ id: 'dairy', name: 'Dairy' }),
          mockCategory({ id: 'fresh', name: 'Fresh' }),
        ],
        items: [mockStorageItem({ categoryIds: ['dairy', 'fresh'] })],
      });
      const result = removeListCategory(state, 'dairy');
      expect(result.categories.map((c) => c.name)).toEqual(['Fresh']);
      expect(result.items[0].categoryIds).toEqual(['fresh']);
    });
  });

  describe('updatedSearchQuery', () => {
    it('keeps the query when the item name still contains it', () => {
      expect(updatedSearchQuery(mockStorageItem({ name: 'Milk' }), 'Mil')).toBe(
        'Mil'
      );
    });

    it('keeps the query on a case-insensitive match (matching the list filter)', () => {
      expect(updatedSearchQuery(mockStorageItem({ name: 'Brot' }), 'b')).toBe(
        'b'
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
      expect(listIdByPrefix('[Products] Add Item')).toBe('_products');
      expect(listIdByPrefix('[Tasks] Add Item')).toBe('_tasks');
    });

    it('throws for an unknown prefix', () => {
      expect(() => listIdByPrefix('[Unknown]')).toThrow();
    });
  });

  describe('stateByListId / searchQueryByListId / filterByByListId', () => {
    const appState = mockGroceryLists({
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
      const state = mockGroceryLists({
        storage: mockStorageState({
          searchQuery: 'Milk',
          mode: 'alphabetical',
        }),
      });
      const result = updateQuickAddState(state, '_storage');
      expect(result.searchQuery).toBe('Milk');
      expect(result.color).toBe('primary');
      expect(result.canAddLocal).toBe(true);
      expect(result.canAddProduct).toBe(true);
      expect(result.canAddCategory).toBe(false);
    });

    it('disallows adding a local item that already exists exactly', () => {
      const state = mockGroceryLists({
        storage: mockStorageState({
          searchQuery: 'Milk',
          items: [mockStorageItem({ name: 'Milk' })],
        }),
      });
      expect(updateQuickAddState(state, '_storage').canAddLocal).toBe(false);
    });

    it('offers category creation in categories mode', () => {
      const state = mockGroceryLists({
        storage: mockStorageState({ searchQuery: 'Dairy', mode: 'categories' }),
      });
      const result = updateQuickAddState(state, '_storage');
      expect(result.canAddCategory).toBe(true);
      expect(result.canAddLocal).toBe(false);
    });

    it('never offers a global item for the globals or tasks list', () => {
      const productsState = mockGroceryLists({
        products: mockStorageState({ searchQuery: 'Milk' }) as never,
      });
      expect(
        updateQuickAddState(productsState, '_products').canAddProduct
      ).toBe(false);
    });

    it('shows nothing for an empty search', () => {
      const state = mockGroceryLists({
        storage: mockStorageState({ searchQuery: ' '.repeat(3) }),
      });
      const result = updateQuickAddState(state, '_storage');
      expect(result.canAddLocal).toBe(false);
      expect(result.canAddProduct).toBe(false);
    });
  });
});
