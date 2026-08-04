import { Category } from '../../model/category.types';
import { ItemListId } from '../../model/item-list.types';
import { createCategory } from '../../util/app.factory';
import { ItemDialogService } from '../item-lists/item-dialog.service';

export const openCategoryCreate = (
  dialogs: ItemDialogService,
  listId: ItemListId,
  searchQuery?: string
): void =>
  dialogs.open({
    item: createCategory(searchQuery ?? ''),
    listId,
    editMode: 'create',
  });

export const openCategoryEdit = (
  dialogs: ItemDialogService,
  listId: ItemListId,
  category: Category
): void => dialogs.open({ item: category, listId, editMode: 'update' });
