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
import { createGlobalItem, createStorageItem } from '../../util/item.factory';
import { matchingTxt } from '../../util/app.utils';
import { ApplicationActions } from '../application.actions';
import { CategoriesActions, ItemDialogsActions } from './item-dialogs.actions';

export const initialItemDialogs: TItemDialogsState = {
  isEditing: false,
  item: createStorageItem('initial'),
  listId: '_storage',
  category: {
    categories: [],
    selection: [],
    isSelecting: false,
    isEditing: false,
  },
  addToAdditionalList: undefined,
};

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
  on(ItemDialogsActions.updateItem, (state, { data }): TItemDialogsState => {
    return { ...state, item: { ...state.item, ...data } };
  }),
  on(
    ItemDialogsActions.removeCategory,
    (state, { category }): TItemDialogsState => {
      return {
        ...state,
        item: {
          ...state.item,
          category: state.item.category?.filter((cat) => cat !== category),
        },
      };
    }
  ),
  on(ItemDialogsActions.hideDialog, (state): TItemDialogsState => {
    return { ...state, isEditing: false };
  }),
  on(ItemDialogsActions.confirmChanges, (state): TItemDialogsState => {
    return { ...state, isEditing: false };
  }),
  on(ItemDialogsActions.abortChanges, (state): TItemDialogsState => {
    return { ...state, isEditing: false };
  }),

  on(
    CategoriesActions.addCategory,
    (state, { category }): TItemDialogsState => {
      if (!!category.length && !state.category.categories.includes(category)) {
        return {
          ...state,
          category: {
            ...state.category,
            categories: [category, ...state.category.categories],
            selection: [category, ...state.category.selection],
            searchQuery: undefined,
          },
        };
      }
      return state;
    }
  ),

  on(
    CategoriesActions.removeCategory,
    (state, { category }): TItemDialogsState => {
      const categoryIdx = state.category.selection.indexOf(category);
      if (categoryIdx >= 0) {
        const selection = [...state.category.selection].splice(categoryIdx, 1);
        return {
          ...state,
          category: {
            ...state.category,
            selection,
          },
        };
      }
      return state;
    }
  ),

  on(
    CategoriesActions.updateSelection,
    (state, { item, categories }): TItemDialogsState => {
      const allCategories = [
        ...new Set([...categories, ...(item?.category ?? [])]),
      ].filter((cat) => !!cat.length);
      return {
        ...state,
        category: {
          ...state.category,
          categories: allCategories,
          selection: item?.category ?? [],
          isSelecting: true,
        },
      };
    }
  ),
  on(CategoriesActions.showDialog, (state): TItemDialogsState => {
    return {
      ...state,
      category: {
        ...state.category,
        isSelecting: true,
      },
    };
  }),
  on(CategoriesActions.confirmChanges, (state): TItemDialogsState => {
    return {
      ...state,
      category: {
        ...state.category,
        isSelecting: false,
      },
    };
  }),
  on(CategoriesActions.abortChanges, (state): TItemDialogsState => {
    return {
      ...state,
      category: {
        ...state.category,
        isSelecting: false,
      },
    };
  }),

  on(
    CategoriesActions.toggleCategory,
    (state, { category }): TItemDialogsState => {
      if (state.category.selection.includes(category)) {
        const selection = state.category.selection.filter(
          (item) => item !== category
        );
        return {
          ...state,
          category: {
            ...state.category,
            selection,
          },
        };
      } else {
        return {
          ...state,
          category: {
            ...state.category,
            selection: [category, ...state.category.selection],
          },
        };
      }
    }
  ),

  on(
    CategoriesActions.updateSearchQuery,
    (state, { query }): TItemDialogsState => {
      return {
        ...state,
        category: {
          ...state.category,
          searchQuery: query,
        },
      };
    }
  ),

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
  ),

  // NEW (merge): barcode scanner → open the global-item edit dialog prefilled
  // with the scanned EAN as the initial name; keep the raw code on the state.
  on(
    ItemDialogsActions.openEditGlobalItem,
    (state, { scannedEan }): TItemDialogsState => ({
      ...showEditDialog(
        state,
        createGlobalItem(scannedEan),
        'create',
        '_globals'
      ),
      scannedEan,
    })
  ),

  on(ApplicationActions.loadedSuccessfully, (_state): TItemDialogsState => {
    return _state;
  })
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
