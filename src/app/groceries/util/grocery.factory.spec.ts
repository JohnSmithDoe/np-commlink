import {
  createProduct,
  createProductFrom,
  createShoppingItem,
  createShoppingItemFromProduct,
  createShoppingItemFromStorage,
  createStorageItem,
  createStorageItemFromProduct,
  createStorageItemFromShopping,
} from './grocery.factory';
import {
  mockProduct,
  mockShoppingItem,
  mockStorageItem,
} from '../testing/groceries.test-data';

describe('grocery.factory', () => {
  describe('createStorageItem', () => {
    it('defaults the quantity to 1', () => {
      expect(createStorageItem('Milk').quantity).toBe(1);
    });

    it('accepts a quantity and best-before date', () => {
      const item = createStorageItem('Milk', 'dairy', 3, '2024-05-01');
      expect(item.quantity).toBe(3);
      expect(item.bestBefore).toBe('2024-05-01');
      expect(item.categoryIds).toEqual(['dairy']);
    });
  });

  describe('createStorageItemFromProduct', () => {
    it('does not set a best-before for a "forever" item', () => {
      const global = mockProduct({ bestBeforeTimespan: 'forever' });
      expect(createStorageItemFromProduct(global).bestBefore).toBeUndefined();
    });

    it('computes a best-before date for a time-limited item', () => {
      const global = mockProduct({
        bestBeforeTimespan: 'days',
        bestBeforeTimevalue: 5,
      });
      const item = createStorageItemFromProduct(global, 2);
      expect(item.bestBefore).toBeTruthy();
      expect(item.quantity).toBe(2);
      expect(item.name).toBe(global.name);
    });
  });

  describe('createStorageItemFromShopping', () => {
    it('copies name/category ids and applies the quantity', () => {
      const shopping = mockShoppingItem({
        name: 'Bread',
        categoryIds: ['bakery'],
      });
      const item = createStorageItemFromShopping(shopping, 4);
      expect(item.name).toBe('Bread');
      expect(item.categoryIds).toEqual(['bakery']);
      expect(item.quantity).toBe(4);
    });
  });

  // Buy it, then move the bought rows to the pantry: the common path a product
  // takes into storage, and the one the recipe matcher's id-based half depends
  // on surviving.
  describe('the catalog link, across every copy', () => {
    const product = mockProduct({ id: 'p-milk', name: 'Milk' });

    it('is stamped when a row is created from a product', () => {
      expect(createStorageItemFromProduct(product).productId).toBe('p-milk');
      expect(createShoppingItemFromProduct(product).productId).toBe('p-milk');
    });

    it('survives product → shopping → storage', () => {
      const bought = createShoppingItemFromProduct(product);

      expect(createStorageItemFromShopping(bought).productId).toBe('p-milk');
    });

    it('survives storage → shopping (running out, re-buying)', () => {
      const stocked = createStorageItemFromProduct(product);

      expect(createShoppingItemFromStorage(stocked).productId).toBe('p-milk');
    });

    // An absent link must stay an ABSENT key, not a present-but-empty one:
    // IndexedDB persists `undefined` values where JSON would drop them.
    it('leaves no key at all on a row that never had a product', () => {
      const typed = createStorageItemFromShopping(
        mockShoppingItem({ name: 'Bread' })
      );

      expect('productId' in typed).toBe(false);
    });
  });

  describe('shopping factories', () => {
    it('createShoppingItem defaults to an active item with quantity 1', () => {
      const item = createShoppingItem('Bread');
      expect(item.state).toBe('active');
      expect(item.quantity).toBe(1);
    });

    it('createShoppingItemFromProduct / FromStorage copy the source', () => {
      expect(
        createShoppingItemFromProduct(mockProduct({ name: 'Sugar' })).name
      ).toBe('Sugar');
      expect(
        createShoppingItemFromStorage(mockStorageItem({ name: 'Milk' }), 2)
          .quantity
      ).toBe(2);
    });
  });

  describe('createProduct', () => {
    it('creates a loose, piece-based, forever item', () => {
      const item = createProduct('Sugar', 'baking');
      expect(item.unit).toBe('pieces');
      expect(item.packaging).toBe('loose');
      expect(item.bestBeforeTimespan).toBe('forever');
      expect(item.bestBeforeTimevalue).toBe(1);
      expect(item.categoryIds).toEqual(['baking']);
    });

    it('createProductFrom reuses name and category ids of the source', () => {
      const item = createProductFrom(
        mockStorageItem({ name: 'Milk', categoryIds: ['dairy'] })
      );
      expect(item.name).toBe('Milk');
      expect(item.categoryIds).toEqual(['dairy']);
      expect(item.unit).toBe('pieces');
    });
  });
});
