import { CategoriesActions, ItemDialogsActions } from './item-dialogs.actions';
import { itemDialogsReducer, initialItemDialogs } from './item-dialogs.reducer';
import { mockBaseItem, mockItemDialogsState } from '../../testing/test-data';

describe('itemDialogsReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = itemDialogsReducer(initialItemDialogs, {
      type: 'noop',
    } as never);
    expect(state).toBe(initialItemDialogs);
  });

  describe('open-command', () => {
    it('opens the edit dialog with the item, edit mode and additional list', () => {
      const item = mockBaseItem({ id: 'x', name: 'Milk' });
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

    it('stops editing on hideDialog', () => {
      const start = mockItemDialogsState({ isEditing: true });
      expect(
        itemDialogsReducer(start, ItemDialogsActions.hideDialog()).isEditing
      ).toBe(false);
    });
  });

  describe('category rename dialog', () => {
    it('opens the category rename dialog with original and editItem', () => {
      const start = mockItemDialogsState();
      const state = itemDialogsReducer(
        start,
        CategoriesActions.showEditDialog('Dairy', '_storage')
      );
      expect(state.category.isEditing).toBe(true);
      expect(state.category.original).toBe('Dairy');
      expect(state.category.editItem).toBe('Dairy');
    });

    it('tracks the edited category name', () => {
      const start = mockItemDialogsState();
      const state = itemDialogsReducer(
        start,
        CategoriesActions.updateCategory('Fridge')
      );
      expect(state.category.editItem).toBe('Fridge');
    });

    it('stops category editing on confirmEditChanges and abortEditChanges', () => {
      const start = mockItemDialogsState({
        category: { isEditing: true, original: 'Dairy', editItem: 'Fridge' },
      });
      expect(
        itemDialogsReducer(start, CategoriesActions.confirmEditChanges())
          .category.isEditing
      ).toBe(false);
      const aborted = itemDialogsReducer(
        start,
        CategoriesActions.abortEditChanges()
      ).category;
      expect(aborted.isEditing).toBe(false);
      expect(aborted.editItem).toBeUndefined();
      expect(aborted.original).toBeUndefined();
    });
  });
});
