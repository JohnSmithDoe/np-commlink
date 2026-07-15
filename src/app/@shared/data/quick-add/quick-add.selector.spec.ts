import {
  selectQuickAddCanAddCategory,
  selectQuickAddCanAddProduct,
  selectQuickAddCanAddLocal,
} from './quick-add.selector';
import { mockListSettings, mockQuickAddState } from '../../testing/test-data';

describe('quick-add.selector', () => {
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

  describe('selectQuickAddCanAddCategory', () => {
    it('is true only when the item allows it and the setting is on', () => {
      expect(
        selectQuickAddCanAddCategory.projector(
          mockQuickAddState({ canAddCategory: true }),
          mockListSettings({ showQuickAddCategory: true })
        )
      ).toBe(true);
    });

    it('is false when the setting is off', () => {
      expect(
        selectQuickAddCanAddCategory.projector(
          mockQuickAddState({ canAddCategory: true }),
          mockListSettings({ showQuickAddCategory: false })
        )
      ).toBe(false);
    });
  });
});
