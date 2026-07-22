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

    it('opens in create mode with the create labels when editMode is create', () => {
      const item = mockBaseItem({ id: 'new', name: 'Milk' });
      const state = itemDialogsReducer(
        initialItemDialogs,
        ItemDialogsActions.showEditDialog(item, '_storage', undefined, 'create')
      );
      expect(state.editMode).toBe('create');
      expect(state.saveButtonText).toBe(
        'grocery.edit.item.dialog.button.create'
      );
      expect(state.dialogTitle).toBe('grocery.edit.item.dialog.title.create');
    });

    it('stops editing on hideDialog', () => {
      const start = mockItemDialogsState({ isEditing: true });
      expect(
        itemDialogsReducer(start, ItemDialogsActions.hideDialog()).isEditing
      ).toBe(false);
    });
  });

  describe('category edit dialog', () => {
    it('opens in create mode (no id) seeded with the working name', () => {
      const start = mockItemDialogsState();
      const state = itemDialogsReducer(
        start,
        CategoriesActions.showEditDialog('Dairy', '_storage')
      );
      expect(state.category.isEditing).toBe(true);
      expect(state.category.name).toBe('Dairy');
      expect(state.category.id).toBeUndefined();
      expect(state.editMode).toBe('create');
      expect(state.listId).toBe('_storage');
    });

    it('opens in rename mode when a category id is passed', () => {
      const start = mockItemDialogsState();
      const state = itemDialogsReducer(
        start,
        CategoriesActions.showEditDialog('Dairy', '_storage', 'cat-1')
      );
      expect(state.category.isEditing).toBe(true);
      expect(state.category.name).toBe('Dairy');
      expect(state.category.id).toBe('cat-1');
      expect(state.editMode).toBe('update');
    });

    it('tracks the edited category name', () => {
      const start = mockItemDialogsState();
      const state = itemDialogsReducer(
        start,
        CategoriesActions.updateCategory('Fridge')
      );
      expect(state.category.name).toBe('Fridge');
    });

    it('stops category editing on confirmEditChanges and abortEditChanges', () => {
      const start = mockItemDialogsState({
        category: { isEditing: true, id: 'cat-1', name: 'Fridge' },
      });
      // confirm keeps the id/name but flips editing off
      const confirmed = itemDialogsReducer(
        start,
        CategoriesActions.confirmEditChanges()
      ).category;
      expect(confirmed.isEditing).toBe(false);
      expect(confirmed.id).toBe('cat-1');
      // abort resets the working copy entirely
      const aborted = itemDialogsReducer(
        start,
        CategoriesActions.abortEditChanges()
      ).category;
      expect(aborted.isEditing).toBe(false);
      expect(aborted.name).toBeUndefined();
      expect(aborted.id).toBeUndefined();
    });
  });
});
