import {
  selectQuickAddCanAddLocal,
  selectQuickAddCanAddProduct,
  selectQuickAddState,
} from './quick-add.selector';
import {
  mockGroceriesState,
  mockListSettings,
  mockProduct,
  mockProductsState,
  mockQuickAddState,
  mockStorageItem,
  mockStorageState,
} from '../../testing/groceries.test-data';

describe('quick-add.selector', () => {
  // The row's state is DERIVED now — it used to be a slice written by an effect
  // that had to enumerate every mutation able to change it, so these pin that the
  // projection reads the live grocery state instead of a stored copy.
  describe('selectQuickAddState', () => {
    it('offers a local add for a query no row in the list matches', () => {
      const state = mockGroceriesState({
        storage: mockStorageState({ searchQuery: 'Milk', items: [] }),
      });

      expect(selectQuickAddState.projector(state, '_storage')).toMatchObject({
        searchQuery: 'Milk',
        canAddLocal: true,
      });
    });

    it('withholds it once the list already holds that exact name', () => {
      const state = mockGroceriesState({
        storage: mockStorageState({
          searchQuery: 'Milk',
          items: [mockStorageItem({ name: 'Milk' })],
        }),
      });

      expect(selectQuickAddState.projector(state, '_storage').canAddLocal).toBe(
        false
      );
    });

    it('offers a product add only from a list that is not the catalog', () => {
      const state = mockGroceriesState({
        storage: mockStorageState({ searchQuery: 'Milk' }),
        products: mockProductsState({ searchQuery: 'Milk', items: [] }),
      });

      expect(
        selectQuickAddState.projector(state, '_storage').canAddProduct
      ).toBe(true);
      expect(
        selectQuickAddState.projector(state, '_products').canAddProduct
      ).toBe(false);
    });

    it('withholds the product add when the catalog already has the name', () => {
      const state = mockGroceriesState({
        storage: mockStorageState({ searchQuery: 'Milk' }),
        products: mockProductsState({ items: [mockProduct({ name: 'Milk' })] }),
      });

      expect(
        selectQuickAddState.projector(state, '_storage').canAddProduct
      ).toBe(false);
    });

    it('offers nothing for a blank query', () => {
      const state = mockGroceriesState({
        storage: mockStorageState({ searchQuery: ' '.repeat(3) }),
      });

      expect(selectQuickAddState.projector(state, '_storage')).toMatchObject({
        canAddLocal: false,
        canAddProduct: false,
      });
    });
  });

  describe('selectQuickAddCanAddLocal', () => {
    it('is true only when the item allows it and the setting is on', () => {
      expect(
        selectQuickAddCanAddLocal.projector(
          mockQuickAddState({ canAddLocal: true }),
          mockListSettings({ showQuickAdd: true })
        )
      ).toBe(true);
    });

    it('is false when the setting is off', () => {
      expect(
        selectQuickAddCanAddLocal.projector(
          mockQuickAddState({ canAddLocal: true }),
          mockListSettings({ showQuickAdd: false })
        )
      ).toBe(false);
    });

    it('is false when the item does not allow it', () => {
      expect(
        selectQuickAddCanAddLocal.projector(
          mockQuickAddState({ canAddLocal: false }),
          mockListSettings({ showQuickAdd: true })
        )
      ).toBe(false);
    });
  });

  describe('selectQuickAddCanAddProduct', () => {
    it('is true only when the item allows it and the setting is on', () => {
      expect(
        selectQuickAddCanAddProduct.projector(
          mockQuickAddState({ canAddProduct: true }),
          mockListSettings({ showQuickAddProduct: true })
        )
      ).toBe(true);
    });

    it('is false when the setting is off', () => {
      expect(
        selectQuickAddCanAddProduct.projector(
          mockQuickAddState({ canAddProduct: true }),
          mockListSettings({ showQuickAddProduct: false })
        )
      ).toBe(false);
    });
  });
});
