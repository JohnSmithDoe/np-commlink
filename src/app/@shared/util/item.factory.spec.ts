import {
  createGlobalItem,
  createGlobalItemFrom,
  createShoppingItem,
  createShoppingItemFromGlobal,
  createShoppingItemFromStorage,
  createStorageItem,
  createStorageItemFromGlobal,
  createStorageItemFromShopping,
  createTaskItem,
} from './item.factory';
import {
  mockGlobalItem,
  mockShoppingItem,
  mockStorageItem,
} from '../testing/test-data';

describe('item.factory', () => {
  describe('createStorageItem', () => {
    it('defaults the quantity to 1', () => {
      expect(createStorageItem('Milk').quantity).toBe(1);
    });

    it('accepts a quantity and best-before date', () => {
      const item = createStorageItem('Milk', 'Dairy', 3, '2024-05-01');
      expect(item.quantity).toBe(3);
      expect(item.bestBefore).toBe('2024-05-01');
      expect(item.category).toEqual(['Dairy']);
    });
  });

  describe('createStorageItemFromGlobal', () => {
    it('does not set a best-before for a "forever" item', () => {
      const global = mockGlobalItem({ bestBeforeTimespan: 'forever' });
      expect(createStorageItemFromGlobal(global).bestBefore).toBeUndefined();
    });

    it('computes a best-before date for a time-limited item', () => {
      const global = mockGlobalItem({
        bestBeforeTimespan: 'days',
        bestBeforeTimevalue: 5,
      });
      const item = createStorageItemFromGlobal(global, 2);
      expect(item.bestBefore).toBeTruthy();
      expect(item.quantity).toBe(2);
      expect(item.name).toBe(global.name);
    });
  });

  describe('createStorageItemFromShopping', () => {
    it('copies name/category and applies the quantity', () => {
      const shopping = mockShoppingItem({
        name: 'Bread',
        category: ['Bakery'],
      });
      const item = createStorageItemFromShopping(shopping, 4);
      expect(item.name).toBe('Bread');
      expect(item.category).toEqual(['Bakery']);
      expect(item.quantity).toBe(4);
    });
  });

  describe('shopping factories', () => {
    it('createShoppingItem defaults to an active item with quantity 1', () => {
      const item = createShoppingItem('Bread');
      expect(item.state).toBe('active');
      expect(item.quantity).toBe(1);
    });

    it('createShoppingItemFromGlobal / FromStorage copy the source', () => {
      expect(
        createShoppingItemFromGlobal(mockGlobalItem({ name: 'Sugar' })).name
      ).toBe('Sugar');
      expect(
        createShoppingItemFromStorage(mockStorageItem({ name: 'Milk' }), 2)
          .quantity
      ).toBe(2);
    });
  });

  describe('createGlobalItem', () => {
    it('creates a loose, piece-based, forever item', () => {
      const item = createGlobalItem('Sugar', 'Baking');
      expect(item.unit).toBe('pieces');
      expect(item.packaging).toBe('loose');
      expect(item.bestBeforeTimespan).toBe('forever');
      expect(item.bestBeforeTimevalue).toBe(1);
      expect(item.category).toEqual(['Baking']);
    });

    it('createGlobalItemFrom reuses name and category of the source', () => {
      const item = createGlobalItemFrom(
        mockStorageItem({ name: 'Milk', category: ['Dairy'] })
      );
      expect(item.name).toBe('Milk');
      expect(item.category).toEqual(['Dairy']);
      expect(item.unit).toBe('pieces');
    });
  });

  describe('createTaskItem', () => {
    it('creates a task with an optional priority', () => {
      expect(createTaskItem('Clean').prio).toBeUndefined();
      expect(createTaskItem('Clean', 'Home', 5).prio).toBe(5);
    });
  });
});
