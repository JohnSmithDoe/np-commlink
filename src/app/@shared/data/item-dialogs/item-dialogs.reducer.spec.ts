import { IStorageItem } from '../../types';
import { CategoriesActions, ItemDialogsActions } from './item-dialogs.actions';
import { itemDialogsReducer, initialItemDialogs } from './item-dialogs.reducer';
import {
  mockCategoriesState,
  mockItemDialogsState,
  mockStorageItem,
} from '../../testing/test-data';

describe('itemDialogsReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = itemDialogsReducer(initialItemDialogs, {
      type: 'noop',
    } as never);
    expect(state).toBe(initialItemDialogs);
  });

  describe('item dialog', () => {
    it('opens the edit dialog with the item, edit mode and additional list', () => {
      const item = mockStorageItem({ id: 'x', name: 'Milk' });
      const state = itemDialogsReducer(
        initialItemDialogs,
        ItemDialogsActions.showEditDialog(item, '_storage', '_shopping')
      );
      expect(state.isEditing).toBe(true);
      expect(state.item).toEqual(item);
      expect(state.editMode).toBe('update');
      expect(state.listId).toBe('_storage');
      expect(state.addToAdditionalList).toBe('_shopping');
    });

    it('merges the updated data into the edited item', () => {
      const start = mockItemDialogsState({
        item: mockStorageItem({ id: 'x', name: 'Milk', quantity: 1 }),
      });
      const state = itemDialogsReducer(
        start,
        ItemDialogsActions.updateItem({ quantity: 5 })
      );
      expect((state.item as IStorageItem).quantity).toBe(5);
      expect(state.item.name).toBe('Milk');
    });

    it('stops editing on hideDialog, confirmChanges and abortChanges', () => {
      const start = mockItemDialogsState({ isEditing: true });
      expect(
        itemDialogsReducer(start, ItemDialogsActions.hideDialog()).isEditing
      ).toBe(false);
      expect(
        itemDialogsReducer(start, ItemDialogsActions.confirmChanges()).isEditing
      ).toBe(false);
      expect(
        itemDialogsReducer(start, ItemDialogsActions.abortChanges()).isEditing
      ).toBe(false);
    });
  });

  describe('category selection', () => {
    it('prepends a new category to categories and selection', () => {
      const start = mockItemDialogsState({
        category: mockCategoriesState({
          categories: ['Dairy'],
          selection: ['Dairy'],
          searchQuery: 'Fr',
        }),
      });
      const state = itemDialogsReducer(
        start,
        CategoriesActions.addCategory('Fresh')
      );
      expect(state.category.categories).toEqual(['Fresh', 'Dairy']);
      expect(state.category.selection).toEqual(['Fresh', 'Dairy']);
      expect(state.category.searchQuery).toBeUndefined();
    });

    it('does not add a blank category', () => {
      const start = mockItemDialogsState({
        category: mockCategoriesState({ categories: ['Dairy'] }),
      });
      expect(itemDialogsReducer(start, CategoriesActions.addCategory(''))).toBe(
        start
      );
    });

    it('does not add a category that already exists', () => {
      const start = mockItemDialogsState({
        category: mockCategoriesState({ categories: ['Dairy'] }),
      });
      expect(
        itemDialogsReducer(start, CategoriesActions.addCategory('Dairy'))
      ).toBe(start);
    });

    it('adds a category to the selection when toggled on', () => {
      const start = mockItemDialogsState({
        category: mockCategoriesState({ selection: [] }),
      });
      const state = itemDialogsReducer(
        start,
        CategoriesActions.toggleCategory('Dairy')
      );
      expect(state.category.selection).toEqual(['Dairy']);
    });

    it('removes a category from the selection when toggled off', () => {
      const start = mockItemDialogsState({
        category: mockCategoriesState({ selection: ['Dairy', 'Fresh'] }),
      });
      const state = itemDialogsReducer(
        start,
        CategoriesActions.toggleCategory('Dairy')
      );
      expect(state.category.selection).toEqual(['Fresh']);
    });

    it('updates the category search query', () => {
      const start = mockItemDialogsState();
      const state = itemDialogsReducer(
        start,
        CategoriesActions.updateSearchQuery('Dai')
      );
      expect(state.category.searchQuery).toBe('Dai');
    });
  });

  describe('category edit dialog', () => {
    it('opens the category edit dialog with original and editItem', () => {
      const start = mockItemDialogsState();
      const state = itemDialogsReducer(
        start,
        CategoriesActions.showEditDialog('Dairy', '_storage')
      );
      expect(state.category.isEditing).toBe(true);
      expect(state.category.original).toBe('Dairy');
      expect(state.category.editItem).toBe('Dairy');
    });

    it('stops category editing on confirmEditChanges and abortEditChanges', () => {
      const start = mockItemDialogsState({
        category: mockCategoriesState({ isEditing: true }),
      });
      expect(
        itemDialogsReducer(start, CategoriesActions.confirmEditChanges())
          .category.isEditing
      ).toBe(false);
      expect(
        itemDialogsReducer(start, CategoriesActions.abortEditChanges()).category
          .isEditing
      ).toBe(false);
    });
  });
});
