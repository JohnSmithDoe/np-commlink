import {
  selectAllCategories,
  selectCategories,
  selectContainsSearchResult,
  selectEditItem,
  selectSelectedCategories,
} from './item-dialogs.selector';
import {
  mockCategoriesState,
  mockItemDialogsState,
  mockStorageItem,
} from '../../testing/test-data';

describe('dialogs.selector', () => {
  it('selectEditItem returns the item being edited', () => {
    const item = mockStorageItem({ id: 'x', name: 'Milk' });
    const state = mockItemDialogsState({ item });
    expect(selectEditItem.projector(state)).toBe(item);
  });

  it('selectAllCategories returns all categories', () => {
    const state = mockItemDialogsState({
      category: mockCategoriesState({ categories: ['Dairy', 'Fresh'] }),
    });
    expect(selectAllCategories.projector(state)).toEqual(['Dairy', 'Fresh']);
  });

  it('selectSelectedCategories returns the current selection', () => {
    const state = mockItemDialogsState({
      category: mockCategoriesState({ selection: ['Dairy'] }),
    });
    expect(selectSelectedCategories.projector(state)).toEqual(['Dairy']);
  });

  describe('selectCategories', () => {
    it('returns all categories when there is no search query', () => {
      const state = mockItemDialogsState({
        category: mockCategoriesState({ categories: ['Dairy', 'Fresh'] }),
      });
      expect(selectCategories.projector(state, ['Dairy', 'Fresh'])).toEqual([
        'Dairy',
        'Fresh',
      ]);
    });

    it('filters the categories by the search query', () => {
      const state = mockItemDialogsState({
        category: mockCategoriesState({
          categories: ['Dairy', 'Fresh'],
          selection: ['Dairy'],
          searchQuery: 'Dai',
        }),
      });
      expect(selectCategories.projector(state, ['Dairy', 'Fresh'])).toEqual([
        'Dairy',
      ]);
    });
  });

  describe('selectContainsSearchResult', () => {
    it('is truthy when the search query matches a category exactly', () => {
      const state = mockItemDialogsState({
        category: mockCategoriesState({
          categories: ['Dairy', 'Fresh'],
          searchQuery: 'Dairy',
        }),
      });
      expect(selectContainsSearchResult.projector(state, ['Dairy'])).toBe(true);
    });

    it('is falsy without a matching search query', () => {
      const state = mockItemDialogsState({
        category: mockCategoriesState({
          categories: ['Dairy', 'Fresh'],
          searchQuery: 'Zzz',
        }),
      });
      expect(selectContainsSearchResult.projector(state, [])).toBe(false);
    });
  });
});
