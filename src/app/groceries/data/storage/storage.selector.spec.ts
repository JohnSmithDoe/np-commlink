import { selectStorageItems, selectStorageState } from './storage.selector';
import {
  mockGroceriesState,
  mockStorageItem,
  mockStorageState,
} from '../../testing/groceries.test-data';

describe('storage.selector', () => {
  it('selects the storage feature slice', () => {
    const lists = mockGroceriesState();
    expect(selectStorageState({ groceries: lists })).toBe(lists.storage);
  });

  // The property the edit dialog's duplicate-name rule rests on. The page's own
  // view (`selectListItems`, exercised in grocery-list.selector.spec) applies both
  // of these; the aggregate read must not, or a filter left on the page would
  // shrink the sibling set and let a duplicate save.
  describe('selectStorageItems', () => {
    it('ignores the page search query and category filter', () => {
      const state = mockStorageState({
        searchQuery: 'Bread',
        filterBy: 'dairy',
        items: [
          mockStorageItem({ id: 'a', name: 'Milk', categoryIds: ['dairy'] }),
          mockStorageItem({ id: 'b', name: 'Bread' }),
        ],
      });

      expect(
        selectStorageItems.projector(state).map(({ name }) => name)
      ).toEqual(['Milk', 'Bread']);
    });
  });
});
