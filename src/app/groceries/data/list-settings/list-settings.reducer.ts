import { createReducer, on } from '@ngrx/store';
import { IListSettings } from '../../model';
import { ListSettingsActions } from './list-settings.actions';

export const initialListSettings: IListSettings = {
  showQuickAdd: false,
  showQuickAddProduct: false,
  showQuickAddCategory: false,
  showProductsInShopping: false,
  showProductsInStorage: false,
  showShoppingInProducts: false,
  showShoppingInStorage: false,
  showStorageInProducts: false,
  showStorageInShopping: false,
};

export const listSettingsReducer = createReducer(
  initialListSettings,
  on(
    ListSettingsActions.updateSettings,
    (_state, { settings }): IListSettings => settings
  ),
  on(
    ListSettingsActions.loaded,
    (_state, { listSettings }): IListSettings => listSettings ?? _state
  )
);
