import {
  selectQuickAddCanAddCategory,
  selectQuickAddCanAddGlobal,
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

  describe('selectQuickAddCanAddGlobal', () => {
    it('is true only when the item allows it and the setting is on', () => {
      expect(
        selectQuickAddCanAddGlobal.projector(
          mockQuickAddState({ canAddGlobal: true }),
          mockListSettings({ showQuickAddGlobal: true })
        )
      ).toBe(true);
    });

    it('is false when the setting is off', () => {
      expect(
        selectQuickAddCanAddGlobal.projector(
          mockQuickAddState({ canAddGlobal: true }),
          mockListSettings({ showQuickAddGlobal: false })
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
