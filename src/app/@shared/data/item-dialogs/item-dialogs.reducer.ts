import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { createReducer, on } from '@ngrx/store';
import {
  IBaseItem,
  IItemDialogState,
  TCategoryId,
  TItemDialogsState,
  TEditItemMode,
  TItemListId,
} from '../../types';
import { createBaseItem } from '../../util/app.factory';
import { CategoriesActions, ItemDialogsActions } from './item-dialogs.actions';

export const initialItemDialogs: TItemDialogsState = {
  isEditing: false,
  item: createBaseItem('initial'),
  listId: '_storage',
  category: {
    isEditing: false,
  },
  addToAdditionalList: undefined,
};

// The kernel reducer is now just the domain-blind OPEN-command (which item, on
// which list, with what labels) + the category-RENAME dialog. The per-keystroke
// item draft + the category-selection working copy left for the feature
// wrappers / the pure-ui categories-dialog (dialog refactor).
export const itemDialogsReducer = createReducer(
  initialItemDialogs,
  on(
    ItemDialogsActions.showEditDialog,
    (state, { item, listId, additional, editMode }): TItemDialogsState => {
      return showEditDialog(state, { ...item }, editMode, listId, additional);
    }
  ),
  on(ItemDialogsActions.hideDialog, (state): TItemDialogsState => {
    return { ...state, isEditing: false };
  }),

  // Category name dialog (opened from the list's categories display mode).
  on(
    CategoriesActions.showEditDialog,
    (state, { name, listId, id }): TItemDialogsState => {
      return showEditCategoryDialog(state, name, listId, id);
    }
  ),
  on(CategoriesActions.confirmEditChanges, (state): TItemDialogsState => {
    return {
      ...state,
      category: {
        ...state.category,
        isEditing: false,
      },
    };
  }),
  on(CategoriesActions.abortEditChanges, (state): TItemDialogsState => {
    return {
      ...state,
      category: {
        id: undefined,
        name: undefined,
        isEditing: false,
      },
    };
  }),
  on(CategoriesActions.updateCategory, (state, { name }): TItemDialogsState => {
    return {
      ...state,
      category: {
        ...state.category,
        name,
      },
    };
  })
);

const showEditDialog = <R extends IBaseItem>(
  state: IItemDialogState<R>,
  item: R,
  editMode: TEditItemMode,
  listId: TItemListId,
  additional?: TItemListId
): IItemDialogState<R> => {
  const saveButtonText =
    editMode === 'update'
      ? marker('grocery.edit.item.dialog.button.update')
      : marker('grocery.edit.item.dialog.button.create');

  const dialogTitle =
    editMode === 'update'
      ? marker('grocery.edit.item.dialog.title.update')
      : marker('grocery.edit.item.dialog.title.create');

  return {
    ...state,
    isEditing: true,
    item,
    editMode,
    saveButtonText,
    dialogTitle,
    listId,
    addToAdditionalList: additional,
  };
};

const showEditCategoryDialog = <R extends IBaseItem>(
  state: IItemDialogState<R>,
  name: string,
  listId: TItemListId,
  id?: TCategoryId
): IItemDialogState<R> => {
  // An existing id = rename; no id = create a new category from the seed name.
  const editMode: TEditItemMode = id ? 'update' : 'create';
  const saveButtonText =
    editMode === 'update'
      ? marker('grocery.edit.item.dialog.button.update')
      : marker('grocery.edit.item.dialog.button.create');

  const dialogTitle =
    editMode === 'update'
      ? marker('grocery.edit.category.dialog.title.update')
      : marker('grocery.edit.category.dialog.title.create');

  return {
    ...state,
    editMode,
    saveButtonText,
    dialogTitle,
    listId,
    category: {
      id,
      name,
      isEditing: true,
    },
  };
};
