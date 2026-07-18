import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { createReducer, on } from '@ngrx/store';
import {
  IBaseItem,
  IItemDialogState,
  TItemDialogsState,
  TEditItemMode,
  TItemListCategory,
  TItemListId,
} from '../../types';
import { createBaseItem } from '../../util/app.factory';
import { matchingTxt } from '../../util/app.utils';
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
    (state, { item, listId, additional }): TItemDialogsState => {
      return showEditDialog(
        state,
        { ...item },
        item ? 'update' : 'create',
        listId,
        additional
      );
    }
  ),
  on(ItemDialogsActions.hideDialog, (state): TItemDialogsState => {
    return { ...state, isEditing: false };
  }),

  // Category rename (opened from the list's categories display mode).
  on(
    CategoriesActions.showEditDialog,
    (state, { category, listId }): TItemDialogsState => {
      return showEditCategoryDialog(state, category, listId);
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
        ...state.category,
        editItem: undefined,
        original: undefined,
        isEditing: false,
      },
    };
  }),
  on(
    CategoriesActions.updateCategory,
    (state, { category }): TItemDialogsState => {
      return {
        ...state,
        category: {
          ...state.category,
          editItem: category,
        },
      };
    }
  )
);

const showEditDialog = <R extends IBaseItem>(
  state: IItemDialogState<R>,
  item: R,
  editMode: TEditItemMode,
  listId: TItemListId,
  additional?: TItemListId
): IItemDialogState<R> => {
  const saveButtonText = item
    ? marker('grocery.edit.item.dialog.button.update')
    : marker('grocery.edit.item.dialog.button.create');

  const dialogTitle = item
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
  original: TItemListCategory,
  listId: TItemListId
): IItemDialogState<R> => {
  const editMode: TEditItemMode = !!matchingTxt(original).length
    ? 'update'
    : 'create';
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
      ...state.category,
      original,
      editItem: original,
      isEditing: true,
    },
  };
};
