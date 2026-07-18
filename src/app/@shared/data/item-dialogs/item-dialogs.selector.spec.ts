import { selectCategoriesState, selectEditItem } from './item-dialogs.selector';
import { mockItemDialogsState, mockBaseItem } from '../../testing/test-data';

describe('item-dialogs.selector', () => {
  it('selectEditItem returns the item being edited', () => {
    const item = mockBaseItem({ id: 'x', name: 'Milk' });
    const state = mockItemDialogsState({ item });
    expect(selectEditItem.projector(state)).toBe(item);
  });

  it('selectCategoriesState returns the category rename state', () => {
    const state = mockItemDialogsState({
      category: { isEditing: true, original: 'Dairy', editItem: 'Fridge' },
    });
    expect(selectCategoriesState.projector(state)).toEqual({
      isEditing: true,
      original: 'Dairy',
      editItem: 'Fridge',
    });
  });
});
