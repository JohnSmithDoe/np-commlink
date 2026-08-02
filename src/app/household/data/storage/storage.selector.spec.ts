import { selectStorageItems, selectStorageState } from './storage.selector';
import {
  mockHouseholdState,
  mockStorageItem,
  mockStorageState,
} from '../../testing/household.test-data';

describe('storage.selector', () => {
  it('selects the storage feature slice', () => {
    const lists = mockHouseholdState();
    expect(selectStorageState({ household: lists })).toBe(lists.storage);
  });

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
