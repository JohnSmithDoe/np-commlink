import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { createReducer, on } from '@ngrx/store';
import {
  IBaseItem,
  IEditItemState,
  TDialogsState,
  TEditItemMode,
} from '../../../@shared/types';
import { applicationActions } from '../../../@shared/data/application.actions';
import { dialogsActions } from './dialogs.actions';

export const initialSettings: TDialogsState = {
  isEditing: false,
  item: undefined,
};

export const dialogsReducer = createReducer(
  initialSettings,
  on(dialogsActions.showEditDialog, (state, { item }): TDialogsState => {
    return showEditDialog(state, { ...item }, item ? 'update' : 'create');
  }),
  on(dialogsActions.updateItem, (state, { data }): TDialogsState => {
    if (!state.item) return state;
    return { ...state, item: { ...state.item, ...data } };
  }),
  on(dialogsActions.hideDialog, (state): TDialogsState => {
    return { ...state, isEditing: false };
  }),
  on(dialogsActions.confirmChanges, (state): TDialogsState => {
    return { ...state, isEditing: false };
  }),
  on(dialogsActions.abortChanges, (state): TDialogsState => {
    return { ...state, isEditing: false };
  }),

  on(applicationActions.loadedSuccessfully, (_state): TDialogsState => {
    return _state;
  })
);

const showEditDialog = <R extends IBaseItem>(
  state: IEditItemState<R>,
  item: R,
  editMode: TEditItemMode
): IEditItemState<R> => {
  const saveButtonText = item
    ? marker('edit.item.dialog.button.update')
    : marker('edit.item.dialog.button.create');

  const dialogTitle = item
    ? marker('edit.item.dialog.title.update')
    : marker('edit.item.dialog.title.create');

  return {
    ...state,
    isEditing: true,
    item,
    editMode,
    saveButtonText,
    dialogTitle,
  };
};
